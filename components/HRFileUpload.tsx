import React, { useCallback, useState } from 'react';
import { UploadCloud, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { HRRecord } from '../types';

interface HRFileUploadProps {
  onDataLoaded: (data: HRRecord[], error?: string) => void;
  setIsLoading: (loading: boolean) => void;
}

const REQUIRED_COLUMNS = [
  'Empleado', 'Leg', 'Fecha', 'Tipo', 'Monto', 'Area', 'Actividad', 
  'Fecha Ingreso', 'Obra Social', 'Categoria', 'CUIL', 
  'Fecha de Nacimiento', 'Dias de Vacaciones', 'Estado/Fecha Baja'
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

const parseDate = (rawDate: any, rowIndex: number, fieldName: string): Date => {
    let fecha: Date | null = null;
    if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
        fecha = rawDate;
    } else if (typeof rawDate === 'number' && rawDate > 0 && rawDate < 2958466) { // Excel date serial number range
        const dateParts = XLSX.SSF.parse_date_code(rawDate);
        if (dateParts) fecha = new Date(dateParts.y, dateParts.m - 1, dateParts.d, dateParts.H, dateParts.M, dateParts.S);
    }
    if (!fecha || isNaN(fecha.getTime())) {
        throw new Error(`Formato de fecha inválido para '${fieldName}' en la fila ${rowIndex + 2}.`);
    }
    return fecha;
};


const HRFileUpload: React.FC<HRFileUploadProps> = ({ onDataLoaded, setIsLoading }) => {
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

        if (jsonData.length === 0) throw new Error("El archivo de RRHH está vacío.");

        const fileHeaders = Object.keys(jsonData[0]);
        const headerMap: { [key: string]: string } = {};
        const missingColumns: string[] = [];

        REQUIRED_COLUMNS.forEach(requiredCol => {
            const foundHeader = fileHeaders.find(h => h.trim().toLowerCase() === requiredCol.trim().toLowerCase());
            if (foundHeader) headerMap[requiredCol] = foundHeader;
            else missingColumns.push(requiredCol);
        });

        if (missingColumns.length > 0) {
          throw new Error(`Faltan columnas requeridas en el archivo de RRHH: ${missingColumns.join(', ')}.`);
        }

        const parsedData: HRRecord[] = jsonData.map((row, index) => {
          const fecha = parseDate(row[headerMap['Fecha']], index, 'Fecha');
          const fechaIngreso = parseDate(row[headerMap['Fecha Ingreso']], index, 'Fecha Ingreso');
          const fechaNacimiento = parseDate(row[headerMap['Fecha de Nacimiento']], index, 'Fecha de Nacimiento');
          
          const monto = parseArgentinianNumber(row[headerMap['Monto']]);
          if (isNaN(monto)) throw new Error(`Valor 'Monto' inválido en la fila ${index + 2}.`);

          const diasVacaciones = parseInt(String(row[headerMap['Dias de Vacaciones']]), 10);
          if (isNaN(diasVacaciones)) throw new Error(`Valor 'Dias de Vacaciones' inválido en la fila ${index + 2}.`);
          
          const rawBaja = row[headerMap['Estado/Fecha Baja']];
          let fechaBaja: Date | null = null;
          if (rawBaja && typeof rawBaja === 'string' && rawBaja.trim().toLowerCase() === 'activo') {
              fechaBaja = null;
          } else if (rawBaja) {
              fechaBaja = parseDate(rawBaja, index, 'Estado/Fecha Baja');
          }

          return {
            'Fecha': fecha,
            'Año': fecha.getFullYear(),
            'Mes': fecha.getMonth() + 1,
            'Empleado': String(row[headerMap['Empleado']] || 'N/A').trim(),
            'Leg': String(row[headerMap['Leg']] || 'N/A'),
            'Tipo': String(row[headerMap['Tipo']] || 'N/A').trim(),
            'Monto': monto,
            'Area': String(row[headerMap['Area']] || 'N/A').trim(),
            'Actividad': String(row[headerMap['Actividad']] || 'N/A').trim(),
            'Fecha Ingreso': fechaIngreso,
            'Obra Social': String(row[headerMap['Obra Social']] || 'N/A').trim(),
            'Categoria': String(row[headerMap['Categoria']] || 'N/A').trim(),
            'CUIL': String(row[headerMap['CUIL']] || 'N/A').trim(),
            'Fecha de Nacimiento': fechaNacimiento,
            'Dias de Vacaciones': diasVacaciones,
            'Fecha Baja': fechaBaja,
          };
        });
        onDataLoaded(parsedData);
      } catch (error) {
        setFileName(null);
        const message = error instanceof Error ? error.message : String(error);
        onDataLoaded([], `Error al procesar archivo de RRHH: ${message}`);
      }
  }, [onDataLoaded, setIsLoading]);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <label htmlFor="hr-dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-pizarro-blue-300 border-dashed rounded-lg cursor-pointer bg-pizarro-blue-50 hover:bg-pizarro-blue-100 transition-colors">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <UploadCloud className="w-10 h-10 mb-3 text-pizarro-blue-500" />
          <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click para cargar</span> o arrastre</p>
          <p className="text-xs text-gray-500">Excel (.xlsx) o CSV</p>
        </div>
        <input id="hr-dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept=".xlsx, .csv" />
      </label>
      {fileName && (
        <div className="mt-4 text-center text-gray-600">
          <p className="font-medium flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-green-500" /> Archivo cargado: {fileName}</p>
        </div>
      )}
    </div>
  );
};

export default HRFileUpload;