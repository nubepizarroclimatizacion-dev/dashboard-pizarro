import React, { useCallback, useState } from 'react';
import { UploadCloud, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ExpenseRecord } from '../types';

interface ExpenseFileUploadProps {
  onDataLoaded: (data: ExpenseRecord[], error?: string) => void;
  setIsLoading: (loading: boolean) => void;
}

const REQUIRED_COLUMNS = [
  'Fecha', 'Mes', 'Año', 'Categoría', 'Subcategoría', 'Detalle', 'Monto_ars'
];

const parseArgentinianNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const sanitized = value.trim().replace(/\./g, '').replace(',', '.');
        if (sanitized === '') return NaN;
        return parseFloat(sanitized);
    }
    return NaN;
};

const ExpenseFileUpload: React.FC<ExpenseFileUploadProps> = ({ onDataLoaded, setIsLoading }) => {
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setFileName(file.name);

    try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: null });

        if (jsonData.length === 0) throw new Error("El archivo de gastos está vacío.");

        const fileHeaders = Object.keys(jsonData[0]);
        const headerMap: { [key: string]: string } = {};
        const missingColumns: string[] = [];

        REQUIRED_COLUMNS.forEach(requiredCol => {
            const foundHeader = fileHeaders.find(fileHeader => fileHeader.trim().toLowerCase() === requiredCol.trim().toLowerCase());
            if (foundHeader) headerMap[requiredCol] = foundHeader;
            else missingColumns.push(requiredCol);
        });

        if (missingColumns.length > 0) {
          throw new Error(`Faltan columnas requeridas en el archivo de gastos: ${missingColumns.join(', ')}.`);
        }

        const parsedData: ExpenseRecord[] = jsonData.map((row, index) => {
          let fecha: Date | null = null;
          const rawDate = row[headerMap['Fecha']];
          if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
            fecha = rawDate;
          } else if (typeof rawDate === 'number' && rawDate > 0 && rawDate < 2958466) {
             const dateParts = XLSX.SSF.parse_date_code(rawDate);
             if (dateParts) fecha = new Date(dateParts.y, dateParts.m - 1, dateParts.d);
          }
          
          const year = parseInt(row[headerMap['Año']], 10);
          const month = parseInt(row[headerMap['Mes']], 10);
          
          if (!fecha) {
              if(!isNaN(year) && !isNaN(month) && year > 1900 && month >= 1 && month <= 12) {
                  fecha = new Date(year, month - 1, 15); // Default to middle of month
              } else {
                  throw new Error(`Formato de fecha, año o mes inválido en la fila ${index + 2}.`);
              }
          }
          
          const monto = parseArgentinianNumber(row[headerMap['Monto_ars']]);
          if (isNaN(monto)) {
              throw new Error(`Valor 'Monto_ars' inválido en la fila ${index + 2}. Debe ser un número.`);
          }

          return {
            'Fecha': fecha,
            'Año': fecha.getFullYear(),
            'Mes': fecha.getMonth() + 1,
            'Categoría': String(row[headerMap['Categoría']] || 'N/A').trim().toUpperCase(),
            'Subcategoría': String(row[headerMap['Subcategoría']] || 'N/A').trim().toUpperCase(),
            'Detalle': String(row[headerMap['Detalle']] || ''),
            'Monto_ars': monto,
          };
        });

        onDataLoaded(parsedData);
      } catch (error) {
        setFileName(null);
        const message = error instanceof Error ? error.message : String(error);
        onDataLoaded([], `Error al procesar archivo de gastos: ${message}`);
      } finally {
        setIsLoading(false);
      }
  }, [onDataLoaded, setIsLoading]);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <label htmlFor="expense-dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-pizarro-blue-300 border-dashed rounded-lg cursor-pointer bg-pizarro-blue-50 hover:bg-pizarro-blue-100 transition-colors">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <UploadCloud className="w-10 h-10 mb-3 text-pizarro-blue-500" />
          <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click para cargar</span> o arrastre</p>
          <p className="text-xs text-gray-500">Excel (.xlsx) o CSV</p>
        </div>
        <input id="expense-dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept=".xlsx, .csv" />
      </label>
      {fileName && (
        <div className="mt-4 text-center text-gray-600">
          <p className="font-medium flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-green-500" /> Archivo cargado: {fileName}</p>
        </div>
      )}
    </div>
  );
};

export default ExpenseFileUpload;
