







import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend, BarChart, Bar, LineChart, Line } from 'recharts';
import { ExpensesAnalysisResults } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';
import KpiCard from './KpiCard';
import ChartCard from './ChartCard';
import { TrendingUp, TrendingDown, XCircle } from 'lucide-react';
import AggregatedExpenseTable from './AggregatedExpenseTable';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const firstPayload = payload[0];

  // Logic specifically for PieChart. PieChart payloads have 'name' and 'value' directly on the payload item.
  // The original data object is in `firstPayload.payload`. `label` is undefined for pie tooltips.
  if (firstPayload.payload && firstPayload.dataKey === 'value' && typeof label === 'undefined') {
      const categoryName = firstPayload.name;
      const amount = firstPayload.value;
      const percentage = firstPayload.payload.percentage;

      return (
          <div className="bg-white p-2 border border-gray-300 rounded shadow-lg text-sm">
            <p className="font-bold mb-1 text-gray-800">{categoryName}</p>
            <p className="text-gray-700">{`Monto: ${formatCurrency(amount)}`}</p>
            {percentage !== undefined && <p className="text-gray-700">{`Porcentaje: ${(percentage * 100).toFixed(2)}%`}</p>}
          </div>
      );
  }
  
  // For Line/Area/Bar Charts
  let displayLabel = label;
  if (typeof label === 'string' && /\d{4}-\d{2}/.test(label)) {
    const [year, month] = label.split('-');
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, 15));
    displayLabel = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  } else if (payload[0]?.payload?.month) {
    displayLabel = `Mes: ${label}`;
  }


  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-xl text-sm">
      <p className="font-bold text-gray-800 mb-2 truncate" title={displayLabel || payload[0]?.payload.name}>{displayLabel || payload[0]?.payload.name}</p>
      {payload.map((pld: any, index: number) => (
        <div key={index} className="flex items-center justify-between">
            <div className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: pld.stroke || pld.fill }}></span>
                <span className="text-gray-600">{(pld.name === 'Ventas' || pld.name === 'total') ? 'Gasto' : pld.name}:</span>
            </div>
            <span className="font-semibold text-gray-800 ml-4">{formatCurrency(pld.value as number)}</span>
        </div>
      ))}
    </div>
  );
};

const ExpensesDashboard = React.forwardRef<HTMLDivElement, { results: ExpensesAnalysisResults }>(({ results }, ref) => {
  const { 
    kpis: initialKpis, 
    expensesOverTime: initialExpensesOverTime, 
    expenseDetails, 
    expensesByCategoryAggregated, 
    expensesBySubcategoryAggregated, 
    expensesByDetailAggregated, 
    topSubcategories, 
    yearlyExpenseTrend, 
    availableYearsForTrend,
    expensesByCategory 
  } = results;

  const ELEGANT_COLORS = ['#0284c7', '#14b8a6', '#f97316', '#6d28d9', '#475569', '#db2777', '#0ea5e9', '#22c55e', '#8b5cf6', '#38bdf8', '#4ade80', '#a78bfa'];
  const YEAR_TREND_COLORS = ELEGANT_COLORS.slice(0, 5);
  const PIE_CHART_COLORS = ELEGANT_COLORS;
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(prev => (prev === category ? null : category));
    setSelectedSubcategory(null);
  };

  const handleSubcategoryClick = (subcategory: string) => {
    setSelectedSubcategory(prev => (prev === subcategory ? null : subcategory));
  };

  const handleClearInteractiveFilters = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  };

  const subcategoryData = useMemo(() => {
    if (!selectedCategory) return expensesBySubcategoryAggregated;
    
    const filteredDetails = expenseDetails.filter(d => d.Categoría === selectedCategory);
    const aggregation: { [name: string]: { total: number; count: number } } = {};
    filteredDetails.forEach(rec => {
      const name = rec.Subcategoría || 'N/A';
      if (!aggregation[name]) aggregation[name] = { total: 0, count: 0 };
      aggregation[name].total += rec.Monto_ars;
      aggregation[name].count += 1;
    });
    return Object.entries(aggregation)
        .map(([name, values]) => ({ name, ...values }))
        .sort((a, b) => b.total - a.total);
  }, [selectedCategory, expenseDetails, expensesBySubcategoryAggregated]);

  const conceptData = useMemo(() => {
    if (!selectedCategory) return expensesByDetailAggregated;

    let filteredDetails = expenseDetails.filter(d => d.Categoría === selectedCategory);
    if (selectedSubcategory) {
        filteredDetails = filteredDetails.filter(d => d.Subcategoría === selectedSubcategory);
    }
    
    const aggregation: { [name: string]: { total: number; count: number } } = {};
    filteredDetails.forEach(rec => {
      const name = rec.Detalle || 'N/A';
      if (!aggregation[name]) aggregation[name] = { total: 0, count: 0 };
      aggregation[name].total += rec.Monto_ars;
      aggregation[name].count += 1;
    });
    return Object.entries(aggregation)
        .map(([name, values]) => ({ name, ...values }))
        .sort((a, b) => b.total - a.total);
  }, [selectedCategory, selectedSubcategory, expenseDetails, expensesByDetailAggregated]);
  
  const dynamicDashboardData = useMemo(() => {
    const interactiveFilteredData = selectedCategory
      ? expenseDetails.filter(d => 
          d.Categoría === selectedCategory && 
          (!selectedSubcategory || d.Subcategoría === selectedSubcategory)
        )
      : expenseDetails;
      
    if (!selectedCategory && !selectedSubcategory) {
      return {
          kpis: initialKpis,
          expensesOverTime: initialExpensesOverTime,
          expenseDistributionData: expensesByCategory,
          distributionChartTitle: "⚖️ Distribución de Gastos por Categoría",
          topDetailsChart: { // This is now unused but kept for safety in the memo structure.
              title: '🏆 Top 10 Subcategorías con Mayor Gasto',
              data: topSubcategories.map(item => ({ name: item.name, Gasto: item.totalSales })).reverse()
          }
      };
    }
    
    if (interactiveFilteredData.length === 0) {
      return {
          kpis: { ...initialKpis, totalExpenses: 0, totalExpensesChange: 0, opexTotal: 0, taxTotal: 0, topMonth: { name: '-', total: 0 } },
          expensesOverTime: [],
          expenseDistributionData: [],
          distributionChartTitle: "⚖️ Distribución de Gastos",
          topDetailsChart: { title: `Top Items en ${selectedSubcategory || selectedCategory}`, data: [] }
      };
    }

    const totalExpenses = interactiveFilteredData.reduce((sum, i) => sum + i.Monto_ars, 0);
    const taxCategories = [
      'TRIBUTOS Y TASAS',
      'TRIBUTOS MUNICIPALES',
      'TRIBUTOS NACIONALES',
      'TRIBUTOS PROVINCIALES'
    ];
    const taxTotal = interactiveFilteredData
      .filter(i => taxCategories.includes(i.Categoría.toUpperCase()))
      .reduce((sum, i) => sum + i.Monto_ars, 0);
    const opexTotal = totalExpenses - taxTotal;
    
    const expensesByMonth = interactiveFilteredData.reduce((acc, rec) => {
        const monthStr = rec.Fecha.toISOString().slice(0, 7);
        acc[monthStr] = (acc[monthStr] || 0) + rec.Monto_ars;
        return acc;
    }, {} as {[key: string]: number});

    const sortedMonths = Object.keys(expensesByMonth).sort();
    let totalExpensesChange = 0;
    if (sortedMonths.length > 1) {
        const last = expensesByMonth[sortedMonths[sortedMonths.length - 1]];
        const secondLast = expensesByMonth[sortedMonths[sortedMonths.length - 2]];
// FIX: Add type guard to ensure `last` and `secondLast` are numbers before performing arithmetic operations.
        if (typeof last === 'number' && typeof secondLast === 'number' && secondLast > 0) {
            totalExpensesChange = ((last - secondLast) / secondLast) * 100;
        }
    }
    
    const topMonthEntry = Object.entries(expensesByMonth).sort((a,b) => b[1] - a[1])[0];
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const topMonthName = topMonthEntry ? `${monthNames[new Date(topMonthEntry[0] + '-15T00:00:00Z').getUTCMonth()]} ${new Date(topMonthEntry[0] + '-15T00:00:00Z').getUTCFullYear()}` : '-';

    const kpis = { ...initialKpis, totalExpenses, totalExpensesChange, opexTotal, taxTotal, topMonth: { name: topMonthName, total: topMonthEntry ? topMonthEntry[1] : 0 } };
    
    const expensesOverTime = Object.entries(expensesByMonth).map(([date, v]) => ({ date, Ventas: v })).sort((a,b) => a.date.localeCompare(b.date));
    
    const formatForPie = (aggData: {[key: string]: number}) => {
        const total = Object.values(aggData).reduce((s, v) => s + v, 0);
        if (total === 0) return [];
        return Object.entries(aggData)
            .map(([name, value]) => ({ name, value, percentage: value / total }))
            .sort((a, b) => b.value - a.value);
    };

    let expenseDistributionData;
    let distributionChartTitle = "⚖️ Distribución de Gastos";

    if (selectedSubcategory) {
        const subcatName = selectedSubcategory.length > 20 ? `${selectedSubcategory.substring(0,20)}...` : selectedSubcategory;
        distributionChartTitle = `Distribución en ${subcatName}`;
        const aggByDetail = interactiveFilteredData.reduce((acc, item) => {
            const name = item.Detalle || 'N/A';
            acc[name] = (acc[name] || 0) + item.Monto_ars;
            return acc;
        }, {} as {[key: string]: number});
        expenseDistributionData = formatForPie(aggByDetail);
    } else if (selectedCategory) {
        const catName = selectedCategory.length > 20 ? `${selectedCategory.substring(0,20)}...` : selectedCategory;
        distributionChartTitle = `Distribución en ${catName}`;
        const aggBySubcategory = interactiveFilteredData.reduce((acc, item) => {
            const name = item.Subcategoría || 'N/A';
            acc[name] = (acc[name] || 0) + item.Monto_ars;
            return acc;
        }, {} as {[key: string]: number});
        expenseDistributionData = formatForPie(aggBySubcategory);
    }
    
    const keyToAggregate = selectedSubcategory ? 'Detalle' : 'Subcategoría';
    const agg = interactiveFilteredData.reduce((acc, item) => {
        const name = item[keyToAggregate] || 'N/A';
        acc[name] = (acc[name] || 0) + item.Monto_ars;
        return acc;
    }, {} as {[key: string]: number});

    const titlePrefix = selectedSubcategory ? 'Conceptos' : 'Subcategorías';
    const filterName = selectedSubcategory || selectedCategory || '';
    
    const topDetailsChart = {
        title: `🏆 Top ${titlePrefix} in ${filterName.substring(0, 15)}${filterName.length > 15 ? '...' : ''}`,
// FIX: Use nullish coalescing operator (??) to ensure sort comparison values are always numbers, preventing type errors.
        data: Object.entries(agg).map(([name, Gasto]) => ({name, Gasto})).sort((a,b) => (b.Gasto ?? 0) - (a.Gasto ?? 0)).slice(0, 10).reverse()
    };

    return { kpis, expensesOverTime, expenseDistributionData, topDetailsChart, distributionChartTitle };
  }, [expenseDetails, selectedCategory, selectedSubcategory, initialKpis, initialExpensesOverTime, topSubcategories, expensesByCategory]);

  return (
    <div className="space-y-6" ref={ref}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard title={`💸 Gasto ${selectedCategory ? '(Selección)' : 'Total'}`} value={dynamicDashboardData.kpis.totalExpenses} format="currency" change={dynamicDashboardData.kpis.totalExpensesChange} positiveChangeIsBad />
        <KpiCard title="📈 Variación Mensual" value={dynamicDashboardData.kpis.totalExpensesChange} format="percentage" 
          details={
            <div className={`flex items-center text-sm ${dynamicDashboardData.kpis.totalExpensesChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {dynamicDashboardData.kpis.totalExpensesChange >= 0 ? <TrendingUp className="w-4 h-4 mr-1"/> : <TrendingDown className="w-4 h-4 mr-1"/>}
              <span>{dynamicDashboardData.kpis.totalExpensesChange >= 0 ? 'Aumento' : 'Reducción'} vs mes anterior</span>
            </div>
          } 
        />
        <KpiCard title="🏢 Gasto Operativo (OPEX)" value={dynamicDashboardData.kpis.opexTotal} format="currency" />
        <KpiCard title="🧾 Impuestos" value={dynamicDashboardData.kpis.taxTotal} format="currency" />
        <KpiCard title="📆 Mes con Mayor Gasto" value={dynamicDashboardData.kpis.topMonth.total} format="currency" details={<span className="font-bold text-pizarro-blue-700">{dynamicDashboardData.kpis.topMonth.name}</span>} />
      </div>

      <ChartCard title={`📊 Evolución Mensual de Gastos ${selectedCategory ? '(Selección)' : ''}`} className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dynamicDashboardData.expensesOverTime} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
            <defs><linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6d28d9" stopOpacity={0.8}/><stop offset="95%" stopColor="#6d28d9" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={(tick) => new Date(`${tick}-15T00:00:00Z`).toLocaleDateString('es-ES', { month: 'short', year: '2-digit', timeZone: 'UTC' })} tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => formatNumber(v as number, true)} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="Ventas" name="Gasto" stroke="#6d28d9" fill="url(#expenseGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
      
      {selectedCategory && (
        <div className="bg-pizarro-blue-50 border border-pizarro-blue-200 text-pizarro-blue-800 p-3 rounded-lg flex justify-between items-center">
          <p className="text-sm font-medium truncate">
            Filtrando por: <span className="font-bold">{selectedCategory}</span>
            {selectedSubcategory && (
              <>
                <span className="mx-1">&gt;</span>
                <span className="font-bold truncate">{selectedSubcategory}</span>
              </>
            )}
          </p>
          <button 
            onClick={handleClearInteractiveFilters} 
            className="flex items-center gap-1 text-sm font-semibold hover:text-pizarro-blue-900 transition-colors flex-shrink-0"
          >
            <XCircle className="w-4 h-4" />
            Limpiar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AggregatedExpenseTable
          title="Detalle por Categoría"
          subtitle="Haga clic en una categoría para filtrar."
          data={expensesByCategoryAggregated}
          onItemClick={handleCategoryClick}
          selectedItem={selectedCategory}
        />
        <AggregatedExpenseTable
          title={`Detalle por Subcategoría${selectedCategory ? ` (${selectedCategory.substring(0, 15)}${selectedCategory.length > 15 ? '..' : ''})` : ''}`}
          subtitle={selectedCategory ? "Haga clic para filtrar conceptos." : "Seleccione una categoría para ver el desglose."}
          data={subcategoryData}
          onItemClick={selectedCategory ? handleSubcategoryClick : undefined}
          selectedItem={selectedSubcategory}
        />
        <AggregatedExpenseTable
          title={`Detalle por Concepto${selectedSubcategory ? ` (${selectedSubcategory.substring(0, 15)}${selectedSubcategory.length > 15 ? '..' : ''})` : selectedCategory ? ` (${selectedCategory.substring(0, 15)}${selectedCategory.length > 15 ? '..' : ''})` : ''}`}
          subtitle={selectedSubcategory ? "Mostrando detalle final." : selectedCategory ? "Seleccione una subcategoría para ver el detalle." : "Seleccione una categoría para empezar."}
          data={conceptData}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={dynamicDashboardData.distributionChartTitle} className="h-[500px] lg:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dynamicDashboardData.expenseDistributionData}
                dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="45%" outerRadius="95%"
                paddingAngle={3} cornerRadius={5}
              >
                {dynamicDashboardData.expenseDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="text-sm text-gray-500 truncate" title={selectedSubcategory || selectedCategory || 'Gasto Total'}>
                 {selectedSubcategory ? `Gasto en ${selectedSubcategory.length > 12 ? `${selectedSubcategory.substring(0,12)}...` : selectedSubcategory}` : selectedCategory ? `Gasto en ${selectedCategory.length > 12 ? `${selectedCategory.substring(0,12)}...` : selectedCategory}` : 'Gasto Total'}
              </span>
              <p className="text-3xl font-bold text-pizarro-blue-800 truncate" title={formatCurrency(dynamicDashboardData.kpis.totalExpenses)}>
                  {formatNumber(dynamicDashboardData.kpis.totalExpenses, true)}
              </p>
          </div>
        </ChartCard>

        <ChartCard title={`Desglose por Subcategoría ${selectedCategory ? `(en ${selectedCategory.substring(0,20)}...)` : ''}`} className="h-[400px] lg:col-span-2">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                    data={subcategoryData.slice(0, 15)} 
                    margin={{ top: 5, right: 20, left: 20, bottom: 70 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80} 
                        tick={{ fontSize: 10 }}
                        interval={0}
                    />
                    <YAxis 
                        tickFormatter={(v) => formatNumber(v as number, true)} 
                        tick={{ fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(243, 244, 246, 0.7)' }} />
                    <Bar dataKey="total" name="Gasto" radius={[4, 4, 0, 0]} animationDuration={800}>
                        {subcategoryData.slice(0, 15).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
      </div>

      {yearlyExpenseTrend.length > 0 && (
          <ChartCard title="🗓️ Comparativa Anual de Gastos por Mes" className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yearlyExpenseTrend} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }}/>
                      <YAxis tickFormatter={(v) => formatNumber(v as number, true)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      {availableYearsForTrend.map((year, index) => (
                          <Line
                              key={year} type="monotone" dataKey={year}
                              stroke={YEAR_TREND_COLORS[index % YEAR_TREND_COLORS.length]}
                              strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 7 }}
                          />
                      ))}
                  </LineChart>
              </ResponsiveContainer>
          </ChartCard>
      )}

    </div>
  );
});

export default React.memo(ExpensesDashboard);