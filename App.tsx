

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Settings, Target, FileUp, BarChart3, ShoppingCart, TrendingUp, ReceiptText, Briefcase, Archive, LogOut, User as UserIcon, Loader2 } from 'lucide-react';
import UploadModal from './components/UploadModal';
import Dashboard from './components/Dashboard';
import PurchasesDashboard from './components/PurchasesDashboard';
import ExpensesDashboard from './components/ExpensesDashboard';
import HRDashboard from './components/HRDashboard';
import StockDashboard from './components/StockDashboard';
import FilterControls from './components/FilterControls';
import PurchasesFilterControls from './components/PurchasesFilterControls';
import ExpensesFilterControls from './components/ExpensesFilterControls';
import HRFilterControls from './components/HRFilterControls';
import StockFilterControls from './components/StockFilterControls';
import ManagementModal from './components/ManagementModal';
import GoalsModal from './components/GoalsModal';
import GoalComplianceDashboard from './components/GoalComplianceDashboard';
import ExportButtons from './components/ExportButtons';
import { SaleRecord, AnalysisResults, ColorMap, SalesGoal, PurchaseRecord, PurchasesAnalysisResults, ExpenseRecord, ExpensesAnalysisResults, HRRecord, HRAnalysisResults, StockRecord, StockAnalysisResults } from './types';
import { processSalesData, isCreditNote, isDebitNote, processPurchasesData, processExpensesData, processHRData, processStockData } from './services/dataProcessor';
import { generateColorMap } from './utils/colorGenerator';
import * as api from './services/api'; // UPDATED: Import simulated API service
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';


const MONTHS = [
  { name: 'Enero', num: 1 }, { name: 'Febrero', num: 2 }, { name: 'Marzo', num: 3 },
  { name: 'Abril', num: 4 }, { name: 'Mayo', num: 5 }, { name: 'Junio', num: 6 },
  { name: 'Julio', num: 7 }, { name: 'Agosto', num: 8 }, { name: 'Septiembre', num: 9 },
  { name: 'Octubre', num: 10 }, { name: 'Noviembre', num: 11 }, { name: 'Diciembre', num: 12 }
];

const INITIAL_SALES_FILTERS = { branches: [], salespeople: [], years: [], months: [], startDate: null, endDate: null };
const INITIAL_PURCHASES_FILTERS = { providers: [], years: [], months: [], modalities: [] };
const INITIAL_EXPENSES_FILTERS = { categories: [], subcategories: [], years: [], months: [] };
const INITIAL_HR_FILTERS = { years: [], months: [], areas: [], activities: [], types: [] };
const INITIAL_STOCK_FILTERS = { years: [], months: [], sucursales: [], rubros: [] };


// Custom hook for debouncing a value
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}


const AppContent: React.FC = () => {
  const { currentUser, logout } = useAuth();
  // --- STATE MANAGEMENT ---
  const [allSalesData, setAllSalesData] = useState<SaleRecord[]>([]);
  const [allPurchasesData, setAllPurchasesData] = useState<PurchaseRecord[]>([]);
  const [allExpensesData, setAllExpensesData] = useState<ExpenseRecord[]>([]);
  const [allHRData, setAllHRData] = useState<HRRecord[]>([]);
  const [allStockData, setAllStockData] = useState<StockRecord[]>([]);
  
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true); // NEW: State for initial data load
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [salesFilters, setSalesFilters] = useState(INITIAL_SALES_FILTERS);
  const [purchasesFilters, setPurchasesFilters] = useState(INITIAL_PURCHASES_FILTERS);
  const [expensesFilters, setExpensesFilters] = useState(INITIAL_EXPENSES_FILTERS);
  const [hrFilters, setHrFilters] = useState(INITIAL_HR_FILTERS);
  const [stockFilters, setStockFilters] = useState(INITIAL_STOCK_FILTERS);
  
  // Debounce filters to avoid excessive recalculations
  const debouncedSalesFilters = useDebounce(salesFilters, 500);
  const debouncedPurchasesFilters = useDebounce(purchasesFilters, 500);
  const debouncedExpensesFilters = useDebounce(expensesFilters, 500);
  const debouncedHRFilters = useDebounce(hrFilters, 500);
  const debouncedStockFilters = useDebounce(stockFilters, 500);


  const [colorMap, setColorMap] = useState<ColorMap>(() => {
    try {
      const savedMap = localStorage.getItem('salesDashboardColorMap');
      return savedMap ? JSON.parse(savedMap) : {};
    } catch { return {}; }
  });

  const [salesGoals, setSalesGoals] = useState<SalesGoal[]>(() => {
    try {
        const savedGoals = localStorage.getItem('salesDashboardGoals');
        return savedGoals ? JSON.parse(savedGoals) : [];
    } catch { return []; }
  });
  
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<'sales' | 'purchases' | 'goals' | 'expenses' | 'hr' | 'stock'>('sales');

  const salesDashboardRef = useRef<HTMLDivElement>(null);
  const purchasesDashboardRef = useRef<HTMLDivElement>(null);
  const goalsDashboardRef = useRef<HTMLDivElement>(null);
  const expensesDashboardRef = useRef<HTMLDivElement>(null);
  const hrDashboardRef = useRef<HTMLDivElement>(null);
  const stockDashboardRef = useRef<HTMLDivElement>(null);

    // --- UPDATED: Load all data from simulated API on initial mount ---
  useEffect(() => {
    const loadDataFromDB = async () => {
      try {
        const storedData = await api.loadAllData();
        // Dates are stored as strings in JSON, need to parse them back to Date objects
        if (storedData.sales) setAllSalesData(storedData.sales.map(s => ({...s, Fecha: new Date(s.Fecha)})));
        if (storedData.purchases) setAllPurchasesData(storedData.purchases.map(p => ({...p, Fecha: new Date(p.Fecha)})));
        if (storedData.expenses) setAllExpensesData(storedData.expenses.map(e => ({...e, Fecha: new Date(e.Fecha)})));
        if (storedData.hr) setAllHRData(storedData.hr.map(h => ({...h, Fecha: new Date(h.Fecha), 'Fecha Ingreso': new Date(h['Fecha Ingreso']), 'Fecha de Nacimiento': new Date(h['Fecha de Nacimiento']), 'Fecha Baja': h['Fecha Baja'] ? new Date(h['Fecha Baja']) : null })));
        if (storedData.stock) setAllStockData(storedData.stock.map(s => ({...s, Fecha: new Date(s.Fecha)})));
      } catch (err) {
        console.error("Failed to load data from storage:", err);
        setError("No se pudieron cargar los datos guardados. Por favor, contacte a un administrador.");
      } finally {
        setIsDataLoading(false);
      }
    };
    loadDataFromDB();
  }, []);

  // --- DERIVED STATE & MEMOS ---
  const salesFilterOptions = useMemo(() => {
    if (allSalesData.length === 0) return { branches: [], salespeople: [], years: [], clients: [] };
    const branches = [...new Set(allSalesData.map(d => d.Suc))].sort();
    const salespeople = [...new Set(allSalesData.map(d => d.Vendedor))].sort();
    // FIX: Cast sort parameters to string to avoid localeCompare error on unknown type
    const years = [...new Set(allSalesData.map(d => d.Fecha.getFullYear().toString()))].sort((a, b) => String(b).localeCompare(String(a)));
    const clients = [...new Set(allSalesData.map(d => d.Cliente))].sort();
    return { branches, salespeople, years, clients };
  }, [allSalesData]);
  
  const purchasesFilterOptions = useMemo(() => {
    if (allPurchasesData.length === 0) return { providers: [], years: [] };
    const providers = [...new Set(allPurchasesData.map(p => p.Proveedor))].sort();
    // FIX: Cast sort parameters to string to avoid localeCompare error on unknown type
    const years = [...new Set(allPurchasesData.map(p => p.Año.toString()))].sort((a,b) => String(b).localeCompare(String(a)));
    return { providers, years };
  }, [allPurchasesData]);

  const expensesFilterOptions = useMemo(() => {
    if (allExpensesData.length === 0) return { categories: [], subcategories: [], years: [] };
    const categories = [...new Set(allExpensesData.map(e => e.Categoría))].sort();
    const subcategories = [...new Set(allExpensesData.map(e => e.Subcategoría))].sort();
    // FIX: Cast sort parameters to string to avoid localeCompare error on unknown type
    const years = [...new Set(allExpensesData.map(e => e.Año.toString()))].sort((a, b) => String(b).localeCompare(String(a)));
    return { categories, subcategories, years };
  }, [allExpensesData]);
  
  const hrFilterOptions = useMemo(() => {
    if (allHRData.length === 0) return { years: [], areas: [], activities: [], types: [] };
    // FIX: Cast sort parameters to string to avoid localeCompare error on unknown type
    const years = [...new Set(allHRData.map(e => e.Año.toString()))].sort((a, b) => String(b).localeCompare(String(a)));
    const areas = [...new Set(allHRData.map(e => e.Area))].sort();
    const activities = [...new Set(allHRData.map(e => e.Actividad))].sort();
    const types = [...new Set(allHRData.map(e => e.Tipo))].sort();
    return { years, areas, activities, types };
  }, [allHRData]);

  const stockFilterOptions = useMemo(() => {
    if (allStockData.length === 0) return { years: [], sucursales: [], rubros: [] };
    // FIX: Cast sort parameters to string to avoid localeCompare error on unknown type
    const years = [...new Set(allStockData.map(e => e.Año.toString()))].sort((a, b) => String(b).localeCompare(String(a)));
    const sucursales = [...new Set(allStockData.map(e => e.Suc))].sort();
    const rubros = [...new Set(allStockData.map(e => e['Rubro productos']))].sort();
    return { years, sucursales, rubros };
  }, [allStockData]);


  // --- DATA PROCESSING & EFFECTS ---
  useEffect(() => { localStorage.setItem('salesDashboardColorMap', JSON.stringify(colorMap)); }, [colorMap]);
  useEffect(() => { localStorage.setItem('salesDashboardGoals', JSON.stringify(salesGoals)); }, [salesGoals]);

  useEffect(() => {
    if (allSalesData.length > 0) {
      const allItems = [
        ...salesFilterOptions.branches, ...salesFilterOptions.salespeople, ...salesFilterOptions.clients
      ];
      setColorMap(prevMap => generateColorMap(allItems, prevMap));
    }
  }, [allSalesData, salesFilterOptions]);

  // Memoize filtered data to avoid re-calculating on every render
  const filteredSalesData = useMemo(() => {
    return allSalesData.filter(d => {
      const year = d.Fecha.getFullYear().toString();
      const month = d.Fecha.getMonth() + 1;
      return (debouncedSalesFilters.branches.length === 0 || debouncedSalesFilters.branches.includes(d.Suc)) &&
             (debouncedSalesFilters.salespeople.length === 0 || debouncedSalesFilters.salespeople.includes(d.Vendedor)) &&
             (debouncedSalesFilters.years.length === 0 || debouncedSalesFilters.years.includes(year)) &&
             (debouncedSalesFilters.months.length === 0 || debouncedSalesFilters.months.includes(month)) &&
             (!debouncedSalesFilters.startDate || d.Fecha >= debouncedSalesFilters.startDate) &&
             (!debouncedSalesFilters.endDate || d.Fecha <= debouncedSalesFilters.endDate);
    });
  }, [allSalesData, debouncedSalesFilters]);

  const filteredPurchasesData = useMemo(() => {
    return allPurchasesData.filter(p => {
        return (debouncedPurchasesFilters.providers.length === 0 || debouncedPurchasesFilters.providers.includes(p.Proveedor)) &&
               (debouncedPurchasesFilters.years.length === 0 || debouncedPurchasesFilters.years.includes(p.Año.toString())) &&
               (debouncedPurchasesFilters.months.length === 0 || debouncedPurchasesFilters.months.includes(p.Mes)) &&
               (debouncedPurchasesFilters.modalities.length === 0 || debouncedPurchasesFilters.modalities.includes(p.Modalidad));
    });
  }, [allPurchasesData, debouncedPurchasesFilters]);

  const filteredExpensesData = useMemo(() => {
    return allExpensesData.filter(e => {
        return (debouncedExpensesFilters.categories.length === 0 || debouncedExpensesFilters.categories.includes(e.Categoría)) &&
               (debouncedExpensesFilters.subcategories.length === 0 || debouncedExpensesFilters.subcategories.includes(e.Subcategoría)) &&
               (debouncedExpensesFilters.years.length === 0 || debouncedExpensesFilters.years.includes(e.Año.toString())) &&
               (debouncedExpensesFilters.months.length === 0 || debouncedExpensesFilters.months.includes(e.Mes));
    });
  }, [allExpensesData, debouncedExpensesFilters]);

  const filteredHRData = useMemo(() => {
    return allHRData.filter(h => {
        return (debouncedHRFilters.years.length === 0 || debouncedHRFilters.years.includes(h.Año.toString())) &&
               (debouncedHRFilters.months.length === 0 || debouncedHRFilters.months.includes(h.Mes)) &&
               (debouncedHRFilters.areas.length === 0 || debouncedHRFilters.areas.includes(h.Area)) &&
               (debouncedHRFilters.activities.length === 0 || debouncedHRFilters.activities.includes(h.Actividad)) &&
               (debouncedHRFilters.types.length === 0 || debouncedHRFilters.types.includes(h.Tipo));
    });
  }, [allHRData, debouncedHRFilters]);

  const filteredStockData = useMemo(() => {
    return allStockData.filter(s => {
        return (debouncedStockFilters.years.length === 0 || debouncedStockFilters.years.includes(s.Año.toString())) &&
               (debouncedStockFilters.months.length === 0 || debouncedStockFilters.months.includes(s.Mes)) &&
               (debouncedStockFilters.sucursales.length === 0 || debouncedStockFilters.sucursales.includes(s.Suc)) &&
               (debouncedStockFilters.rubros.length === 0 || debouncedStockFilters.rubros.includes(s['Rubro productos']));
    });
  }, [allStockData, debouncedStockFilters]);

  // Memoize analysis results to avoid re-processing on every render
  const salesAnalysisResults = useMemo(() => {
      if (filteredSalesData.length === 0) return null;
      return processSalesData(filteredSalesData, debouncedSalesFilters, allSalesData);
  }, [filteredSalesData, debouncedSalesFilters, allSalesData]);

  const purchasesAnalysisResults = useMemo(() => {
      if (filteredPurchasesData.length === 0) return null;
      return processPurchasesData(filteredPurchasesData, allSalesData);
  }, [filteredPurchasesData, allSalesData]);

  const expensesAnalysisResults = useMemo(() => {
      if (filteredExpensesData.length === 0) return null;
      return processExpensesData(filteredExpensesData, allExpensesData);
  }, [filteredExpensesData, allExpensesData]);
  
  const hrAnalysisResults = useMemo(() => {
      // Return results even if filtered data is empty to show roster-based info
      return processHRData(filteredHRData, allHRData, debouncedHRFilters);
  }, [filteredHRData, allHRData, debouncedHRFilters]);

  const stockAnalysisResults = useMemo(() => {
      if (allStockData.length === 0) return null;
      return processStockData(
        filteredStockData, 
        allStockData, 
        debouncedStockFilters,
        allSalesData,
        allPurchasesData,
        allExpensesData,
        allHRData
      );
  }, [
    filteredStockData, 
    allStockData, 
    debouncedStockFilters, 
    allSalesData, 
    allPurchasesData, 
    allExpensesData, 
    allHRData
  ]);

  useEffect(() => {
      if (allSalesData.length > 0) {
          setSalesGoals(currentGoals => {
              const salesByPeriod: { [key: string]: number } = {};
              allSalesData.forEach(rec => {
                  if (isDebitNote(rec)) return;
                  const key = `${rec.Suc}-${rec.Fecha.getFullYear()}-${rec.Fecha.getMonth() + 1}`;
                  const amount = isCreditNote(rec) ? -Math.abs(rec.Total) : Math.abs(rec.Total);
                  salesByPeriod[key] = (salesByPeriod[key] || 0) + amount;
              });
              return currentGoals.map(goal => ({ ...goal, actualAmount: salesByPeriod[`${goal.branch}-${goal.year}-${goal.month}`] || 0 }));
          });
      }
  }, [allSalesData]);

  // --- HANDLERS (UPDATED to use API service) ---
  const handleSalesDataLoaded = useCallback((data: SaleRecord[], errorMsg?: string) => {
    if (errorMsg) { setError(errorMsg); if (data.length === 0) { setAllSalesData([]); api.saveData('sales', []); } } 
    else { setError(null); setAllSalesData(data); setActiveView('sales'); api.saveData('sales', data); }
    setIsLoading(false);
  }, []);

  const handlePurchasesDataLoaded = useCallback((data: PurchaseRecord[], errorMsg?: string) => {
    if (errorMsg) { setError(errorMsg); if (data.length === 0) { setAllPurchasesData([]); api.saveData('purchases', []); } } 
    else { setError(null); setAllPurchasesData(data); setActiveView('purchases'); api.saveData('purchases', data); }
    setIsLoading(false);
  }, []);

  const handleExpensesDataLoaded = useCallback((data: ExpenseRecord[], errorMsg?: string) => {
    if (errorMsg) {
      setError(errorMsg);
      if (data.length === 0) { setAllExpensesData([]); api.saveData('expenses', []); }
    } else {
      setError(null);
      setAllExpensesData(data);
      api.saveData('expenses', data);
      setActiveView('expenses');
      if (data.length > 0) {
        const latestRecord = data.reduce((latest, current) => current.Fecha > latest.Fecha ? current : latest);
        setExpensesFilters({
          ...INITIAL_EXPENSES_FILTERS,
          years: [latestRecord.Año.toString()],
          months: [latestRecord.Mes],
        });
      }
    }
    setIsLoading(false);
  }, []);
  
  const handleHRDataLoaded = useCallback((data: HRRecord[], errorMsg?: string) => {
    if (errorMsg) {
      setError(errorMsg);
      if (data.length === 0) { setAllHRData([]); api.saveData('hr', []); }
    } else {
      setError(null);
      setAllHRData(data);
      api.saveData('hr', data);
      setActiveView('hr');
      if (data.length > 0) {
        const latestRecord = data.reduce((latest, current) => current.Fecha > latest.Fecha ? current : latest);
        setHrFilters({
          ...INITIAL_HR_FILTERS,
          years: [latestRecord.Año.toString()],
          months: [latestRecord.Mes],
        });
      }
    }
    setIsLoading(false);
  }, []);
  
  const handleStockDataLoaded = useCallback((data: StockRecord[], errorMsg?: string) => {
    if (errorMsg) {
      setError(errorMsg);
      if (data.length === 0) { setAllStockData([]); api.saveData('stock', []); }
    } else {
      setError(null);
      setAllStockData(data);
      api.saveData('stock', data);
      setActiveView('stock');
      if (data.length > 0) {
        const latestRecord = data.reduce((latest, current) => current.Fecha > latest.Fecha ? current : latest);
        setStockFilters({
          ...INITIAL_STOCK_FILTERS,
          years: [latestRecord.Año.toString()],
          months: [latestRecord.Mes],
        });
      }
    }
    setIsLoading(false);
  }, []);

  const handleSalesFilterChange = useCallback((filterName: string, value: any) => {
    const dateValue = (filterName === 'startDate' || filterName === 'endDate') ? (value ? new Date(value + 'T00:00:00') : null) : value;
    setSalesFilters(prev => ({ ...prev, [filterName]: dateValue }));
  }, []);
  
  const handlePurchasesFilterChange = useCallback((filterName: string, value: any) => {
    setPurchasesFilters(prev => ({ ...prev, [filterName]: value }));
  }, []);

  const handleExpensesFilterChange = useCallback((filterName: string, value: any) => {
    setExpensesFilters(prev => ({ ...prev, [filterName]: value }));
  }, []);
  
  const handleHRFilterChange = useCallback((filterName: string, value: any) => {
    setHrFilters(prev => ({ ...prev, [filterName]: value }));
  }, []);
  
  const handleStockFilterChange = useCallback((filterName: string, value: any) => {
    setStockFilters(prev => ({ ...prev, [filterName]: value }));
  }, []);

  const handleResetSalesFilters = useCallback(() => { setSalesFilters(INITIAL_SALES_FILTERS); }, []);
  const handleResetPurchasesFilters = useCallback(() => { setPurchasesFilters(INITIAL_PURCHASES_FILTERS); }, []);
  const handleResetExpensesFilters = useCallback(() => { setExpensesFilters(INITIAL_EXPENSES_FILTERS); }, []);
  const handleResetHRFilters = useCallback(() => { setHrFilters(INITIAL_HR_FILTERS); }, []);
  const handleResetStockFilters = useCallback(() => { setStockFilters(INITIAL_STOCK_FILTERS); }, []);
  
 const handleExport = useCallback(async (format: 'png' | 'pdf') => {
      let elementToCapture: HTMLDivElement | null = null;
      if (activeView === 'sales') elementToCapture = salesDashboardRef.current;
      else if (activeView === 'purchases') elementToCapture = purchasesDashboardRef.current;
      else if (activeView === 'goals') elementToCapture = goalsDashboardRef.current;
      else if (activeView === 'expenses') elementToCapture = expensesDashboardRef.current;
      else if (activeView === 'hr') elementToCapture = hrDashboardRef.current;
      else if (activeView === 'stock') elementToCapture = stockDashboardRef.current;
      
      if (!elementToCapture) return;
      setIsExporting(true);

      const truncatedElements = elementToCapture.querySelectorAll('.truncate');
      truncatedElements.forEach(el => el.classList.remove('truncate'));

      try {
          await new Promise(resolve => setTimeout(resolve, 50));
          const canvas = await html2canvas(elementToCapture, { scale: 2, useCORS: true, logging: false, backgroundColor: '#f9fafb' });
          const imgData = canvas.toDataURL('image/png');
          const fileName = `pizarro-reporte-${activeView}-${new Date().toISOString().split('T')[0]}`;

          if (format === 'png') {
              const link = document.createElement('a');
              link.href = imgData;
              link.download = `${fileName}.png`;
              link.click();
          } else {
              const pdf = new jsPDF({ orientation: canvas.width > canvas.height ? 'landscape' : 'portrait', unit: 'px', format: 'a4' });
              const { width: pdfWidth, height: pdfHeight } = pdf.internal.pageSize;
              const canvasAspectRatio = canvas.width / canvas.height;
              const pdfAspectRatio = pdfWidth / pdfHeight;
              let finalCanvasWidth = canvasAspectRatio > pdfAspectRatio ? pdfWidth : pdfHeight * canvasAspectRatio;
              let finalCanvasHeight = canvasAspectRatio > pdfAspectRatio ? pdfWidth / canvasAspectRatio : pdfHeight;
              const x = (pdfWidth - finalCanvasWidth) / 2;
              const y = (pdfHeight - finalCanvasHeight) / 2;
              pdf.addImage(imgData, 'PNG', x, y, finalCanvasWidth, finalCanvasHeight);
              pdf.save(`${fileName}.pdf`);
          }
      } catch (err) {
          console.error("Export failed:", err);
          alert("Hubo un error al exportar el dashboard.");
      } finally {
          truncatedElements.forEach(el => el.classList.add('truncate'));
          setIsExporting(false);
      }
  }, [activeView]);
  
  const goalKpis = useMemo(() => {
      if (!salesAnalysisResults) return null;
      const relevantGoals = salesGoals.filter(g => {
          const goalDate = new Date(g.year, g.month - 1, 15);
          return (debouncedSalesFilters.branches.length === 0 || debouncedSalesFilters.branches.includes(g.branch)) &&
                 (debouncedSalesFilters.years.length === 0 || debouncedSalesFilters.years.includes(g.year.toString())) &&
                 (debouncedSalesFilters.months.length === 0 || debouncedSalesFilters.months.includes(g.month)) &&
                 (!debouncedSalesFilters.startDate || goalDate >= debouncedSalesFilters.startDate) &&
                 (!debouncedSalesFilters.endDate || goalDate <= debouncedSalesFilters.endDate);
      });
      if (relevantGoals.length === 0) return null;
      const totalGoal = relevantGoals.reduce((sum, g) => sum + g.goalAmount, 0);
      const totalActual = relevantGoals.reduce((sum, g) => sum + g.actualAmount, 0);
      const achievement = totalGoal > 0 ? (totalActual / totalGoal) * 100 : 0;
      return { totalGoal, totalActual, achievement, difference: totalActual - totalGoal };
  }, [salesAnalysisResults, salesGoals, debouncedSalesFilters]);

  // --- RENDER ---
  const noDataLoaded = allSalesData.length === 0 && allPurchasesData.length === 0 && allExpensesData.length === 0 && allHRData.length === 0 && allStockData.length === 0;

  if (!currentUser) {
    return <Login />;
  }

  // UPDATED: Initial loading screen
  if (isDataLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 text-gray-700">
            <Loader2 className="w-12 h-12 animate-spin text-pizarro-blue-600 mb-4" />
            <p className="text-lg font-semibold">Cargando datos...</p>
        </div>
    );
  }

  const getActiveIcon = () => {
      switch(activeView) {
          case 'sales': return <BarChart3 className="w-8 h-8 text-pizarro-blue-600" />;
          case 'purchases': return <ShoppingCart className="w-8 h-8 text-pizarro-blue-600" />;
          case 'expenses': return <ReceiptText className="w-8 h-8 text-pizarro-blue-600" />;
          case 'hr': return <Briefcase className="w-8 h-8 text-pizarro-blue-600" />;
          case 'stock': return <Archive className="w-8 h-8 text-pizarro-blue-600" />;
          case 'goals': return <Target className="w-8 h-8 text-pizarro-blue-600" />;
          default: return <BarChart3 className="w-8 h-8 text-pizarro-blue-600" />;
      }
  };

  const getActiveTitle = () => {
    switch(activeView) {
        case 'sales': return 'Dashboard de Ventas';
        case 'purchases': return 'Dashboard de Compras';
        case 'expenses': return 'Dashboard de Gastos';
        case 'hr': return 'Dashboard de RRHH';
        case 'stock': return 'Dashboard de Stock';
        case 'goals': return 'Análisis de Objetivos';
        default: return 'Dashboard';
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans flex flex-col">
      <header className="bg-white shadow-md sticky top-0 z-30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
                <div className="flex items-center">
                    {getActiveIcon()}
                    <h1 className="text-2xl font-bold text-gray-800 ml-3">{getActiveTitle()}</h1>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="hidden sm:flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-full">
                        <UserIcon className="w-5 h-5 text-gray-500"/>
                        <span className="text-sm font-medium text-gray-700">{currentUser.username}</span>
                        <span className="text-xs text-white bg-pizarro-blue-600 px-2 py-0.5 rounded-full">{currentUser.role === 'admin' ? 'Admin' : 'Lector'}</span>
                    </div>
                    {!noDataLoaded && <ExportButtons onExport={handleExport} isExporting={isExporting} />}
                    {currentUser.role === 'admin' && <button onClick={() => setIsUploadModalOpen(true)} className="p-2 rounded-full hover:bg-gray-200 transition-colors" title="Cargar Archivos"><FileUp className="w-6 h-6 text-gray-600"/></button>}
                    {currentUser.role === 'admin' && allSalesData.length > 0 && <button onClick={() => setIsGoalsModalOpen(true)} className="p-2 rounded-full hover:bg-gray-200 transition-colors" title="Gestionar Objetivos"><Target className="w-6 h-6 text-gray-600"/></button>}
                    <button onClick={() => setIsManagementModalOpen(true)} className="p-2 rounded-full hover:bg-gray-200 transition-colors" title="Gestión y Configuración"><Settings className="w-6 h-6 text-gray-600"/></button>
                    <button onClick={logout} className="p-2 rounded-full hover:bg-gray-200 transition-colors" title="Cerrar Sesión"><LogOut className="w-6 h-6 text-red-600"/></button>
                </div>
            </div>
            {!noDataLoaded && (
                <nav className="border-t border-gray-200">
                    <div className="flex space-x-1">
                        {allSalesData.length > 0 && <button onClick={() => setActiveView('sales')} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeView === 'sales' ? 'border-pizarro-blue-600 text-pizarro-blue-600' : 'border-transparent text-gray-500 hover:border-gray-300'}`}>Ventas</button>}
                        {allPurchasesData.length > 0 && <button onClick={() => setActiveView('purchases')} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeView === 'purchases' ? 'border-pizarro-blue-600 text-pizarro-blue-600' : 'border-transparent text-gray-500 hover:border-gray-300'}`}>Compras</button>}
                        {allExpensesData.length > 0 && <button onClick={() => setActiveView('expenses')} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeView === 'expenses' ? 'border-pizarro-blue-600 text-pizarro-blue-600' : 'border-transparent text-gray-500 hover:border-gray-300'}`}>Gastos</button>}
                        {allHRData.length > 0 && <button onClick={() => setActiveView('hr')} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeView === 'hr' ? 'border-pizarro-blue-600 text-pizarro-blue-600' : 'border-transparent text-gray-500 hover:border-gray-300'}`}>RRHH</button>}
                        {allStockData.length > 0 && <button onClick={() => setActiveView('stock')} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeView === 'stock' ? 'border-pizarro-blue-600 text-pizarro-blue-600' : 'border-transparent text-gray-500 hover:border-gray-300'}`}>Stock</button>}
                        {allSalesData.length > 0 && <button onClick={() => setActiveView('goals')} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeView === 'goals' ? 'border-pizarro-blue-600 text-pizarro-blue-600' : 'border-transparent text-gray-500 hover:border-gray-300'}`}>Objetivos</button>}
                    </div>
                </nav>
            )}
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8 flex-grow">
        {noDataLoaded ? (
          <div className="bg-white p-12 rounded-lg shadow-md text-center">
            <BarChart3 className="w-16 h-16 text-pizarro-blue-300 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Bienvenido, {currentUser.username}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Obtenga información valiosa sobre sus operaciones. Para comenzar, cargue sus archivos de ventas, compras y/o gastos.
            </p>
             {currentUser.role === 'admin' ? (
                <button 
                  onClick={() => setIsUploadModalOpen(true)} 
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-pizarro-blue-600 hover:bg-pizarro-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pizarro-blue-500 transition-transform transform hover:scale-105"
                >
                  <FileUp className="w-5 h-5 mr-3 -ml-1"/> 
                  Cargar Archivos
                </button>
             ) : (
                <p className="text-md text-gray-500 max-w-2xl mx-auto mb-8 bg-yellow-100 p-4 rounded-md border border-yellow-200">
                    Actualmente no hay datos cargados en el sistema. Por favor, contacte a un administrador para que suba los archivos necesarios.
                </p>
             )}
          </div>
        ) : (
          <>
            {isLoading && <div className="text-center py-20"><p className="text-lg text-gray-600">Procesando archivo...</p></div>}
            
            {/* Sales & Goals View */}
            <div className={activeView === 'sales' || activeView === 'goals' ? 'block' : 'hidden'}>
              <FilterControls 
                branches={salesFilterOptions.branches} 
                salespeople={salesFilterOptions.salespeople} 
                years={salesFilterOptions.years} 
                months={MONTHS} 
                filters={salesFilters} 
                onFilterChange={handleSalesFilterChange} 
                onResetFilters={handleResetSalesFilters} 
                showDateFilters={activeView === 'sales'}
              />
              {salesAnalysisResults && <div className={activeView === 'sales' ? 'block' : 'hidden'}><Dashboard ref={salesDashboardRef} results={salesAnalysisResults} colorMap={colorMap} goalKpis={goalKpis} /></div>}
              {salesAnalysisResults && salesGoals.length > 0 && <div className={activeView === 'goals' ? 'block' : 'hidden'}><GoalComplianceDashboard ref={goalsDashboardRef} goals={salesGoals} filters={debouncedSalesFilters} /></div>}
              {!salesAnalysisResults && !isLoading && allSalesData.length > 0 && <div className="text-center py-20 bg-white rounded-lg shadow-md"><p className="text-lg text-gray-600">No hay datos de ventas para los filtros seleccionados.</p></div>}
            </div>

            {/* Purchases View */}
            <div className={activeView === 'purchases' ? 'block' : 'hidden'}>
                <PurchasesFilterControls providers={purchasesFilterOptions.providers} years={purchasesFilterOptions.years} months={MONTHS} filters={purchasesFilters} onFilterChange={handlePurchasesFilterChange} onResetFilters={handleResetPurchasesFilters} />
                {purchasesAnalysisResults && <PurchasesDashboard ref={purchasesDashboardRef} results={purchasesAnalysisResults} />}
                {!purchasesAnalysisResults && !isLoading && allPurchasesData.length > 0 && <div className="text-center py-20 bg-white rounded-lg shadow-md"><p className="text-lg text-gray-600">No hay datos de compras para los filtros seleccionados.</p></div>}
            </div>

            {/* Expenses View */}
            <div className={activeView === 'expenses' ? 'block' : 'hidden'}>
                <ExpensesFilterControls categories={expensesFilterOptions.categories} subcategories={expensesFilterOptions.subcategories} years={expensesFilterOptions.years} months={MONTHS} filters={expensesFilters} onFilterChange={handleExpensesFilterChange} onResetFilters={handleResetExpensesFilters} />
                {expensesAnalysisResults && <ExpensesDashboard ref={expensesDashboardRef} results={expensesAnalysisResults} />}
                {!expensesAnalysisResults && !isLoading && allExpensesData.length > 0 && <div className="text-center py-20 bg-white rounded-lg shadow-md"><p className="text-lg text-gray-600">No hay datos de gastos para los filtros seleccionados.</p></div>}
            </div>

            {/* HR View */}
            <div className={activeView === 'hr' ? 'block' : 'hidden'}>
                <HRFilterControls 
                    years={hrFilterOptions.years} 
                    months={MONTHS}
                    areas={hrFilterOptions.areas}
                    activities={hrFilterOptions.activities}
                    types={hrFilterOptions.types}
                    filters={hrFilters} 
                    onFilterChange={handleHRFilterChange} 
                    onResetFilters={handleResetHRFilters} 
                />
                {hrAnalysisResults ? (
                    <HRDashboard ref={hrDashboardRef} results={hrAnalysisResults} />
                ) : !isLoading && allHRData.length > 0 && (
                     <div className="text-center py-20 bg-white rounded-lg shadow-md"><p className="text-lg text-gray-600">No hay datos de RRHH para los filtros seleccionados.</p></div>
                )}
            </div>

            {/* Stock View */}
            <div className={activeView === 'stock' ? 'block' : 'hidden'}>
                <StockFilterControls
                    years={stockFilterOptions.years}
                    months={MONTHS}
                    sucursales={stockFilterOptions.sucursales}
                    rubros={stockFilterOptions.rubros}
                    filters={stockFilters}
                    onFilterChange={handleStockFilterChange}
                    onResetFilters={handleResetStockFilters}
                />
                {stockAnalysisResults ? (
                    <StockDashboard ref={stockDashboardRef} results={stockAnalysisResults} />
                ) : !isLoading && allStockData.length > 0 && (
                     <div className="text-center py-20 bg-white rounded-lg shadow-md"><p className="text-lg text-gray-600">No hay datos de Stock para los filtros seleccionados.</p></div>
                )}
            </div>
          </>
        )}
      </main>
      
      {!noDataLoaded && (
        <footer className="text-center py-4 text-sm text-gray-500 border-t border-gray-200 bg-gray-100">
          <p>Desarrollado por Francisco Paz</p>
        </footer>
      )}

      <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSalesDataLoaded={handleSalesDataLoaded}
          onPurchasesDataLoaded={handlePurchasesDataLoaded}
          onExpensesDataLoaded={handleExpensesDataLoaded}
          onHRDataLoaded={handleHRDataLoaded}
          onStockDataLoaded={handleStockDataLoaded}
          setIsLoading={setIsLoading}
          salesDataLoaded={allSalesData.length > 0}
          purchasesDataLoaded={allPurchasesData.length > 0}
          expensesDataLoaded={allExpensesData.length > 0}
          hrDataLoaded={allHRData.length > 0}
          stockDataLoaded={allStockData.length > 0}
          error={error}
      />
      <ManagementModal isOpen={isManagementModalOpen} onClose={() => setIsManagementModalOpen(false)} colorMap={colorMap} setColorMap={setColorMap} items={salesFilterOptions} />
      <GoalsModal isOpen={isGoalsModalOpen} onClose={() => setIsGoalsModalOpen(false)} goals={salesGoals} setGoals={setSalesGoals} branches={salesFilterOptions.branches} months={MONTHS} />
    </div>
  );
};


const App: React.FC = () => {
  return (
    <AuthProvider>
        <AppContent />
    </AuthProvider>
  );
};

export default App;