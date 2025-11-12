import React, { useCallback, useState } from 'react';
import { UploadCloud, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { SaleRecord } from '../types';

interface FileUploadProps {
  onDataLoaded: (data: SaleRecord[], error?: string) => void;
  setIsLoading: (loading: boolean) => void;
}

const REQUIRED_COLUMNS = [
  'Suc', 'Tipo', 'Tipo Comp.', 'Cant', 'Fecha', 'Total', 'Cliente', 'ID VENDEDOR', 'Vendedor'
];

// Helper to parse numbers in es-AR format (e.g., "1.234,56")
const parseArgentinianNumber = (value: any): number => {
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'string') {
        // Remove thousand separators '.', then replace decimal comma ',' with a dot '.'
        const sanitized = value.trim().replace(/\./g, '').replace(',', '.');
        if (sanitized === '') return NaN;
        return parseFloat(sanitized);
    }
    return NaN;
};


const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, setIsLoading }) => {
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("No se pudo leer el archivo.");

        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: null // Keep empty cells as null
        });

        if (jsonData.length === 0) {
          throw new Error("El archivo está vacío o no tiene el formato correcto.");
        }

        // Robust column validation (case-insensitive and space-insensitive)
        const fileHeaders = Object.keys(jsonData[0]);
        const headerMap: { [key: string]: string } = {};
        const missingColumns: string[] = [];

        REQUIRED_COLUMNS.forEach(requiredCol => {
            const foundHeader = fileHeaders.find(fileHeader => fileHeader.trim().toLowerCase() === requiredCol.trim().toLowerCase());
            if (foundHeader) {
                headerMap[requiredCol] = foundHeader;
            } else {
                missingColumns.push(requiredCol);
            }
        });

        if (missingColumns.length > 0) {
          throw new Error(`Faltan las siguientes columnas requeridas: ${missingColumns.join(', ')}. Encabezados encontrados: ${fileHeaders.join(', ')}`);
        }

        // Clean and transform data using headerMap
        const parsedData: SaleRecord[] = jsonData.map((row, index) => {
          // --- Robust Date Parsing ---
          let fecha: Date | null = null;
          const rawDate = row[headerMap['Fecha']];

          if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
            fecha = rawDate;
          } else if (typeof rawDate === 'number' && rawDate > 0 && rawDate < 2958466) { // Safety range for Excel dates (1900-9999)
            try {
              const dateParts = XLSX.SSF.parse_date_code(rawDate);
              if (dateParts) {
                fecha = new Date(dateParts.y, dateParts.m - 1, dateParts.d, dateParts.H, dateParts.M, dateParts.S);
              }
            } catch (e) {
              // The library function might fail even with the guard.
              console.warn(`Could not parse date serial number in safe range: ${rawDate}`, e);
              fecha = null;
            }
          }

          if (!fecha || isNaN(fecha.getTime())) {
            throw new Error(`Formato de fecha inválido en la fila ${index + 2}. Valor encontrado: "${rawDate}"`);
          }

          // --- Robust Number Parsing ---
          const total = parseArgentinianNumber(row[headerMap['Total']]);
          if (isNaN(total)) {
             throw new Error(`Valor 'Total' inválido en la fila ${index + 2}. Debe ser un número.`);
          }

          const cant = parseInt(String(row[headerMap['Cant']]), 10);
           if (isNaN(cant)) {
             throw new Error(`Valor 'Cant' inválido en la fila ${index + 2}. Debe ser un número entero.`);
          }

          return {
            'Suc': String(row[headerMap['Suc']] || '').trim().toUpperCase(),
            'Tipo': String(row[headerMap['Tipo']] || '').trim().toLowerCase() === 'blanco' ? 'Blanco' : 'Negro',
            'Tipo Comp.': String(row[headerMap['Tipo Comp.']] || ''),
            'Cant': cant,
            'Fecha': fecha,
            'Total': total,
            'Cliente': String(row[headerMap['Cliente']] || ''),
            'ID VENDEDOR': Number(row[headerMap['ID VENDEDOR']]) || 0,
            'Vendedor': String(row[headerMap['Vendedor']] || '').trim().toUpperCase(),
          };
        });

        onDataLoaded(parsedData);
      } catch (error) {
        setFileName(null);
        onDataLoaded([], `Error al procesar el archivo: ${(error as Error).message}`);
      }
    };

    reader.onerror = () => {
        setFileName(null);
        onDataLoaded([], 'No se pudo leer el archivo.');
    };

    reader.readAsArrayBuffer(file);
  }, [onDataLoaded, setIsLoading]);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-pizarro-blue-300 border-dashed rounded-lg cursor-pointer bg-pizarro-blue-50 hover:bg-pizarro-blue-100 transition-colors">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <UploadCloud className="w-10 h-10 mb-3 text-pizarro-blue-500" />
          <p className="mb-2 text-sm text-gray-500">
            <span className="font-semibold">Click para cargar</span> o arrastre y suelte
          </p>
          <p className="text-xs text-gray-500">Excel (.xlsx) o CSV</p>
        </div>
        <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept=".xlsx, .csv" />
      </label>
      {fileName && (
        <div className="mt-4 text-center text-gray-600">
          <p className="font-medium flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-500" /> Archivo cargado: {fileName}
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;