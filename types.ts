// types.ts

export interface SaleRecord {
  'Suc': string;
  'Tipo': 'Blanco' | 'Negro';
  'Tipo Comp.': string;
  'Cant': number;
  'Fecha': Date;
  'Total': number;
  'Cliente': string;
  'ID VENDEDOR': number;
  'Vendedor': string;
}

export interface KpiData {
  totalSales: number;
  averageSale: number;
  invoiceCount: number;
  invoiceTotal: number;
  creditNoteCount: number;
  creditNoteTotal: number;
  blancoSales: number;
  negroSales: number;
  creditNotePercentage: number;
  // New: Period-over-period changes
  totalSalesChange?: number;
  averageSaleChange?: number;
  invoiceCountChange?: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  Ventas: number;
}

export interface RankingItem {
  name: string;
  totalSales: number;
  invoiceCount: number;
}

export interface YearlyTrendDataPoint {
  month: string;
  [key: string]: string | number | null;
}

export interface DailyTrendDataPoint {
  day: string;
  [key: string]: string | number | null;
}

// New type for Salesperson Performance Table
export interface AverageSaleBySalespersonData {
  name: string;
  branch: string; // Could be comma-separated if multiple
  totalSales: number;
  invoiceCount: number;
  averageSale: number;
}

// New type for New vs Recurring Customers data
export interface CustomerAcquisitionData {
  latestMonthData: {
    newCustomers: { count: number; percentage: number; };
    recurringCustomers: { count: number; percentage: number; };
  };
  previousMonthComparison: {
    newCustomersPctChange: number;
    recurringCustomersPctChange: number;
  };
  lastSixMonthsTrend: Array<{
    month: string;
    new: number;
    recurring: number;
  }>;
  totalCustomers: number;
  latestMonth: string;
}


export interface AnalysisResults {
  kpis: KpiData;
  salesByBranch: ChartDataPoint[];
  salesBySalesperson: ChartDataPoint[];
  salesByType: ChartDataPoint[];
  salesOverTime: TimeSeriesDataPoint[];
  branchRanking: RankingItem[];
  salespersonRanking: RankingItem[];
  clientRanking: RankingItem[];
  yearlySalesTrend: YearlyTrendDataPoint[];
  availableYearsForTrend: string[];
  // Add new optional fields for daily view
  dailySalesOverTime?: TimeSeriesDataPoint[];
  dailyYearlySalesTrend?: DailyTrendDataPoint[];
  availableYearsForDailyTrend?: string[];
  // New fields for the requested features
  averageSaleBySalesperson: AverageSaleBySalespersonData[];
  customerAcquisition: CustomerAcquisitionData | null;
}

export type ColorMap = {
  [key: string]: string;
};

export interface SalesGoal {
  id: string; // e.g., "SUCURSAL1-2023-12"
  branch: string;
  year: number;
  month: number;
  goalAmount: number;
  actualAmount: number;
}

export interface GoalPerformanceData {
  name: string; // For chart labels, e.g., "SUCURSAL1 - Ene 2024"
  branch: string;
  period: string;
  real: number;
  goal: number;
  achievement: number;
}

export interface AggregatedGoalPerformanceData {
  branch: string;
  real: number;
  goal: number;
  achievement: number;
}

// --- NEW TYPES FOR PURCHASES MODULE ---

export interface PurchaseRecord {
  'Fecha': Date;
  'Año': number;
  'Mes': number;
  'Modalidad': 'Blanco' | 'Negro';
  'Proveedor': string;
  'Sin Impuestos': number;
  'Otros Tributos': number;
  'IVA': number;
  'Con Impuestos': number;
}

export interface PurchaseKpiData {
  totalPurchases: number;
  averagePurchasePerProvider: number;
  topMonth: { name: string; total: number; };
  blancoPercentage: number;
  negroPercentage: number;
  blancoTotal: number;
  negroTotal: number;
  topProvider: { name: string; total: number; };
  totalPurchasesChange?: number;
}

export interface PurchaseTimeSeriesDataPoint {
  date: string;
  Blanco: number;
  Negro: number;
}

export interface ProviderRankingItem {
  name: string;
  totalPurchases: number;
  purchaseCount: number;
}

export interface ProviderDetailItem {
    name: string;
    subtotal: number;
    vat: number;
    otherTaxes: number;
    total: number;
}

export interface SalesVsPurchasesDataPoint {
    date: string;
    Ventas: number;
    Compras: number;
}

export interface PurchasesAnalysisResults {
  kpis: PurchaseKpiData;
  purchasesOverTime: PurchaseTimeSeriesDataPoint[];
  providerRanking: ProviderRankingItem[];
  purchasesByType: ChartDataPoint[];
  vatOverTime: TimeSeriesDataPoint[]; 
  providerDetails: ProviderDetailItem[];
  availableYears: string[];
  availableProviders: string[];
  salesVsPurchasesTrend?: SalesVsPurchasesDataPoint[];
}

// --- NEW TYPES FOR EXPENSES MODULE ---

export interface ExpenseRecord {
  'Fecha': Date;
  'Año': number;
  'Mes': number;
  'Categoría': string;
  'Subcategoría': string;
  'Detalle': string;
  'Monto_ars': number;
}

export interface ExpenseKpiData {
  totalExpenses: number;
  totalExpensesChange: number; // Renamed from monthlyVariation
  avgExpensePerCategory: number;
  opexTotal: number;
  taxTotal: number;
  topMonth: { name: string; total: number; };
}

export interface AggregatedExpenseItem {
  name: string;
  total: number;
  count: number;
}

export interface ExpensesAnalysisResults {
  kpis: ExpenseKpiData;
  expensesOverTime: TimeSeriesDataPoint[];
  expensesByCategory: ChartDataPoint[];
  topSubcategories: RankingItem[]; // Re-using RankingItem {name, totalSales} -> {name, totalExpense, invoiceCount (not used)}
  yearlyExpenseTrend: YearlyTrendDataPoint[];
  availableYearsForTrend: string[];
  expenseDetails: ExpenseRecord[]; // For the detailed table
  availableCategories: string[];
  availableSubcategories: string[];
  expensesByCategoryAggregated: AggregatedExpenseItem[];
  expensesBySubcategoryAggregated: AggregatedExpenseItem[];
  expensesByDetailAggregated: AggregatedExpenseItem[];
}

// --- NEW TYPES FOR HR MODULE ---

export interface BirthdayInfo {
  name: string;
  birthDate: Date;
  ageTurning: number;
  branch: string;
  position: string;
}

export interface HRRecord {
  'Empleado': string;
  'Leg': string;
  'Fecha': Date;
  'Mes': number;
  'Año': number;
  'Tipo': string; // Haber, Comisiones/Adicionales
  'Monto': number;
  'Area': string;
  'Actividad': string;
  'Fecha Ingreso': Date;
  'Obra Social': string;
  'Categoria': string;
  'CUIL': string;
  'Fecha de Nacimiento': Date;
  'Dias de Vacaciones': number;
  'Fecha Baja': Date | null;
}

export interface HRKpiData {
  totalSalaries: number;
  employeeCount: number;
  avgSalaryEmployee: number;
  avgSalaryManagement: number;
  avgAge: number;
  avgSeniority: number;
  avgVacationDays: number;
  salaryToOpexRatio?: number | null;
  totalSalariesChange?: number;
  employeeCountChange?: number;
}

export interface HREmployeeRankingItem {
  name: string;
  cuil: string;
  totalAmount: number;
  area: string;
  category: string;
  fechaBaja: Date | null;
  seniority: number;
  vacationDays: number;
}

export interface HRSenioritySalaryComparisonItem {
    category: string;
    avgSeniority: number;
    avgSalary: number;
    employeeCount: number;
}

export interface VacationAnalysisItem {
  employeeName: string;
  seniority: number;
  calculatedVacationDays: number;
}

export interface HRAnalysisResults {
  kpis: HRKpiData;
  salaryDistributionByType: ChartDataPoint[];
  costByArea: ChartDataPoint[];
  costByActivity: ChartDataPoint[];
  employeesByActivity: ChartDataPoint[];
  salaryEvolution: TimeSeriesDataPoint[];
  employeeRanking: HREmployeeRankingItem[];
  seniorityVsSalaryByCategory: HRSenioritySalaryComparisonItem[];
  yearlySalaryTrend: YearlyTrendDataPoint[];
  availableYearsForTrend: string[];
  availableYears: string[];
  availableAreas: string[];
  availableActivities: string[];
  availableCategories: string[];
  availableTypes: string[];
  availableMonths: number[];
  // New fields for vacation analysis
  vacationAnalysisTable: VacationAnalysisItem[];
  seniorityDistribution: ChartDataPoint[];
  avgVacationDaysByArea: ChartDataPoint[];
  avgVacationDaysByCategory: ChartDataPoint[];
  // New field for birthdays
  birthdaysInMonth: BirthdayInfo[];
}

// --- NEW TYPES FOR STOCK MODULE ---

export interface StockRecord {
  'Fecha': Date;
  'Mes': number;
  'Año': number;
  'Rubro productos': string;
  'Costo sin imp en $': number;
  'Suc': string;
  'Cotizacion Dolar Sistema': number;
  'Cotizacion Dolar Oficial': number;
  'Valorizado en USD SISTEMA': number;
  'Valorizado en USD OFICIAL': number;
  'Valorizado en $ a dolar oficial': number;
}

export interface StockKpiData {
  stockTotalOficialPesos: number;
  stockTotalOficialUSD: number;
  stockTotalSistemaUSD: number;
  stockTotalPesosChange: number; // Renamed from monthlyVariationPesosOficial
  avgMonthlyStock: number;
  avgCotizacionOficial: number;
  avgCotizacionSistema: number;
  diffCotizacionPercent: number;
  // New KPIs
  stockTurnover: number;
  daysOfCoverage: number;
  stockToPurchaseRatio: number;
  financialCoverage: number; // in months
}

export interface StockEvolutionDataPoint {
  date: string;
  'Stock Valorizado (USD)': number;
}

export interface DollarEvolutionDataPoint {
    date: string;
    'Dólar Sistema': number;
    'Dólar Oficial': number;
}

export interface StockAnalysisResults {
  kpis: StockKpiData;
  stockEvolution: StockEvolutionDataPoint[];
  stockByRubro: ChartDataPoint[];
  stockByRubroUSD: ChartDataPoint[];
  stockBySucursal: ChartDataPoint[];
  dollarEvolution: DollarEvolutionDataPoint[];
  rubroRanking: RankingItem[]; // Re-using RankingItem {name, totalSales, invoiceCount(0)}
  rubroRankingUSD: RankingItem[];
  stockBySucursalUSD: ChartDataPoint[];
  // New Breakdowns
  stockTurnoverByRubro: ChartDataPoint[];
  stockTurnoverBySucursal: ChartDataPoint[];
  totalStockTurnover: number;
  availableYears: string[];
  availableMonths: number[];
  availableSucursales: string[];
  availableRubros: string[];
}

// --- NEW TYPES FOR USER AUTHENTICATION ---
export interface User {
  id: number;
  username: string;
  password?: string; // Should not be sent to client, but needed for mock service
  role: 'admin' | 'reader';
}