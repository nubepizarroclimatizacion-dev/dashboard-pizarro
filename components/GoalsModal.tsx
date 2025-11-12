import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Target, Trash2, Edit, Plus, AlertCircle, UploadCloud, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { SalesGoal } from '../types';
import { formatCurrency } from '../utils/formatters';

interface GoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: SalesGoal[];
  setGoals: React.Dispatch<React.SetStateAction<SalesGoal[]>>;
  branches: string[];
  months: { name: string; num: number }[];
}

const CURRENT_YEAR = new Date().getFullYear();
const REQUIRED_GOAL_COLUMNS = ['Sucursal', 'Fecha', 'Año', 'Mes', 'Venta final con impuestos', 'Objetivo de ventas'];

const GoalsModal: React.FC<GoalsModalProps> = ({ isOpen, onClose, goals, setGoals, branches, months }) => {
  const [editingGoal, setEditingGoal] = useState<SalesGoal | null>(null);
  const [newGoal, setNewGoal] = useState<{ branch: string, year: number, month: number, goalAmount: number, actualAmount: number }>({
    branch: branches[0] || '',
    year: CURRENT_YEAR,
    month: 1,
    goalAmount: 0,
    actualAmount: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const monthNameMap = useMemo(() => {
    const map = new Map<string, number>();
    months.forEach(m => map.set(m.name.toLowerCase(), m.num));
    return map;
  }, [months]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setImportError(null);
      setImportSuccess(null);
      setIsImporting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingGoal) {
      setNewGoal({
        branch: editingGoal.branch,
        year: editingGoal.year,
        month: editingGoal.month,
        goalAmount: editingGoal.goalAmount,
        actualAmount: editingGoal.actualAmount,
      });
    } else {
      setNewGoal({
        branch: branches[0] || '',
        year: CURRENT_YEAR,
        month: new Date().getMonth() + 1,
        goalAmount: 0,
        actualAmount: 0,
      });
    }
    setError(null);
  }, [isOpen, editingGoal, branches]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewGoal(prev => ({ ...prev, [name]: name === 'goalAmount' ? parseFloat(value) || 0 : value }));
  };
  
  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const year = parseInt(e.target.value, 10);
      if (!isNaN(year) && year > 2000 && year < 2100) {
          setNewGoal(prev => ({ ...prev, year }));
      } else if (e.target.value === '') {
          setNewGoal(prev => ({ ...prev, year: 0 }));
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.branch || !newGoal.year || !newGoal.month || newGoal.goalAmount <= 0) {
      setError("Por favor, complete todos los campos y asegúrese que el objetivo sea mayor a cero.");
      return;
    }
    const goalId = `${newGoal.branch}-${newGoal.year}-${newGoal.month}`;
    const isDuplicate = goals.some(g => g.id === goalId && (!editingGoal || g.id !== editingGoal.id));
    if (isDuplicate) {
      setError("Ya existe un objetivo para esta sucursal en este mes y año.");
      return;
    }
    if (editingGoal) {
      setGoals(goals.map(g => g.id === editingGoal.id ? { ...g, ...newGoal, id: goalId, year: Number(newGoal.year), month: Number(newGoal.month) } : g));
      setEditingGoal(null);
    } else {
      const goalToAdd: SalesGoal = {
        id: goalId,
        branch: newGoal.branch,
        year: Number(newGoal.year),
        month: Number(newGoal.month),
        goalAmount: newGoal.goalAmount,
        actualAmount: newGoal.actualAmount,
      };
      setGoals([...goals, goalToAdd]);
    }
    setNewGoal({
      branch: branches[0] || '',
      year: CURRENT_YEAR,
      month: new Date().getMonth() + 1,
      goalAmount: 0,
      actualAmount: 0,
    });
    setError(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("¿Está seguro de que desea eliminar este objetivo?")) {
      setGoals(goals.filter(g => g.id !== id));
      if (editingGoal && editingGoal.id === id) setEditingGoal(null);
    }
  };
  
  const cancelEdit = () => setEditingGoal(null);

  const handleFileImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) throw new Error("El archivo está vacío.");

      const fileHeaders = Object.keys(jsonData[0]);
      const headerMap: { [key: string]: string } = {};
      const missingColumns: string[] = [];

      REQUIRED_GOAL_COLUMNS.forEach(col => {
        const found = fileHeaders.find(h => h.trim().toLowerCase() === col.toLowerCase());
        if (found) headerMap[col] = found;
        else missingColumns.push(col);
      });

      if (missingColumns.length > 0) throw new Error(`Faltan las columnas: ${missingColumns.join(', ')}`);

      const importedGoals: SalesGoal[] = jsonData.map((row, index) => {
        const branch = String(row[headerMap['Sucursal']] || '').trim().toUpperCase();
        const year = parseInt(row[headerMap['Año']], 10);
        const goalAmount = parseFloat(String(row[headerMap['Objetivo de ventas']] || '0').replace(',', '.'));
        const actualAmount = parseFloat(String(row[headerMap['Venta final con impuestos']] || '0').replace(',', '.'));
        
        const rawMonth = row[headerMap['Mes']];
        let month: number | undefined;

        if (typeof rawMonth === 'number') {
            month = rawMonth;
        } else if (typeof rawMonth === 'string') {
            month = monthNameMap.get(rawMonth.trim().toLowerCase());
        }

        if (!branch) throw new Error(`Falta la sucursal en la fila ${index + 2}.`);
        if (isNaN(year) || year < 2000 || year > 2100) throw new Error(`Formato de año inválido en la fila ${index + 2}.`);
        if (month === undefined || isNaN(month) || month < 1 || month > 12) throw new Error(`Formato de mes inválido en la fila ${index + 2}. Use un número (1-12) o el nombre completo (ej. "Enero").`);
        if (isNaN(goalAmount) || goalAmount < 0) throw new Error(`Monto de 'Objetivo de ventas' inválido en la fila ${index + 2}.`);
        if (isNaN(actualAmount)) throw new Error(`Monto de 'Venta final con impuestos' inválido en la fila ${index + 2}.`);

        return {
          id: `${branch}-${year}-${month}`,
          branch, year, month, goalAmount, actualAmount
        };
      });

      setGoals(currentGoals => {
          const goalsMap = new Map(currentGoals.map(g => [g.id, g]));
          importedGoals.forEach(g => goalsMap.set(g.id, g));
          return Array.from(goalsMap.values());
      });

      setImportSuccess(`${importedGoals.length} objetivos importados/actualizados correctamente.`);

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setImportError(`Error al importar: ${message}`);
    } finally {
      setIsImporting(false);
      event.target.value = ''; // Reset file input
    }
  }, [setGoals, monthNameMap]);

  const sortedGoals = [...goals].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    if (a.month !== b.month) return b.month - a.month;
    return a.branch.localeCompare(b.branch);
  });

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Target className="mr-2 text-pizarro-blue-600"/>
            Gestionar Objetivos de Venta
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </header>
        
        <div className="p-6 border-b">
             <h3 className="text-md font-semibold text-gray-700 mb-2">Importar desde Archivo</h3>
             <p className="text-sm text-gray-500 mb-3">Sube un archivo Excel o CSV con las columnas: <code className="text-xs bg-gray-100 p-1 rounded">Sucursal</code>, <code className="text-xs bg-gray-100 p-1 rounded">Fecha</code>, <code className="text-xs bg-gray-100 p-1 rounded">Año</code>, <code className="text-xs bg-gray-100 p-1 rounded">Mes</code>, <code className="text-xs bg-gray-100 p-1 rounded">Venta final con impuestos</code>, <code className="text-xs bg-gray-100 p-1 rounded">Objetivo de ventas</code>.</p>
             <label className={`flex items-center justify-center px-4 py-2 border border-dashed rounded-md cursor-pointer transition-colors ${isImporting ? 'bg-gray-100' : 'border-pizarro-blue-400 bg-pizarro-blue-50 hover:bg-pizarro-blue-100'}`}>
                {isImporting ? (
                    <>
                        <Loader2 className="w-5 h-5 mr-2 text-pizarro-blue-600 animate-spin" />
                        <span className="text-pizarro-blue-700 font-medium">Importando...</span>
                    </>
                ) : (
                    <>
                        <UploadCloud className="w-5 h-5 mr-2 text-pizarro-blue-600" />
                        <span className="text-pizarro-blue-700 font-medium">Seleccionar archivo para importar</span>
                    </>
                )}
                 <input type="file" className="hidden" onChange={handleFileImport} accept=".xlsx, .csv" disabled={isImporting} />
             </label>
            {importError && <p className="text-red-600 text-sm mt-2">{importError}</p>}
            {importSuccess && <p className="text-green-600 text-sm mt-2">{importSuccess}</p>}
        </div>

        <main className="p-6 flex-grow overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
              {editingGoal ? 'Editar Objetivo' : 'Nuevo Objetivo Manual'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="branch" className="block text-sm font-medium text-gray-700">Sucursal</label>
                <select id="branch" name="branch" value={newGoal.branch} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-pizarro-blue-500 focus:border-pizarro-blue-500 sm:text-sm rounded-md" disabled={!!editingGoal}>
                  {branches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
               <div className="flex gap-4">
                  <div className="flex-1">
                      <label htmlFor="month" className="block text-sm font-medium text-gray-700">Mes</label>
                      <select id="month" name="month" value={newGoal.month} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-pizarro-blue-500 focus:border-pizarro-blue-500 sm:text-sm rounded-md" disabled={!!editingGoal}>
                          {months.map(m => <option key={m.num} value={m.num}>{m.name}</option>)}
                      </select>
                  </div>
                  <div className="flex-1">
                      <label htmlFor="year" className="block text-sm font-medium text-gray-700">Año</label>
                      <input type="number" id="year" name="year" value={newGoal.year || ''} onChange={handleYearChange} className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-pizarro-blue-500 focus:border-pizarro-blue-500 sm:text-sm rounded-md" placeholder="YYYY" disabled={!!editingGoal} />
                  </div>
              </div>
              <div>
                <label htmlFor="goalAmount" className="block text-sm font-medium text-gray-700">Monto del Objetivo ($)</label>
                <input type="number" id="goalAmount" name="goalAmount" value={newGoal.goalAmount || ''} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-pizarro-blue-500 focus:border-pizarro-blue-500 sm:text-sm rounded-md" placeholder="e.g., 500000" />
              </div>

              {error && (
                <div className="text-red-600 text-sm flex items-start">
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5"/> 
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center gap-4 pt-2">
                <button type="submit" className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pizarro-blue-600 hover:bg-pizarro-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pizarro-blue-500">
                  <Plus className="w-4 h-4 mr-2"/>
                  {editingGoal ? 'Guardar Cambios' : 'Agregar Objetivo'}
                </button>
                {editingGoal && (
                    <button type="button" onClick={cancelEdit} className="text-sm text-gray-600 hover:text-gray-900">
                        Cancelar
                    </button>
                )}
              </div>
            </form>
          </div>

          <div className="md:col-span-2 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Objetivos Existentes</h3>
            <div className="space-y-3 pr-2">
                {sortedGoals.length > 0 ? sortedGoals.map(goal => {
                    const monthName = months.find(m => m.num === goal.month)?.name;
                    return (
                        <div key={goal.id} className="bg-gray-50 p-3 rounded-md border border-gray-200 flex justify-between items-center">
                            <div>
                                <p className="font-bold text-gray-800">{goal.branch}</p>
                                <p className="text-sm text-gray-600">{monthName} {goal.year}</p>
                                <p className="text-sm font-semibold text-pizarro-blue-700 mt-1">{formatCurrency(goal.goalAmount)}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => setEditingGoal(goal)} className="p-1 text-gray-500 hover:text-pizarro-blue-600"><Edit className="w-4 h-4"/></button>
                                <button onClick={() => handleDelete(goal.id)} className="p-1 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                            </div>
                        </div>
                    )
                }) : (
                    <div className="text-center py-10 text-gray-500">
                        <p>No se han definido objetivos.</p>
                        <p className="text-xs mt-1">Use el formulario o importe un archivo para agregarlos.</p>
                    </div>
                )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GoalsModal;