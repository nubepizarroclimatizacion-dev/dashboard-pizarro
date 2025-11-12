// services/dataProcessor.ts

import { 
  SaleRecord, 
  AnalysisResults, 
  KpiData, 
  ChartDataPoint, 
  TimeSeriesDataPoint, 
  RankingItem, 
  YearlyTrendDataPoint, 
  DailyTrendDataPoint, 
  AverageSaleBySalespersonData, 
  CustomerAcquisitionData,
  PurchaseRecord,
  PurchasesAnalysisResults,
  PurchaseKpiData,
  PurchaseTimeSeriesDataPoint,
  ProviderRankingItem,
  ProviderDetailItem,
  SalesVsPurchasesDataPoint,
  ExpenseRecord,
  ExpensesAnalysisResults,
  ExpenseKpiData,
  AggregatedExpenseItem,
  HRRecord,
  HRAnalysisResults,
  HRKpiData,
  HREmployeeRankingItem,
  HRSenioritySalaryComparisonItem,
  VacationAnalysisItem,
  BirthdayInfo,
  StockRecord,
  StockAnalysisResults,
  StockKpiData,
  StockEvolutionDataPoint,
  DollarEvolutionDataPoint,
} from '../types';

export const isCreditNote = (record: SaleRecord): boolean => {
  // La lógica de negocio indica que Cant: -1 es una nota de crédito.
  return record.Cant === -1;
};

export const isDebitNote = (record: SaleRecord): boolean => {
  // La lógica de negocio indica que "ND A" y "ND B" son notas de débito (ajustes) y deben ser excluidas.
  const compType = (record['Tipo Comp.'] || '').trim().toUpperCase();
  return compType === 'ND A' || compType === 'ND B';
};

/**
 * Formats data for a pie chart, calculating percentages for each slice.
 */
const formatForPieChart = (aggData: { [key: string]: number }): ChartDataPoint[] => {
  const total = Object.values(aggData).reduce((sum, val) => sum + val, 0);
  if (total === 0) return [];

  const dataPoints = Object.entries(aggData).map(([name, value]) => ({
    name,
    value,
    percentage: value / total,
  }));

  return dataPoints.sort((a, b) => b.value - a.value);
};


export const processSalesData = (data: SaleRecord[], filters: any, allData?: SaleRecord[]): AnalysisResults => {
  // Filtrar las notas de débito al principio del todo para que no afecten ningún cálculo.
  const processedData = data.filter(rec => !isDebitNote(rec));
  
  if (processedData.length === 0) {
    // Devolver estado vacío si no hay datos tras el filtrado.
    return {
      kpis: { 
        totalSales: 0, 
        averageSale: 0, 
        invoiceCount: 0, 
        invoiceTotal: 0, 
        creditNoteCount: 0, 
        creditNoteTotal: 0,
        blancoSales: 0,
        negroSales: 0,
        creditNotePercentage: 0,
      },
      salesByBranch: [],
      salesBySalesperson: [],
      salesByType: [],
      salesOverTime: [],
      branchRanking: [],
      salespersonRanking: [],
      clientRanking: [],
      yearlySalesTrend: [],
      availableYearsForTrend: [],
      averageSaleBySalesperson: [],
      customerAcquisition: null,
    };
  }

  // --- KPI Calculations ---
  let invoiceTotal = 0;
  let invoiceCount = 0;
  let creditNoteTotal = 0;
  let creditNoteCount = 0;
  let blancoSales = 0;
  let negroSales = 0;

  processedData.forEach(rec => {
    const totalAmount = Math.abs(rec.Total);
    const signedAmount = isCreditNote(rec) ? -totalAmount : totalAmount;
    
    if (isCreditNote(rec)) {
      creditNoteCount++;
      creditNoteTotal += totalAmount;
    } else {
      invoiceCount++;
      invoiceTotal += totalAmount;
    }
    
    if (rec.Tipo === 'Blanco') {
      blancoSales += signedAmount;
    } else {
      negroSales += signedAmount;
    }
  });
  
  const totalSales = invoiceTotal - creditNoteTotal;
  // Calculate percentage against gross invoice total to represent returns against sales
  const creditNotePercentage = invoiceTotal > 0 ? (creditNoteTotal / invoiceTotal) * 100 : 0;

  const kpis: KpiData = {
    totalSales,
    averageSale: invoiceCount > 0 ? invoiceTotal / invoiceCount : 0,
    invoiceCount,
    invoiceTotal,
    creditNoteCount,
    creditNoteTotal,
    blancoSales,
    negroSales,
    creditNotePercentage
  };

  // --- Data Aggregation for Charts and Rankings ---
  const salesByBranch: { [key: string]: number } = {};
  const salesBySalesperson: { [key: string]: { total: number; count: number; branches: Set<string> } } = {};
  const salesByClient: { [key: string]: { total: number; count: number } } = {};
  const salesByType: { [key: string]: number } = {};
  const salesOverTime: { [key: string]: number } = {};
  const branchInvoiceCounts: { [key: string]: number } = {};
  
  // Iterar sobre los datos filtrados para calcular ventas netas.
  processedData.forEach(rec => {
    const amount = isCreditNote(rec) ? -Math.abs(rec.Total) : Math.abs(rec.Total);

    // Normalizamos para evitar duplicados por mayúsculas/minúsculas o espacios
    const branchKey = (rec.Suc || '').trim().toUpperCase();
    const salespersonKey = (rec.Vendedor || '').trim().toUpperCase();
    const clientKey = (rec.Cliente || 'CLIENTE DESCONOCIDO').trim().toUpperCase();
    
    if (!branchKey) return; // Omitir registros sin sucursal

    // By Branch (Net Sales)
    salesByBranch[branchKey] = (salesByBranch[branchKey] || 0) + amount;

    // By Salesperson (Net Sales and Invoice Count)
    if(salespersonKey) {
        if (!salesBySalesperson[salespersonKey]) {
            salesBySalesperson[salespersonKey] = { total: 0, count: 0, branches: new Set() };
        }
        salesBySalesperson[salespersonKey].total += amount;
        salesBySalesperson[salespersonKey].branches.add(branchKey);
        if (!isCreditNote(rec)) {
            salesBySalesperson[salespersonKey].count++;
        }
    }
    
    // By Client (Net Sales and Invoice Count)
    if(clientKey) {
        if (!salesByClient[clientKey]) {
            salesByClient[clientKey] = { total: 0, count: 0 };
        }
        salesByClient[clientKey].total += amount;
        if (!isCreditNote(rec)) {
            salesByClient[clientKey].count++;
        }
    }


    // By Type (summing sales value of invoices only)
    if (!isCreditNote(rec)) {
      salesByType[rec.Tipo] = (salesByType[rec.Tipo] || 0) + Math.abs(rec.Total);
    }

    // Count invoices per branch for ranking table
    if (!isCreditNote(rec)) {
      branchInvoiceCounts[branchKey] = (branchInvoiceCounts[branchKey] || 0) + 1;
    }

    // Over Time (monthly Net Sales)
    const date = rec.Fecha;
    const monthStr = date.toISOString().slice(0, 7); // "YYYY-MM"
    salesOverTime[monthStr] = (salesOverTime[monthStr] || 0) + amount;
  });

  // --- Yearly Trend Aggregation (Year-over-Year comparison) ---
  let trendData = processedData;

  // Smart Comparison: If exactly one year is selected in filters, automatically fetch
  // the previous year's data for comparison, applying all other active filters.
  if (filters.years && filters.years.length === 1 && allData) {
      const selectedYear = parseInt(filters.years[0], 10);
      const previousYear = selectedYear - 1;

      trendData = allData.filter(rec => {
          const recYear = rec.Fecha.getFullYear();
          if (recYear !== selectedYear && recYear !== previousYear) return false;

          // Re-apply other filters (branch, salesperson, month, date range)
          if (filters.months.length > 0 && !filters.months.includes(rec.Fecha.getMonth() + 1)) return false;
          if (filters.branches.length > 0 && !filters.branches.includes(rec.Suc)) return false;
          if (filters.salespeople.length > 0 && !filters.salespeople.includes(rec.Vendedor)) return false;
          
          // Handle date range filter correctly for comparison, comparing only month and day
          if (filters.startDate) {
              const start = filters.startDate;
              if (rec.Fecha.getMonth() < start.getMonth() || (rec.Fecha.getMonth() === start.getMonth() && rec.Fecha.getDate() < start.getDate())) {
                  return false;
              }
          }
          if (filters.endDate) {
              const end = filters.endDate;
              if (rec.Fecha.getMonth() > end.getMonth() || (rec.Fecha.getMonth() === end.getMonth() && rec.Fecha.getDate() > end.getDate())) {
                  return false;
              }
          }
          
          return !isDebitNote(rec); // Also exclude debit notes from comparison data
      });
  }

  const yearlySales: { [year: string]: { [month: number]: number } } = {};
  
  // Use trendData for this calculation
  trendData.forEach(rec => {
      const amount = isCreditNote(rec) ? -Math.abs(rec.Total) : Math.abs(rec.Total);
      const date = rec.Fecha;
      const year = date.getFullYear().toString();
      const month = date.getMonth(); // 0-11
      
      if (!yearlySales[year]) {
          yearlySales[year] = {};
      }
      yearlySales[year][month] = (yearlySales[year][month] || 0) + amount;
  });

  const availableYearsForTrend = Object.keys(yearlySales).sort().reverse();
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  
  // Find the latest month with data for EACH year to avoid plotting incomplete future data.
  const latestMonths: { [year: string]: number } = {};
  trendData.forEach(d => {
      const year = d.Fecha.getFullYear().toString();
      const month = d.Fecha.getMonth();
      if (!latestMonths[year] || month > latestMonths[year]) {
          latestMonths[year] = month;
      }
  });

  const yearlySalesTrend = monthNames.map((monthName, monthIndex) => {
      const monthData: YearlyTrendDataPoint = { month: monthName };
      availableYearsForTrend.forEach(year => {
          // For each year, only show data up to its latest available month.
          const latestMonthForYear = latestMonths[year];
          monthData[year] = (latestMonthForYear !== undefined && monthIndex > latestMonthForYear) ? null : (yearlySales[year]?.[monthIndex] || 0);
      });
      return monthData;
  });
  
  const averageSaleBySalesperson: AverageSaleBySalespersonData[] = Object.entries(salesBySalesperson)
    .map(([name, data]) => ({
      name,
      branch: Array.from(data.branches).join(', '),
      totalSales: data.total,
      invoiceCount: data.count,
      averageSale: data.count > 0 ? data.total / data.count : 0,
    }))
    .filter(item => item.invoiceCount > 0)
    .sort((a, b) => b.averageSale - a.averageSale);

  // --- New vs Recurring Customers Calculation (Enhanced) ---
  let customerAcquisition: CustomerAcquisitionData | null = null;
  if (allData && allData.length > 0 && processedData.length > 0) {
      const firstPurchaseMap = new Map<string, Date>();
      const sortedAllData = [...allData].sort((a, b) => a.Fecha.getTime() - b.Fecha.getTime());
      for (const record of sortedAllData) {
          const clientKey = (record.Cliente || 'CLIENTE DESCONOCIDO').trim().toUpperCase();
          if (!firstPurchaseMap.has(clientKey)) {
              firstPurchaseMap.set(clientKey, record.Fecha);
          }
      }

      const calculateSplitForMonth = (year: number, monthIndex: number) => {
          const customersInMonth = new Set<string>();
          allData.forEach(r => {
              if (r.Fecha.getFullYear() === year && r.Fecha.getMonth() === monthIndex && !isCreditNote(r) && !isDebitNote(r)) {
                  customersInMonth.add((r.Cliente || 'CLIENTE DESCONOCIDO').trim().toUpperCase());
              }
          });
          
          let newCustomerCount = 0;
          let recurringCustomerCount = 0;
          for (const customer of customersInMonth) {
              const firstPurchaseDate = firstPurchaseMap.get(customer);
              if (firstPurchaseDate && firstPurchaseDate.getFullYear() === year && firstPurchaseDate.getMonth() === monthIndex) {
                  newCustomerCount++;
              } else {
                  recurringCustomerCount++;
              }
          }
          const total = customersInMonth.size;
          return {
              newCount: newCustomerCount,
              recurringCount: recurringCustomerCount,
              total,
              newPercentage: total > 0 ? (newCustomerCount / total) * 100 : 0,
              recurringPercentage: total > 0 ? (recurringCustomerCount / total) * 100 : 0,
          };
      };

      const latestDate = processedData.reduce((max, r) => r.Fecha > max ? r.Fecha : max, processedData[0].Fecha);
      let currentYear = latestDate.getFullYear();
      let currentMonthIndex = latestDate.getMonth();

      const latestMonthData = calculateSplitForMonth(currentYear, currentMonthIndex);
      
      let prevMonthIndex = currentMonthIndex - 1;
      let prevYear = currentYear;
      if (prevMonthIndex < 0) {
          prevMonthIndex = 11;
          prevYear--;
      }
      const previousMonthData = calculateSplitForMonth(prevYear, prevMonthIndex);

      const newCustomersPctChange = previousMonthData.newPercentage > 0
          ? ((latestMonthData.newPercentage - previousMonthData.newPercentage) / previousMonthData.newPercentage) * 100
          : latestMonthData.newPercentage > 0 ? 100 : 0;
      const recurringCustomersPctChange = previousMonthData.recurringPercentage > 0
          ? ((latestMonthData.recurringPercentage - previousMonthData.recurringPercentage) / previousMonthData.recurringPercentage) * 100
          : latestMonthData.recurringPercentage > 0 ? 100 : 0;

      const lastSixMonthsTrend: { month: string; new: number; recurring: number }[] = [];
      for (let i = 0; i < 6; i++) {
          const date = new Date(latestDate);
          date.setMonth(date.getMonth() - i);
          const year = date.getFullYear();
          const monthIndex = date.getMonth();
          const split = calculateSplitForMonth(year, monthIndex);
          lastSixMonthsTrend.push({
              month: monthNames[monthIndex],
              new: split.newCount,
              recurring: split.recurringCount,
          });
      }

      customerAcquisition = {
          latestMonthData: {
              newCustomers: { count: latestMonthData.newCount, percentage: latestMonthData.newPercentage },
              recurringCustomers: { count: latestMonthData.recurringCount, percentage: latestMonthData.recurringPercentage },
          },
          previousMonthComparison: { newCustomersPctChange, recurringCustomersPctChange },
          lastSixMonthsTrend: lastSixMonthsTrend.reverse(),
          totalCustomers: latestMonthData.total,
          latestMonth: `${monthNames[currentMonthIndex]} ${currentYear}`,
      };
  }


  // --- Formatting for Recharts ---
  const formatForChart = (aggData: { [key: string]: number }): ChartDataPoint[] =>
    Object.entries(aggData)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

  const formatTimeSeries = (aggData: { [key: string]: number }): TimeSeriesDataPoint[] =>
    Object.entries(aggData)
      .map(([date, Ventas]) => ({ date, Ventas }))
      .sort((a, b) => a.date.localeCompare(b.date));

  const createSalespersonRanking = (aggData: { [key: string]: { total: number; count: number } }): RankingItem[] =>
    Object.entries(aggData)
      .map(([name, data]) => ({
        name,
        totalSales: data.total,
        invoiceCount: data.count,
      }))
      .sort((a, b) => b.totalSales - a.totalSales);
      
  const createClientRanking = (aggData: { [key: string]: { total: number; count: number } }): RankingItem[] =>
    Object.entries(aggData)
      .map(([name, data]) => ({
        name,
        totalSales: data.total,
        invoiceCount: data.count,
      }))
      .sort((a, b) => b.totalSales - a.totalSales);
  
  const createBranchRanking = (aggData: { [key: string]: number }): RankingItem[] =>
    Object.entries(aggData)
      .map(([name, totalSales]) => ({
          name,
          totalSales,
          invoiceCount: branchInvoiceCounts[name] || 0,
      }))
      .sort((a, b) => b.totalSales - a.totalSales);

  const analysisResults: AnalysisResults = {
    kpis,
    salesByBranch: formatForPieChart(salesByBranch),
    salesBySalesperson: formatForChart(Object.fromEntries(Object.entries(salesBySalesperson).map(([k, v]) => [k, v.total]))),
    salesByType: formatForChart(salesByType),
    salesOverTime: formatTimeSeries(salesOverTime),
    branchRanking: createBranchRanking(salesByBranch),
    salespersonRanking: createSalespersonRanking(salesBySalesperson),
    clientRanking: createClientRanking(salesByClient),
    yearlySalesTrend,
    availableYearsForTrend,
    averageSaleBySalesperson,
    customerAcquisition,
  };

  // --- Daily Data Calculation (if applicable) ---
  const uniqueMonthsInDataSet = new Set(processedData.map(d => d.Fecha.getMonth()));
  if (uniqueMonthsInDataSet.size === 1 && processedData.length > 0) {
    const dailySalesOverTimeAgg: { [key: string]: number } = {};
    const dailyYearlySalesAgg: { [year: string]: { [day: number]: number } } = {};

    processedData.forEach(rec => {
        const amount = isCreditNote(rec) ? -Math.abs(rec.Total) : Math.abs(rec.Total);
        const date = rec.Fecha;
        
        const dayStr = date.toISOString().slice(0, 10);
        dailySalesOverTimeAgg[dayStr] = (dailySalesOverTimeAgg[dayStr] || 0) + amount;

        const year = date.getFullYear().toString();
        const dayOfMonth = date.getDate();
        if (!dailyYearlySalesAgg[year]) {
            dailyYearlySalesAgg[year] = {};
        }
        dailyYearlySalesAgg[year][dayOfMonth] = (dailyYearlySalesAgg[year][dayOfMonth] || 0) + amount;
    });

    analysisResults.dailySalesOverTime = Object.entries(dailySalesOverTimeAgg)
        .map(([date, Ventas]) => ({ date, Ventas }))
        .sort((a, b) => a.date.localeCompare(b.date));
    
    // Determine the years to display from the filter selection, not just from the data.
    // This ensures years with zero sales for the month are still included in the comparison.
    const availableYearsForDailyTrend = filters.years.length > 0
        ? [...filters.years].sort()
        : [...new Set(processedData.map(d => d.Fecha.getFullYear().toString()))].sort();

    // The month is guaranteed to be the same for all records in this block.
    const monthForDays = processedData[0].Fecha.getMonth(); // 0-11
    
    // Calculate days in month based on ALL selected years to handle leap years correctly.
    const yearsForDayCalc = availableYearsForDailyTrend.map(y => parseInt(y, 10));
    const daysInMonth = yearsForDayCalc.length > 0
        ? Math.max(...yearsForDayCalc.map(year => new Date(year, monthForDays + 1, 0).getDate()))
        : new Date(processedData[0].Fecha.getFullYear(), monthForDays + 1, 0).getDate();

    const dailyTrendData: DailyTrendDataPoint[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
        const dayData: DailyTrendDataPoint = { day: String(day) };
        availableYearsForDailyTrend.forEach(yearStr => {
            dayData[yearStr] = dailyYearlySalesAgg[yearStr]?.[day] || 0;
        });
        dailyTrendData.push(dayData);
    }
    
    analysisResults.dailyYearlySalesTrend = dailyTrendData;
    analysisResults.availableYearsForDailyTrend = availableYearsForDailyTrend;
  }


  return analysisResults;
};


// --- NEW PURCHASES DATA PROCESSOR ---

export const processPurchasesData = (
  data: PurchaseRecord[],
  allSalesData: SaleRecord[] = []
): PurchasesAnalysisResults => {
  if (data.length === 0) {
    return {
      kpis: { totalPurchases: 0, averagePurchasePerProvider: 0, topMonth: { name: '-', total: 0 }, blancoPercentage: 0, negroPercentage: 0, blancoTotal: 0, negroTotal: 0, topProvider: { name: '-', total: 0 } },
      purchasesOverTime: [], providerRanking: [], purchasesByType: [], vatOverTime: [], providerDetails: [], availableYears: [], availableProviders: [], salesVsPurchasesTrend: []
    };
  }

  // --- Aggregations ---
  let totalPurchases = 0;
  const purchasesByProvider: { [key: string]: { total: number; count: number; subtotal: number; vat: number; otherTaxes: number; } } = {};
  const purchasesOverTime: { [key: string]: { Blanco: number; Negro: number; } } = {};
  const vatOverTimeAgg: { [key: string]: number } = {};
  const purchasesByType: { [key: string]: number } = {};
  const purchasesByMonth: { [key: string]: number } = {};
  
  data.forEach(rec => {
    const providerKey = (rec.Proveedor || 'N/A').trim().toUpperCase();
    const amount = rec['Con Impuestos'];
    totalPurchases += amount;

    if (!purchasesByProvider[providerKey]) {
      purchasesByProvider[providerKey] = { total: 0, count: 0, subtotal: 0, vat: 0, otherTaxes: 0 };
    }
    purchasesByProvider[providerKey].total += amount;
    purchasesByProvider[providerKey].count++;
    purchasesByProvider[providerKey].subtotal += rec['Sin Impuestos'];
    purchasesByProvider[providerKey].vat += rec.IVA;
    purchasesByProvider[providerKey].otherTaxes += rec['Otros Tributos'];

    const monthStr = rec.Fecha.toISOString().slice(0, 7); // "YYYY-MM"
    if (!purchasesOverTime[monthStr]) {
      purchasesOverTime[monthStr] = { Blanco: 0, Negro: 0 };
    }
    purchasesOverTime[monthStr][rec.Modalidad] += amount;

    vatOverTimeAgg[monthStr] = (vatOverTimeAgg[monthStr] || 0) + rec.IVA;
    purchasesByType[rec.Modalidad] = (purchasesByType[rec.Modalidad] || 0) + amount;
    purchasesByMonth[monthStr] = (purchasesByMonth[monthStr] || 0) + amount;
  });

  // --- KPI Calculations ---
  const providerCount = Object.keys(purchasesByProvider).length;
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  
  const providerRanking: ProviderRankingItem[] = Object.entries(purchasesByProvider)
    .map(([name, data]) => ({ name, totalPurchases: data.total, purchaseCount: data.count }))
    .sort((a, b) => b.totalPurchases - a.totalPurchases);

  const topProvider = providerRanking.length > 0 
    ? { name: providerRanking[0].name, total: providerRanking[0].totalPurchases } 
    : { name: '-', total: 0 };
    
  const topMonthEntry = Object.entries(purchasesByMonth).sort((a, b) => b[1] - a[1])[0];
  const topMonthName = topMonthEntry ? `${monthNames[new Date(topMonthEntry[0] + '-15T00:00:00Z').getUTCMonth()]} ${new Date(topMonthEntry[0] + '-15T00:00:00Z').getUTCFullYear()}` : '-';
  const topMonthTotal = topMonthEntry ? topMonthEntry[1] : 0;
  const topMonth = { name: topMonthName, total: topMonthTotal };

  const kpis: PurchaseKpiData = {
    totalPurchases,
    averagePurchasePerProvider: providerCount > 0 ? totalPurchases / providerCount : 0,
    topMonth,
    blancoTotal: purchasesByType['Blanco'] || 0,
    negroTotal: purchasesByType['Negro'] || 0,
    blancoPercentage: totalPurchases > 0 ? ((purchasesByType['Blanco'] || 0) / totalPurchases) * 100 : 0,
    negroPercentage: totalPurchases > 0 ? ((purchasesByType['Negro'] || 0) / totalPurchases) * 100 : 0,
    topProvider,
  };

  // --- Chart & Table Data Formatting ---
  const purchasesOverTimeChart: PurchaseTimeSeriesDataPoint[] = Object.entries(purchasesOverTime)
    .map(([date, values]) => ({ date, ...values }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  const vatOverTimeChart: TimeSeriesDataPoint[] = Object.entries(vatOverTimeAgg)
    .map(([date, Ventas]) => ({ date, Ventas })) // Re-using 'Ventas' key for simplicity in chart component
    .sort((a, b) => a.date.localeCompare(b.date));

  const providerDetails: ProviderDetailItem[] = Object.entries(purchasesByProvider)
    .map(([name, data]) => ({ name, subtotal: data.subtotal, vat: data.vat, otherTaxes: data.otherTaxes, total: data.total }))
    .sort((a, b) => b.total - a.total);

  // --- Sales vs Purchases Trend ---
  let salesVsPurchasesTrend: SalesVsPurchasesDataPoint[] | undefined = undefined;
  if (allSalesData.length > 0) {
      const salesByMonth: { [key: string]: number } = {};
      allSalesData.forEach(rec => {
          if(isDebitNote(rec)) return;
          const amount = isCreditNote(rec) ? -Math.abs(rec.Total) : Math.abs(rec.Total);
          const monthStr = rec.Fecha.toISOString().slice(0, 7);
          salesByMonth[monthStr] = (salesByMonth[monthStr] || 0) + amount;
      });
      
      const allMonths = new Set([...Object.keys(purchasesByMonth), ...Object.keys(salesByMonth)]);
      salesVsPurchasesTrend = Array.from(allMonths).sort().map(month => ({
          date: month,
          Ventas: salesByMonth[month] || 0,
          Compras: purchasesByMonth[month] || 0
      }));
      
      if (salesVsPurchasesTrend && salesVsPurchasesTrend.length > 0) {
        const lastEntry = salesVsPurchasesTrend[salesVsPurchasesTrend.length - 1];
        const now = new Date();
        const currentMonthStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

        if (lastEntry.date === currentMonthStr && (lastEntry.Ventas === 0 || lastEntry.Compras === 0)) {
            salesVsPurchasesTrend.pop();
        }
      }
  }

  return {
    kpis,
    purchasesOverTime: purchasesOverTimeChart,
    providerRanking,
    purchasesByType: formatForPieChart(purchasesByType),
    vatOverTime: vatOverTimeChart,
    providerDetails,
    availableYears: [...new Set(data.map(d => d.Año.toString()))].sort((a,b) => b.localeCompare(a)),
    availableProviders: [...new Set(data.map(d => d.Proveedor))].sort(),
    salesVsPurchasesTrend
  };
};


// --- NEW EXPENSES DATA PROCESSOR ---
export const processExpensesData = (
  data: ExpenseRecord[],
  allData: ExpenseRecord[] = []
): ExpensesAnalysisResults => {
  if (data.length === 0) {
    return {
      // FIX: Changed 'monthlyVariation' to 'totalExpensesChange' to match the type definition.
      kpis: { totalExpenses: 0, totalExpensesChange: 0, avgExpensePerCategory: 0, opexTotal: 0, taxTotal: 0, topMonth: { name: '-', total: 0 } },
      expensesOverTime: [], expensesByCategory: [], topSubcategories: [], yearlyExpenseTrend: [], availableYearsForTrend: [],
      expenseDetails: [], availableCategories: [], availableSubcategories: [],
      expensesByCategoryAggregated: [], expensesBySubcategoryAggregated: [], expensesByDetailAggregated: []
    };
  }

  const expensesByMonth: { [key: string]: number } = {};
  const expensesByCategory: { [key: string]: number } = {};
  const expensesBySubcategory: { [key: string]: number } = {};
  let totalExpenses = 0;
  let taxTotal = 0;

  data.forEach(rec => {
    const amount = rec.Monto_ars;
    totalExpenses += amount;

    const monthStr = rec.Fecha.toISOString().slice(0, 7); // YYYY-MM
    expensesByMonth[monthStr] = (expensesByMonth[monthStr] || 0) + amount;
    expensesByCategory[rec.Categoría] = (expensesByCategory[rec.Categoría] || 0) + amount;
    expensesBySubcategory[rec.Subcategoría] = (expensesBySubcategory[rec.Subcategoría] || 0) + amount;
    
    const taxCategories = [
      'TRIBUTOS Y TASAS',
      'TRIBUTOS MUNICIPALES',
      'TRIBUTOS NACIONALES',
      'TRIBUTOS PROVINCIALES'
    ];
    const categoryUpper = rec.Categoría.toUpperCase();
    if (taxCategories.includes(categoryUpper)) {
      taxTotal += amount;
    }
  });

  // --- KPI Calculations ---
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  // Monthly Variation
  const sortedMonths = Object.keys(expensesByMonth).sort();
  let monthlyVariation = 0;
  if (sortedMonths.length > 1) {
    const lastMonth = sortedMonths[sortedMonths.length - 1];
    const secondLastMonth = sortedMonths[sortedMonths.length - 2];
    const lastMonthTotal = expensesByMonth[lastMonth];
    const secondLastMonthTotal = expensesByMonth[secondLastMonth];
    if (secondLastMonthTotal > 0) {
      monthlyVariation = ((lastMonthTotal - secondLastMonthTotal) / secondLastMonthTotal) * 100;
    }
  }

  const categoryCount = Object.keys(expensesByCategory).length;
  const avgExpensePerCategory = categoryCount > 0 ? totalExpenses / categoryCount : 0;
  const opexTotal = totalExpenses - taxTotal;
  
  const topMonthEntry = Object.entries(expensesByMonth).sort((a, b) => b[1] - a[1])[0];
  const topMonthName = topMonthEntry ? `${monthNames[new Date(topMonthEntry[0] + '-15T00:00:00Z').getUTCMonth()]} ${new Date(topMonthEntry[0] + '-15T00:00:00Z').getUTCFullYear()}` : '-';
  const topMonth = { name: topMonthName, total: topMonthEntry ? topMonthEntry[1] : 0 };

  const kpis: ExpenseKpiData = {
    totalExpenses,
    // FIX: Changed 'monthlyVariation' to 'totalExpensesChange' to match the type definition.
    totalExpensesChange: monthlyVariation,
    avgExpensePerCategory,
    opexTotal,
    taxTotal,
    topMonth,
  };

  // --- Chart & Table Data Formatting ---
  const expensesOverTime: TimeSeriesDataPoint[] = Object.entries(expensesByMonth)
    .map(([date, value]) => ({ date, Ventas: value })) // Reusing 'Ventas' key for chart component
    .sort((a, b) => a.date.localeCompare(b.date));

  const topSubcategories: RankingItem[] = Object.entries(expensesBySubcategory)
    .map(([name, total]) => ({ name, totalSales: total, invoiceCount: 0 })) // Re-using RankingItem
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 10);

  // Yearly Trend (using allData for complete comparison)
  const yearlyExpenses: { [year: string]: { [month: number]: number } } = {};
  allData.forEach(rec => {
    const year = rec.Año.toString();
    const month = rec.Mes - 1; // 0-11
    if (!yearlyExpenses[year]) yearlyExpenses[year] = {};
    yearlyExpenses[year][month] = (yearlyExpenses[year][month] || 0) + rec.Monto_ars;
  });

  const availableYearsForTrend = Object.keys(yearlyExpenses).sort().reverse();
  const yearlyExpenseTrend = monthNames.map((monthName, monthIndex) => {
      const monthData: YearlyTrendDataPoint = { month: monthName };
      availableYearsForTrend.forEach(year => {
          monthData[year] = yearlyExpenses[year]?.[monthIndex] || 0;
      });
      return monthData;
  });

  // --- NEW AGGREGATIONS FOR DETAIL TABLES ---
  const aggregateBy = (key: 'Categoría' | 'Subcategoría' | 'Detalle'): AggregatedExpenseItem[] => {
    const aggregation: { [name: string]: { total: number; count: number } } = {};
    data.forEach(rec => {
      const name = rec[key] || 'N/A';
      if (!aggregation[name]) {
        aggregation[name] = { total: 0, count: 0 };
      }
      aggregation[name].total += rec.Monto_ars;
      aggregation[name].count += 1;
    });

    return Object.entries(aggregation)
      .map(([name, values]) => ({ name, total: values.total, count: values.count }))
      .sort((a, b) => b.total - a.total);
  };

  const expensesByCategoryAggregated = aggregateBy('Categoría');
  const expensesBySubcategoryAggregated = aggregateBy('Subcategoría');
  const expensesByDetailAggregated = aggregateBy('Detalle');

  return {
    kpis,
    expensesOverTime,
    expensesByCategory: formatForPieChart(expensesByCategory),
    topSubcategories,
    yearlyExpenseTrend,
    availableYearsForTrend,
    expenseDetails: data.sort((a, b) => b.Fecha.getTime() - a.Fecha.getTime()),
    availableCategories: [...new Set(allData.map(d => d.Categoría))].sort(),
    availableSubcategories: [...new Set(allData.map(d => d.Subcategoría))].sort(),
    expensesByCategoryAggregated,
    expensesBySubcategoryAggregated,
    expensesByDetailAggregated,
  };
};

// --- NEW HR DATA PROCESSOR ---
export const processHRData = (
  data: HRRecord[],
  allData: HRRecord[] = [],
  filters: {
    years: string[];
    months: number[];
    areas: string[];
    activities: string[];
    types: string[];
  }
): HRAnalysisResults => {
  if (allData.length === 0) {
    return {
      kpis: { totalSalaries: 0, employeeCount: 0, avgSalaryEmployee: 0, avgSalaryManagement: 0, avgAge: 0, avgSeniority: 0, avgVacationDays: 0 },
      salaryDistributionByType: [], costByArea: [], costByActivity: [], employeesByActivity: [], salaryEvolution: [],
      employeeRanking: [], seniorityVsSalaryByCategory: [], yearlySalaryTrend: [], availableYearsForTrend: [],
      availableYears: [], availableAreas: [], availableActivities: [], availableCategories: [], availableTypes: [], availableMonths: [],
      vacationAnalysisTable: [], seniorityDistribution: [], avgVacationDaysByArea: [], avgVacationDaysByCategory: [],
      birthdaysInMonth: [],
    };
  }
  
  const latestYearInFilter = filters.years.length > 0 
      ? Math.max(...filters.years.map(y => parseInt(y, 10))) 
      : Math.max(...allData.map(d => d.Año));
      
  const latestMonthInFilter = filters.months.length > 0 
      ? Math.max(...filters.months) 
      : 12;
      
  const endDateOfFilter = new Date(latestYearInFilter, latestMonthInFilter, 0);


  // --- Determine Employee Roster based on non-month filters and active status ---
  const rosterSourceData = allData.filter(rec => 
    (filters.years.length === 0 || filters.years.includes(rec.Año.toString())) &&
    (filters.areas.length === 0 || filters.areas.includes(rec.Area)) &&
    (filters.activities.length === 0 || filters.activities.includes(rec.Actividad))
  );
  
  const uniqueEmployeesRoster = new Map<string, HRRecord>();
  rosterSourceData.forEach(rec => {
    const existing = uniqueEmployeesRoster.get(rec.CUIL);
    if (!existing || rec.Fecha > existing.Fecha) {
      uniqueEmployeesRoster.set(rec.CUIL, rec);
    }
  });
  
  const employeeData = Array.from(uniqueEmployeesRoster.values()).filter(rec => {
    const hasStarted = rec['Fecha Ingreso'] <= endDateOfFilter;
    const hasNotLeft = !rec['Fecha Baja'] || rec['Fecha Baja'] > endDateOfFilter;
    return hasStarted && hasNotLeft;
  });

  const employeeCount = employeeData.length;

  const totalSalaries = data.reduce((sum, rec) => sum + rec.Monto, 0);
  
  let totalAge = 0;
  let totalSeniority = 0;
  
  employeeData.forEach(rec => {
    // Age
    const birthDate = rec['Fecha de Nacimiento'];
    if (birthDate && !isNaN(birthDate.getTime())) {
        let age = endDateOfFilter.getFullYear() - birthDate.getFullYear();
        const m = endDateOfFilter.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && endDateOfFilter.getDate() < birthDate.getDate())) {
            age--;
        }
        totalAge += age;
    }

    // Seniority
    const ingressDate = rec['Fecha Ingreso'];
    if (ingressDate && !isNaN(ingressDate.getTime())) {
        const seniorityInYears = (endDateOfFilter.getTime() - ingressDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        totalSeniority += seniorityInYears;
    }
  });

  // --- NEW: Separate Salary Averages (excluding certain types) ---
  const managementKeywords = ['GERENCIA', 'GERENTE'];
  const excludedSalaryTypes = ['AGUINALDO', 'COMISIONES/ADICIONALES'];
  const salaryByTypeAgg = {
      employee: { total: 0, cuils: new Set<string>() },
      management: { total: 0, cuils: new Set<string>() }
  };

  data.forEach(rec => {
      const isManagement = managementKeywords.some(keyword => rec.Categoria.toUpperCase().includes(keyword));
      const isExcludedType = excludedSalaryTypes.includes(rec.Tipo.toUpperCase());
      
      if (isManagement) {
          if (!isExcludedType) {
              salaryByTypeAgg.management.total += rec.Monto;
          }
          salaryByTypeAgg.management.cuils.add(rec.CUIL);
      } else {
          if (!isExcludedType) {
              salaryByTypeAgg.employee.total += rec.Monto;
          }
          salaryByTypeAgg.employee.cuils.add(rec.CUIL);
      }
  });

  const avgSalaryEmployee = salaryByTypeAgg.employee.cuils.size > 0
      ? salaryByTypeAgg.employee.total / salaryByTypeAgg.employee.cuils.size
      : 0;
      
  const avgSalaryManagement = salaryByTypeAgg.management.cuils.size > 0
      ? salaryByTypeAgg.management.total / salaryByTypeAgg.management.cuils.size
      : 0;

  const kpis: HRKpiData = {
    totalSalaries,
    employeeCount,
    avgSalaryEmployee,
    avgSalaryManagement,
    avgAge: employeeCount > 0 ? totalAge / employeeCount : 0,
    avgSeniority: employeeCount > 0 ? totalSeniority / employeeCount : 0,
    avgVacationDays: 0, // This will be replaced by the calculation below
  };

  // --- NEW VACATION ANALYSIS ---
  const latestYearInData = Math.max(...allData.map(rec => rec.Año));
  const endOfAnalysisYear = new Date(latestYearInData, 11, 31); // December 31st

  const employeeVacationData = employeeData.map(rec => {
      const ingressDate = rec['Fecha Ingreso'];
      let seniorityInYears = 0;
      let calculatedVacationDays = 0;

      if (ingressDate && !isNaN(ingressDate.getTime()) && ingressDate < endOfAnalysisYear) {
          const seniorityInMs = endOfAnalysisYear.getTime() - ingressDate.getTime();
          seniorityInYears = seniorityInMs / (1000 * 60 * 60 * 24 * 365.25);

          if (seniorityInYears < 0.5) { // Less than 6 months
              const daysWorked = seniorityInMs / (1000 * 60 * 60 * 24);
              calculatedVacationDays = Math.floor(daysWorked / 20);
          } else if (seniorityInYears < 5) {
              calculatedVacationDays = 14;
          } else if (seniorityInYears < 10) {
              calculatedVacationDays = 21;
          } else if (seniorityInYears < 20) {
              calculatedVacationDays = 28;
          } else {
              calculatedVacationDays = 35;
          }
      }
      
      return {
          cuil: rec.CUIL,
          name: rec.Empleado,
          area: rec.Area,
          category: rec.Categoria,
          seniority: seniorityInYears,
          calculatedVacationDays: calculatedVacationDays
      };
  });

  const totalCalculatedVacationDays = employeeVacationData.reduce((sum, emp) => sum + emp.calculatedVacationDays, 0);
  kpis.avgVacationDays = employeeCount > 0 ? totalCalculatedVacationDays / employeeCount : 0;
  
  const vacationAnalysisTable: VacationAnalysisItem[] = employeeVacationData
    .map(emp => ({
        employeeName: emp.name,
        seniority: emp.seniority,
        calculatedVacationDays: emp.calculatedVacationDays
    }))
    .sort((a, b) => a.employeeName.localeCompare(b.employeeName));

  const seniorityDistributionBuckets = { '0-5 años': 0, '5-10 años': 0, '10-20 años': 0, '+20 años': 0 };
  employeeVacationData.forEach(emp => {
      if (emp.seniority < 5) seniorityDistributionBuckets['0-5 años']++;
      else if (emp.seniority < 10) seniorityDistributionBuckets['5-10 años']++;
      else if (emp.seniority < 20) seniorityDistributionBuckets['10-20 años']++;
      else seniorityDistributionBuckets['+20 años']++;
  });
  const seniorityDistribution = Object.entries(seniorityDistributionBuckets)
      .map(([name, value]) => ({ name, value }));

  const groupAndAverageVacations = (key: 'area' | 'category') => {
      const aggregation: { [key: string]: { totalDays: number; count: number } } = {};
      employeeVacationData.forEach(emp => {
          const groupKey = emp[key];
          if (!aggregation[groupKey]) aggregation[groupKey] = { totalDays: 0, count: 0 };
          aggregation[groupKey].totalDays += emp.calculatedVacationDays;
          aggregation[groupKey].count++;
      });
      return Object.entries(aggregation)
          .map(([name, data]) => ({ name, value: data.count > 0 ? data.totalDays / data.count : 0 }))
          .sort((a,b) => b.value - a.value);
  };
  const avgVacationDaysByArea = groupAndAverageVacations('area');
  const avgVacationDaysByCategory = groupAndAverageVacations('category');


  // --- Aggregations for Charts (using full filtered `data`) ---
  const salaryDistributionByType: { [key: string]: number } = {};
  const costByArea: { [key: string]: number } = {};
  const costByActivity: { [key: string]: number } = {};
  const salaryByMonth: { [key: string]: number } = {};
  const salaryByEmployee: { [key: string]: { total: number; } } = {};

  data.forEach(rec => {
    salaryDistributionByType[rec.Tipo] = (salaryDistributionByType[rec.Tipo] || 0) + rec.Monto;
    costByArea[rec.Area] = (costByArea[rec.Area] || 0) + rec.Monto;
    costByActivity[rec.Actividad] = (costByActivity[rec.Actividad] || 0) + rec.Monto;
    
    const monthStr = rec.Fecha.toISOString().slice(0, 7);
    salaryByMonth[monthStr] = (salaryByMonth[monthStr] || 0) + rec.Monto;
    
    if (!salaryByEmployee[rec.CUIL]) {
        salaryByEmployee[rec.CUIL] = { total: 0 };
    }
    salaryByEmployee[rec.CUIL].total += rec.Monto;
  });

  const employeesByActivityAgg: { [key: string]: number } = {};
  employeeData.forEach(rec => {
      const activityKey = rec.Actividad || 'N/A';
      employeesByActivityAgg[activityKey] = (employeesByActivityAgg[activityKey] || 0) + 1;
  });

  const salaryEvolution = Object.entries(salaryByMonth)
    .map(([date, value]) => ({ date, Ventas: value }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const employeeRanking = employeeData.map(emp => {
      const salaryDataForPeriod = salaryByEmployee[emp.CUIL];

      let seniority = 0;
      const ingressDate = emp['Fecha Ingreso'];
      if (ingressDate && !isNaN(ingressDate.getTime())) {
          const endDate = emp['Fecha Baja'] || endDateOfFilter;
          if (endDate > ingressDate) {
              seniority = (endDate.getTime() - ingressDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
          }
      }

      return {
          cuil: emp.CUIL,
          name: emp.Empleado,
          totalAmount: salaryDataForPeriod ? salaryDataForPeriod.total : 0,
          area: emp.Area,
          category: emp.Categoria,
          fechaBaja: emp['Fecha Baja'],
          seniority: seniority,
          vacationDays: emp['Dias de Vacaciones'],
      };
  }).sort((a, b) => b.totalAmount - a.totalAmount);
    
  // --- Seniority vs Salary by Category (uses `employeeData` for accurate roster) ---
  const byCategory: { [cat: string]: { employees: Set<string>, totalSalary: number, totalSeniority: number } } = {};
  data.forEach(rec => { // Iterate all transactions to get total salary
    if (!byCategory[rec.Categoria]) {
        byCategory[rec.Categoria] = { employees: new Set(), totalSalary: 0, totalSeniority: 0 };
    }
    byCategory[rec.Categoria].totalSalary += rec.Monto;
  });

  employeeData.forEach(emp => { // Iterate roster to get unique seniority
      const cat = emp.Categoria;
      if (byCategory[cat]) {
          if (!byCategory[cat].employees.has(emp.CUIL)) {
              byCategory[cat].employees.add(emp.CUIL);
              if (emp['Fecha Ingreso'] && !isNaN(emp['Fecha Ingreso'].getTime())) {
                  const seniority = (endDateOfFilter.getTime() - emp['Fecha Ingreso'].getTime()) / (1000 * 60 * 60 * 24 * 365.25);
                  byCategory[cat].totalSeniority += seniority;
              }
          }
      }
  });

  const seniorityVsSalaryByCategory: HRSenioritySalaryComparisonItem[] = Object.entries(byCategory).map(([cat, data]) => {
      const empCount = data.employees.size;
      return {
          category: cat,
          employeeCount: empCount,
          avgSalary: empCount > 0 ? data.totalSalary / empCount : 0, // Avg salary of the period
          avgSeniority: empCount > 0 ? data.totalSeniority / empCount : 0, // Seniority snapshot
      };
  }).sort((a,b) => b.avgSalary - a.avgSalary);
  
  // --- Yearly Trend ---
  const yearlySalaries: { [year: string]: { [month: number]: number } } = {};
  const fullDataSet = allData.length > 0 ? allData : data;
  fullDataSet.forEach(rec => {
      const year = rec.Año.toString();
      const month = rec.Mes - 1;
      if (!yearlySalaries[year]) yearlySalaries[year] = {};
      yearlySalaries[year][month] = (yearlySalaries[year][month] || 0) + rec.Monto;
  });
  
  const availableYearsForTrend = Object.keys(yearlySalaries).sort().reverse();
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const yearlySalaryTrend = monthNames.map((monthName, monthIndex) => {
      const monthData: YearlyTrendDataPoint = { month: monthName };
      availableYearsForTrend.forEach(year => {
          monthData[year] = yearlySalaries[year]?.[monthIndex] || 0;
      });
      return monthData;
  });

  // --- NEW BIRTHDAY ANALYSIS ---
  const selectedMonths = new Set(filters.months);
  
  let birthdaysInMonth: BirthdayInfo[] = [];
  // Use the robust `employeeData` roster and the `filters.months` set.
  if (selectedMonths.size > 0 && employeeData.length > 0) {
    
    birthdaysInMonth = employeeData
      .filter(emp => {
          const birthMonth = emp['Fecha de Nacimiento']?.getMonth() + 1;
          return birthMonth && selectedMonths.has(birthMonth);
      })
      .map(emp => {
        const birthDate = emp['Fecha de Nacimiento'];
        const birthYear = birthDate.getFullYear();
        return {
          name: emp.Empleado,
          birthDate: birthDate,
          ageTurning: latestYearInFilter - birthYear,
          branch: emp.Area,
          position: emp.Categoria,
        };
      })
      .sort((a, b) => a.birthDate.getDate() - b.birthDate.getDate());
  }

  return {
    kpis,
    salaryDistributionByType: formatForPieChart(salaryDistributionByType),
    costByArea: formatForPieChart(costByArea),
    costByActivity: formatForPieChart(costByActivity),
    employeesByActivity: formatForPieChart(employeesByActivityAgg),
    salaryEvolution,
    employeeRanking,
    seniorityVsSalaryByCategory,
    yearlySalaryTrend,
    availableYearsForTrend,
    availableYears: [...new Set(fullDataSet.map(d => d.Año.toString()))].sort((a,b) => b.localeCompare(a)),
    availableAreas: [...new Set(fullDataSet.map(d => d.Area))].sort(),
    availableActivities: [...new Set(fullDataSet.map(d => d.Actividad))].sort(),
    availableCategories: [...new Set(fullDataSet.map(d => d.Categoria))].sort(),
    availableTypes: [...new Set(fullDataSet.map(d => d.Tipo))].sort(),
    availableMonths: [...new Set(fullDataSet.map(d => d.Mes))].sort((a,b) => a - b),
    vacationAnalysisTable,
    seniorityDistribution,
    avgVacationDaysByArea,
    avgVacationDaysByCategory,
    birthdaysInMonth,
  };
};

// --- NEW STOCK DATA PROCESSOR ---
export const processStockData = (
  filteredData: StockRecord[], 
  allData: StockRecord[] = [],
  filters: { years: string[], months: number[] },
  // Add new data sources
  allSalesData: SaleRecord[] = [],
  allPurchasesData: PurchaseRecord[] = [],
  allExpensesData: ExpenseRecord[] = [],
  allHRData: HRRecord[] = []
): StockAnalysisResults | null => {

  const isSingleMonthView = filters.years.length === 1 && filters.months.length === 1;
  const dataForEvolution = isSingleMonthView ? allData : filteredData;

  if (filteredData.length === 0 && dataForEvolution.length === 0) {
    return null;
  }
  
  const data = filteredData; // Alias for clarity: KPIs and pies are based on filtered data
  
  // --- Filter external data for the selected period ---
  const selectedYears = new Set(filters.years.map(y => parseInt(y, 10)));
  const selectedMonths = new Set(filters.months);

  let totalSales = 0, totalPurchases = 0, totalExpenses = 0, totalSalaries = 0;
  const salesBySucursal: { [key: string]: number } = {};
  
  const salesForPeriod = allSalesData.filter(r =>
    !isDebitNote(r) &&
    (selectedYears.size === 0 || selectedYears.has(r.Fecha.getFullYear())) &&
    (selectedMonths.size === 0 || selectedMonths.has(r.Fecha.getMonth() + 1))
  );

  salesForPeriod.forEach(r => {
    const amount = isCreditNote(r) ? -Math.abs(r.Total) : Math.abs(r.Total);
    totalSales += amount;
    const sucKey = r.Suc.trim().toUpperCase();
    salesBySucursal[sucKey] = (salesBySucursal[sucKey] || 0) + amount;
  });

  const purchasesForPeriod = allPurchasesData.filter(p =>
    (selectedYears.size === 0 || selectedYears.has(p.Año)) &&
    (selectedMonths.size === 0 || selectedMonths.has(p.Mes))
  );
  totalPurchases = purchasesForPeriod.reduce((sum, p) => sum + p['Con Impuestos'], 0);

  const expensesForPeriod = allExpensesData.filter(e =>
    (selectedYears.size === 0 || selectedYears.has(e.Año)) &&
    (selectedMonths.size === 0 || selectedMonths.has(e.Mes))
  );
  totalExpenses = expensesForPeriod.reduce((sum, e) => sum + e.Monto_ars, 0);

  const hrForPeriod = allHRData.filter(h =>
    (selectedYears.size === 0 || selectedYears.has(h.Año)) &&
    (selectedMonths.size === 0 || selectedMonths.has(h.Mes))
  );
  totalSalaries = hrForPeriod.reduce((sum, h) => sum + h.Monto, 0);


  // --- Aggregations for KPIs and Pies (from filtered data) ---
  const stockByMonth: { [key: string]: number } = {};
  const stockByRubro: { [key: string]: number } = {};
  const stockByRubroUSD: { [key: string]: number } = {};
  const stockBySucursal: { [key: string]: number } = {};
  const stockBySucursalUSD: { [key: string]: number } = {};
  const stockByRubroForRankingUSD: { [key: string]: number } = {};


  const latestDate = data.length > 0 ? data.reduce((max, r) => r.Fecha > max ? r.Fecha : max, data[0].Fecha) : null;
  const latestMonthData = latestDate ? data.filter(d => 
    d.Fecha.getFullYear() === latestDate.getFullYear() && 
    d.Fecha.getMonth() === latestDate.getMonth()
  ) : [];

  latestMonthData.forEach(rec => {
    stockByRubro[rec['Rubro productos']] = (stockByRubro[rec['Rubro productos']] || 0) + rec['Valorizado en $ a dolar oficial'];
    stockByRubroUSD[rec['Rubro productos']] = (stockByRubroUSD[rec['Rubro productos']] || 0) + rec['Valorizado en USD OFICIAL'];
    stockBySucursal[rec.Suc] = (stockBySucursal[rec.Suc] || 0) + rec['Valorizado en $ a dolar oficial'];
    stockBySucursalUSD[rec.Suc] = (stockBySucursalUSD[rec.Suc] || 0) + rec['Valorizado en USD OFICIAL'];
    stockByRubroForRankingUSD[rec['Rubro productos']] = (stockByRubroForRankingUSD[rec['Rubro productos']] || 0) + rec['Valorizado en USD OFICIAL'];
  });

  data.forEach(rec => {
    const monthStr = rec.Fecha.toISOString().slice(0, 7);
    stockByMonth[monthStr] = (stockByMonth[monthStr] || 0) + rec['Valorizado en $ a dolar oficial'];
  });
  
  // --- Aggregations for Evolution Charts (from conditionally sourced data) ---
  const stockByMonthUSD: { [key: string]: number } = {};
  const dollarOfficialByMonth: { [key: string]: { sum: number, count: number } } = {};
  const dollarSistemaByMonth: { [key: string]: { sum: number, count: number } } = {};

  dataForEvolution.forEach(rec => {
    const monthStr = rec.Fecha.toISOString().slice(0, 7);

    // For Stock Evolution
    stockByMonthUSD[monthStr] = (stockByMonthUSD[monthStr] || 0) + rec['Valorizado en USD OFICIAL'];

    // For Dollar Evolution
    if (!dollarOfficialByMonth[monthStr]) dollarOfficialByMonth[monthStr] = { sum: 0, count: 0 };
    dollarOfficialByMonth[monthStr].sum += rec['Cotizacion Dolar Oficial'];
    dollarOfficialByMonth[monthStr].count++;

    if (!dollarSistemaByMonth[monthStr]) dollarSistemaByMonth[monthStr] = { sum: 0, count: 0 };
    dollarSistemaByMonth[monthStr].sum += rec['Cotizacion Dolar Sistema'];
    dollarSistemaByMonth[monthStr].count++;
  });


  // --- KPI Calculations ---
  const kpis: StockKpiData = {
    stockTotalOficialPesos: latestMonthData.reduce((sum, r) => sum + r['Valorizado en $ a dolar oficial'], 0),
    stockTotalOficialUSD: latestMonthData.reduce((sum, r) => sum + r['Valorizado en USD OFICIAL'], 0),
    stockTotalSistemaUSD: latestMonthData.reduce((sum, r) => sum + r['Valorizado en USD SISTEMA'], 0),
    // FIX: Changed 'monthlyVariationPesosOficial' to 'stockTotalPesosChange' to match the type definition.
    stockTotalPesosChange: 0,
    avgMonthlyStock: 0,
    avgCotizacionOficial: latestMonthData.length > 0 ? latestMonthData.reduce((sum, r) => sum + r['Cotizacion Dolar Oficial'], 0) / latestMonthData.length : 0,
    avgCotizacionSistema: latestMonthData.length > 0 ? latestMonthData.reduce((sum, r) => sum + r['Cotizacion Dolar Sistema'], 0) / latestMonthData.length : 0,
    diffCotizacionPercent: 0,
    // Initialize new KPIs
    stockTurnover: 0,
    daysOfCoverage: 0,
    stockToPurchaseRatio: 0,
    financialCoverage: 0,
  };

  if (kpis.avgCotizacionOficial > 0) {
    kpis.diffCotizacionPercent = ((kpis.avgCotizacionSistema / kpis.avgCotizacionOficial) - 1) * 100;
  }
  
  const sortedMonths = Object.keys(stockByMonth).sort();
  if (sortedMonths.length > 1) {
    const lastMonthTotal = stockByMonth[sortedMonths[sortedMonths.length - 1]];
    const secondLastMonthTotal = stockByMonth[sortedMonths[sortedMonths.length - 2]];
    if (secondLastMonthTotal > 0) {
      // FIX: Changed 'monthlyVariationPesosOficial' to 'stockTotalPesosChange' to match the type definition.
      kpis.stockTotalPesosChange = ((lastMonthTotal - secondLastMonthTotal) / secondLastMonthTotal) * 100;
    }
  }

  const monthlyTotals = Object.values(stockByMonth);
  if (monthlyTotals.length > 0) {
    kpis.avgMonthlyStock = monthlyTotals.reduce((sum, val) => sum + val, 0) / monthlyTotals.length;
  }

  // --- NEW KPI CALCULATIONS (ANNUALIZED) ---
  const numMonthsInPeriod = monthlyTotals.length;
  const avgStockForPeriod = kpis.avgMonthlyStock;
  const annualizedSales = numMonthsInPeriod > 0 ? (totalSales / numMonthsInPeriod) * 12 : 0;
  
  kpis.stockTurnover = avgStockForPeriod > 0 ? annualizedSales / avgStockForPeriod : 0;

  const avgDailySales = totalSales / (numMonthsInPeriod * 30); // Approximate daily sales
  // Use latest month's stock for coverage, as it's a "point in time" metric
  const currentStock = kpis.stockTotalOficialPesos;
  kpis.daysOfCoverage = avgDailySales > 0 ? currentStock / avgDailySales : 0;
  
  kpis.stockToPurchaseRatio = totalPurchases > 0 ? currentStock / totalPurchases : 0;
  
  const totalMonthlyCosts = totalExpenses + totalSalaries;
  kpis.financialCoverage = totalMonthlyCosts > 0 ? currentStock / totalMonthlyCosts : 0;
  
  // --- Chart & Table Data Formatting ---
  // The data for sales by rubro is not available, so this cannot be calculated.
  const stockTurnoverByRubro: ChartDataPoint[] = [];
  
  const branchesToInclude = ['LIBANO', 'MITRE', 'CATAMARCA', 'SALTA', 'JUJUY', 'YERBA BUENA', 'PERICO'];

  const stockBySucursalAndMonth: { [suc: string]: { [month: string]: number } } = {};
  data.forEach(rec => {
    const monthStr = rec.Fecha.toISOString().slice(0, 7);
    const sucKey = rec.Suc.trim().toUpperCase();
    if (!stockBySucursalAndMonth[sucKey]) {
      stockBySucursalAndMonth[sucKey] = {};
    }
    stockBySucursalAndMonth[sucKey][monthStr] = (stockBySucursalAndMonth[sucKey][monthStr] || 0) + rec['Valorizado en $ a dolar oficial'];
  });

  const avgStockBySucursal: { [key: string]: number } = {};
  for (const suc in stockBySucursalAndMonth) {
    const monthlyValues = Object.values(stockBySucursalAndMonth[suc]);
    if (monthlyValues.length > 0) {
      avgStockBySucursal[suc] = monthlyValues.reduce((sum, val) => sum + val, 0) / monthlyValues.length;
    }
  }

  const stockTurnoverBySucursal: ChartDataPoint[] = Object.keys(avgStockBySucursal)
    .filter(name => branchesToInclude.includes(name.toUpperCase()))
    .map(name => {
      const salesValueForPeriod = salesBySucursal[name.trim().toUpperCase()] || 0;
      const avgStockValue = avgStockBySucursal[name];
      const annualizedSalesForBranch = numMonthsInPeriod > 0 ? (salesValueForPeriod / numMonthsInPeriod) * 12 : 0;
      const turnover = avgStockValue > 0 ? annualizedSalesForBranch / avgStockValue : 0;
      return { name, value: turnover };
    })
    .sort((a, b) => b.value - a.value);

  const includedBranchesForTotal = Object.keys(avgStockBySucursal)
    .filter(suc => branchesToInclude.includes(suc.toUpperCase()));

  const totalSalesForTurnover = includedBranchesForTotal.reduce((sum, suc) => sum + (salesBySucursal[suc.toUpperCase()] || 0), 0);
  const totalAvgStockForTurnover = includedBranchesForTotal.reduce((sum, suc) => sum + (avgStockBySucursal[suc] || 0), 0);
  
  const annualizedTotalSales = numMonthsInPeriod > 0 ? (totalSalesForTurnover / numMonthsInPeriod) * 12 : 0;
  const totalStockTurnover = totalAvgStockForTurnover > 0 ? annualizedTotalSales / totalAvgStockForTurnover : 0;


  const dollarEvolution: DollarEvolutionDataPoint[] = Object.keys(dollarOfficialByMonth).sort().map(month => ({
    date: month,
    'Dólar Oficial': dollarOfficialByMonth[month].sum / dollarOfficialByMonth[month].count,
    'Dólar Sistema': dollarSistemaByMonth[month].sum / dollarSistemaByMonth[month].count,
  }));

  const rubroRanking: RankingItem[] = Object.entries(stockByRubro)
    .map(([name, total]) => ({ name, totalSales: total, invoiceCount: 0 }))
    .sort((a, b) => b.totalSales - a.totalSales);

  const rubroRankingUSD: RankingItem[] = Object.entries(stockByRubroForRankingUSD)
    .map(([name, total]) => ({ name, totalSales: total, invoiceCount: 0 }))
    .sort((a, b) => b.totalSales - a.totalSales);
    
  const stockEvolution = Object.entries(stockByMonthUSD)
    .map(([date, value]) => ({ date, 'Stock Valorizado (USD)': value }))
    .sort((a, b) => a.date.localeCompare(b.date));
    
  const fullDataSet = allData.length > 0 ? allData : data;

  return {
    kpis,
    stockEvolution,
    stockByRubro: formatForPieChart(stockByRubro),
    stockByRubroUSD: formatForPieChart(stockByRubroUSD),
    stockBySucursal: formatForPieChart(stockBySucursal),
    stockBySucursalUSD: formatForPieChart(stockBySucursalUSD),
    dollarEvolution,
    rubroRanking,
    rubroRankingUSD,
    stockTurnoverByRubro,
    stockTurnoverBySucursal,
    totalStockTurnover,
    availableYears: [...new Set(fullDataSet.map(d => d.Año.toString()))].sort((a, b) => b.localeCompare(a)),
    availableMonths: [...new Set(fullDataSet.map(d => d.Mes))].sort((a, b) => a - b),
    availableSucursales: [...new Set(fullDataSet.map(d => d.Suc))].sort(),
    availableRubros: [...new Set(fullDataSet.map(d => d['Rubro productos']))].sort(),
  };
};