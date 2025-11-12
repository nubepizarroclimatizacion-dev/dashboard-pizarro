import React, { useMemo, useState, useCallback } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, Sector, ReferenceLine, Label } from 'recharts';
import { StockAnalysisResults } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';
import KpiCard from './KpiCard';
import ChartCard from './ChartCard';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, XCircle, Info } from 'lucide-react';

// --- NEW Interpretation Message Component ---
const InterpretationMessage = ({ status, text }: { status: 'good' | 'warning' | 'bad' | 'neutral', text: string }) => {
    const config = {
        good: { icon: CheckCircle2, className: 'bg-green-100 text-green-800' },
        warning: { icon: AlertTriangle, className: 'bg-yellow-100 text-yellow-800' },
        bad: { icon: XCircle, className: 'bg-red-100 text-red-800' },
        neutral: { icon: Info, className: 'bg-gray-100 text-gray-800' },
    };
    const { icon: Icon, className } = config[status];
    return (
        <div className={`mt-2 p-2 rounded-lg flex items-start text-xs ${className}`}>
            <Icon className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            <p>{text}</p>
        </div>
    );
};


// --- NEW SPECIALIZED KPI CARDS ---

const GaugeKpiCard: React.FC<{ title: string; value: number; unit: string; description: string; max?: number, interpretation?: React.ReactNode }> = ({ title, value, unit, description, max = 3, interpretation }) => {
    const safeValue = isNaN(value) || !isFinite(value) ? 0 : value;
    const percentage = Math.min((safeValue / max) * 100, 100);
    
    let colorClass = 'text-red-500';
    let strokeColor = '#ef4444';
    if (safeValue > max / 3) {
      colorClass = 'text-yellow-500';
      strokeColor = '#f59e0b';
    }
    if (safeValue > (max * 2) / 3) {
      colorClass = 'text-green-500';
      strokeColor = '#22c55e';
    }

    return (
        <ChartCard title={title} className="h-auto min-h-[220px]">
             <div className="flex flex-col h-full justify-center">
                <div className="flex flex-col items-center justify-center h-full gap-2">
                    <div className="relative w-32 h-16">
                        <svg viewBox="0 0 100 50" className="w-full h-full">
                            <path d="M10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                            <path
                                d="M10 50 A 40 40 0 0 1 90 50"
                                fill="none"
                                stroke={strokeColor}
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${percentage * 1.256}, 125.6`}
                                style={{ transition: 'stroke-dasharray 0.7s ease-out' }}
                            />
                        </svg>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                            <p className={`text-3xl font-bold ${colorClass}`}>{safeValue.toFixed(1)}</p>
                            <p className="text-md font-medium text-gray-600 -mt-1">{unit}</p>
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500">{description}</p>
                    </div>
                </div>
                {interpretation && (
                    <div className="mt-2 px-1">
                        {interpretation}
                    </div>
                )}
            </div>
        </ChartCard>
    );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const firstPayload = payload[0];
  // Check for Pie Chart payload by looking for the 'valueUSD' property
  if (firstPayload.payload && firstPayload.payload.valueUSD !== undefined) {
    const { name, value, percentage, valueUSD } = firstPayload.payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-xl text-sm">
        <p className="font-bold text-gray-800 mb-2 flex items-center">
          <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: firstPayload.fill }}></span>
          {name}
        </p>
        <div className="space-y-1">
           <div className="flex justify-between">
            <span className="text-gray-600">Valor (USD):</span>
            <span className="font-semibold text-gray-800 ml-3">{formatCurrency(valueUSD, 'USD')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Valor (ARS):</span>
            <span className="font-semibold text-gray-800 ml-3">{formatCurrency(value)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Porcentaje:</span>
            <span className="font-semibold text-gray-800 ml-3">{(percentage * 100).toFixed(2)}%</span>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for other charts
  let displayLabel = firstPayload.payload.name || label;
  if (typeof label === 'string' && /\d{4}-\d{2}/.test(label)) {
    const [year, month] = label.split('-');
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, 15));
    displayLabel = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  }

  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-xl text-sm">
      <p className="font-bold text-gray-800 mb-2">{displayLabel}</p>
      {payload.map((pld: any, index: number) => {
        const value = pld.value as number;
        const name = pld.name as string;
        
        let valueText;
        if(name.includes('Rotación')){
            valueText = `${value.toFixed(2)} veces`;
        } else {
             const currencyCode = name.includes('USD') ? 'USD' : 'ARS';
             valueText = formatCurrency(value, currencyCode);
        }

        return (
          <div key={`${pld.dataKey}-${index}`} className="flex items-center justify-between">
              <div className="flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: pld.stroke || pld.fill }}></span>
                  <span className="text-gray-600">{name}:</span>
              </div>
              <span className="font-semibold text-gray-800 ml-4">
                {valueText}
              </span>
          </div>
        );
      })}
    </div>
  );
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-sm font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" pointerEvents="none">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Custom Legend for Pie Chart, now rendered outside the chart
const CustomLegend = (props: any) => {
    const { payload } = props;
    if (!payload || payload.length === 0) return null;

    return (
        <div className="flex-shrink-0 pt-4 w-full">
            <div className="max-h-24 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-gray-200 shadow-inner">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-2">
                    {payload.map((entry: any, index: number) => (
                        <div key={`item-${index}`} className="flex items-center text-xs truncate">
                            <span className="w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: entry.color }} />
                            <span className="text-gray-700 truncate" title={entry.value}>{entry.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Custom shape for the active (clicked) pie slice
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;

  return (
    <g style={{ filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.2))' }}>
      <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill="#333" className="text-base font-bold truncate">
        {payload.name}
      </text>
      <text x={cx} y={cy + 10} dy={8} textAnchor="middle" fill="#666" className="text-sm">
        {`${(percent * 100).toFixed(2)}%`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8} // This creates the "explode" effect
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="#fff"
        strokeWidth={2}
      />
    </g>
  );
};


const StockDashboard = React.forwardRef<HTMLDivElement, { results: StockAnalysisResults }>(({ results }, ref) => {
  const { kpis, stockEvolution, stockByRubro, stockByRubroUSD, stockBySucursal, dollarEvolution, rubroRankingUSD, stockBySucursalUSD, stockTurnoverBySucursal, totalStockTurnover } = results;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const onPieClick = useCallback((_: any, index: number) => {
    setActiveIndex(prevIndex => (prevIndex === index ? null : index));
  }, []);

  // --- NEW Interpretation Logic ---
  type Interpretation = { status: 'good' | 'warning' | 'bad' | 'neutral'; text: string };

  const getDaysCoverageInterpretation = useCallback((days: number): Interpretation => {
    if (isNaN(days) || !isFinite(days)) return { status: 'neutral', text: 'No se pudo calcular la cobertura.' };
    if (days < 30) return { status: 'bad', text: 'Muy ajustado: Riesgo de quiebre de stock y falta de productos.' };
    if (days <= 60) return { status: 'good', text: 'Nivel saludable para una empresa de distribución.' };
    if (days <= 90) return { status: 'warning', text: 'Moderadamente alto. Se recomienda revisar la rotación.' };
    return { status: 'bad', text: 'Exceso de stock. Indica baja rotación y capital inmovilizado.' };
  }, []);

  const getStockRatioInterpretation = useCallback((ratio: number): Interpretation => {
    if (isNaN(ratio) || !isFinite(ratio)) return { status: 'neutral', text: 'No se pudo calcular el ratio.' };
    if (ratio > 1.2) return { status: 'warning', text: 'Ratio > 1: Indica posible acumulación de inventario o baja rotación.' };
    if (ratio < 0.8) return { status: 'warning', text: 'Ratio < 1: Puede significar alta rotación o bajo inventario (riesgo de quiebre).' };
    return { status: 'good', text: 'Ratio ≈ 1: Sugiere un equilibrio razonable entre abastecimiento y rotación.' };
  }, []);
  
  const getFinancialCoverageInterpretation = useCallback((months: number): Interpretation => {
    if (isNaN(months) || !isFinite(months)) return { status: 'neutral', text: 'No se pudo calcular la cobertura.' };
    if (months <= 3) return { status: 'warning', text: 'Nivel bajo. Stock relativamente ajustado a los gastos.' };
    if (months <= 6) return { status: 'good', text: 'Nivel razonable. Buen equilibrio entre liquidez y disponibilidad.' };
    if (months <= 12) return { status: 'warning', text: 'Stock alto. Podría haber capital inmovilizado.' };
    return { status: 'bad', text: 'Exceso de stock importante. Implica baja rotación y alto costo financiero.' };
  }, []);

  const getStockTurnoverInterpretation = useCallback((turnover: number): Interpretation => {
    if (isNaN(turnover) || !isFinite(turnover)) {
      return { status: 'neutral', text: 'No se pudo calcular la rotación.' };
    }

    const monthsToSell = turnover > 0 ? 12 / turnover : 0;
    const monthsText = `(equivale a ${monthsToSell.toFixed(1)} meses para vender el stock)`;

    if (turnover > 12) return { status: 'warning', text: `Rotación muy alta ${monthsText}. Riesgo de quiebre de stock.` };
    if (turnover >= 6) return { status: 'good', text: `Buena rotación, nivel saludable ${monthsText}.` };
    if (turnover >= 3) return { status: 'warning', text: `Rotación moderada ${monthsText}. Requiere seguimiento.` };
    if (turnover >= 1) return { status: 'bad', text: `Baja rotación ${monthsText}. Exceso de stock.` };
    return { status: 'bad', text: `Stock inmovilizado o sin salida ${monthsText}.` };
  }, []);

  const ELEGANT_COLORS = ['#0284c7', '#14b8a6', '#f97316', '#6d28d9', '#475569', '#db2777'];
  const PIE_CHART_COLORS = [
    '#0284c7', '#0d9488', '#f97316', '#6d28d9', '#db2777', '#475569',
    '#0ea5e9', '#22c55e', '#8b5cf6', '#fb923c', '#f472b6', '#64748b',
    '#38bdf8', '#4ade80', '#a78bfa', '#fdba74', '#f9a8d4', '#94a3b8',
    '#7dd3fc', '#86efac', '#c4b5fd', '#fecaca', '#fbcfe8', '#cbd5e1'
  ];
  const DOLLAR_COLORS = { 'Dólar Sistema': '#f97316', 'Dólar Oficial': '#14b8a6' };
  
  const timeAxisTickFormatter = (tick: string): string => {
    const date = new Date(`${tick}-15T00:00:00Z`);
    return date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit', timeZone: 'UTC' });
  };

  const isSingleStockDataPoint = stockEvolution.length === 1;
  const isSingleDollarDataPoint = dollarEvolution.length === 1;

  const pieChartData = useMemo(() => {
    const usdMap = new Map(stockByRubroUSD.map(item => [item.name, item.value]));
    return stockByRubro.map(item => ({
      ...item,
      valueUSD: usdMap.get(item.name) || 0,
    }));
  }, [stockByRubro, stockByRubroUSD]);

  const legendPayload = useMemo(() => {
      return pieChartData.map((entry, index) => ({
        value: entry.name,
        color: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
      }));
  }, [pieChartData]);

  const daysCoverageInterp = getDaysCoverageInterpretation(kpis.daysOfCoverage);
  const stockRatioInterp = getStockRatioInterpretation(kpis.stockToPurchaseRatio);
  const financialCoverageInterp = getFinancialCoverageInterpretation(kpis.financialCoverage);
  const stockTurnoverInterp = getStockTurnoverInterpretation(kpis.stockTurnover);

  return (
    <div className="space-y-6" ref={ref}>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard title="Stock Total ($ Oficial)" value={kpis.stockTotalOficialPesos} format="currency" />
        <KpiCard title="Stock Total (USD Oficial)" value={kpis.stockTotalOficialUSD} format="currency" currencyCode="USD" />
        <KpiCard title="Variación Mensual ($)" value={kpis.stockTotalPesosChange} format="percentage" positiveChangeIsBad
          details={
            <div className={`flex items-center text-sm ${kpis.stockTotalPesosChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {kpis.stockTotalPesosChange >= 0 ? <TrendingUp className="w-4 h-4 mr-1"/> : <TrendingDown className="w-4 h-4 mr-1"/>}
              <span>vs. mes anterior</span>
            </div>
          }
        />
        <KpiCard title="Cotización Prom. Dólar Oficial" value={kpis.avgCotizacionOficial} format="currency" />
        <KpiCard title="Stock Promedio Mensual ($)" value={kpis.avgMonthlyStock} format="currency" />
      </div>

      {/* --- NEW Financial & Operational KPIs --- */}
      <div className="bg-white p-4 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Análisis Financiero y Operativo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard 
                title="Rotación de Stock (veces)" 
                value={kpis.stockTurnover} 
                format="number" 
                details={
                  <>
                    <p className="text-center mb-1 text-xs">Ventas Netas Anualizadas / Stock Promedio.</p>
                    <InterpretationMessage status={stockTurnoverInterp.status} text={stockTurnoverInterp.text} />
                  </>
                }
              />
              <KpiCard 
                title="Días de Cobertura" 
                value={kpis.daysOfCoverage} 
                format="number" 
                details={<><p className="text-center mb-1 text-xs">Días de venta que cubre el stock actual.</p><InterpretationMessage status={daysCoverageInterp.status} text={daysCoverageInterp.text} /></>} 
              />
              <KpiCard 
                title="Ratio Stock / Compras" 
                value={kpis.stockToPurchaseRatio} 
                format="number" 
                details={<><p className="text-center mb-1 text-xs">Stock Actual / Compras del Mes.</p><InterpretationMessage status={stockRatioInterp.status} text={stockRatioInterp.text} /></>}
              />
              <GaugeKpiCard 
                  title="Cobertura Financiera"
                  value={kpis.financialCoverage}
                  unit="meses"
                  description="Meses de gastos cubiertos"
                  interpretation={<InterpretationMessage status={financialCoverageInterp.status} text={financialCoverageInterp.text} />}
              />
          </div>
      </div>

       {/* Turnover by Sucursal Chart */}
      <ChartCard title="🔄 Rotación de Stock por Sucursal" className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockTurnoverBySucursal} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={['auto', dataMax => Math.max(dataMax, totalStockTurnover) * 1.1]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="value" name="Rotación (veces)" fill="#6d28d9" radius={[4, 4, 0, 0]} />
                  <ReferenceLine y={totalStockTurnover} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={2}>
                     <Label value={`Promedio Empresa: ${totalStockTurnover.toFixed(2)}`} position="insideTopRight" fill="#f59e0b" fontSize={12} fontWeight="bold" />
                  </ReferenceLine>
              </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-center text-gray-500 pt-2">Nota: Se excluyen ECOMMERCE y CENTRO LOGISTICO. La rotación por rubro no puede ser calculada ya que los archivos de ventas no contienen esta información.</p>
      </ChartCard>


      {/* Main Evolution Chart */}
      <ChartCard 
        title="📈 Evolución Mensual del Stock (USD Oficial)"
        className="h-[350px]"
      >
        {isSingleStockDataPoint ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stockEvolution} margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={timeAxisTickFormatter} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => formatCurrency(v as number, 'USD')} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Stock Valorizado (USD)" name="Stock (USD)" radius={[4, 4, 0, 0]} fill="#0284c7" barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stockEvolution} margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
              <defs>
                <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={timeAxisTickFormatter} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => formatCurrency(v as number, 'USD')} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Stock Valorizado (USD)" name="Stock (USD)" stroke="#0284c7" fill="url(#stockGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
      
      {/* Dollar Chart */}
      <ChartCard title="💵 Tendencia de Cotizaciones del Dólar" className="h-[350px]">
        {isSingleDollarDataPoint ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dollarEvolution} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={timeAxisTickFormatter} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => formatCurrency(v as number)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="Dólar Oficial" name="Dólar Oficial" fill={DOLLAR_COLORS['Dólar Oficial']} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Dólar Sistema" name="Dólar Sistema" fill={DOLLAR_COLORS['Dólar Sistema']} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dollarEvolution} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={timeAxisTickFormatter} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => formatCurrency(v as number)} domain={['dataMin - 10', 'dataMax + 10']} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="Dólar Sistema" stroke={DOLLAR_COLORS['Dólar Sistema']} strokeWidth={2} />
              <Line type="monotone" dataKey="Dólar Oficial" stroke={DOLLAR_COLORS['Dólar Oficial']} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Distribution Pie Chart */}
      <ChartCard title="📦 Distribución del Stock por Rubro" className="h-[550px]">
        <div className="flex flex-col h-full cursor-pointer relative">
            <div className="flex-grow w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <Pie 
                      data={pieChartData} 
                      dataKey="value" 
                      nameKey="name" 
                      cx="50%" 
                      cy="50%" 
                      innerRadius="55%" 
                      outerRadius="95%" 
                      paddingAngle={2} 
                      labelLine={false} 
                      label={renderCustomizedLabel}
                      activeIndex={activeIndex}
                      activeShape={renderActiveShape}
                      onClick={onPieClick}
                    >
                      {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
            </div>
            <CustomLegend payload={legendPayload} />
        </div>
      </ChartCard>
      
      {/* Rubro Valorization */}
      <ChartCard title="🏆 Valorización de Stock por Rubro (USD)" className="h-[600px]">
          <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rubroRankingUSD} layout="vertical" margin={{ left: 80, right: 30, top: 5, bottom: 5}}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => `${formatNumber(v as number, true)}`} tick={{fontSize: 10}} />
                  <YAxis dataKey="name" type="category" width={200} tick={{fontSize: 11, width: 190 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="totalSales" name="Stock (USD)" barSize={30}>
                     {rubroRankingUSD.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                     ))}
                  </Bar>
              </BarChart>
          </ResponsiveContainer>
      </ChartCard>

      {/* Sucursal Distribution */}
      <ChartCard title="🏪 Distribución del Stock por Sucursal (USD)" className="h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stockBySucursalUSD} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={70} interval={0} />
            <YAxis tickFormatter={(v) => `${formatNumber(v as number, true)}`} tick={{ fontSize: 10 }}/>
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Stock (USD)" radius={[4, 4, 0, 0]}>
               {stockBySucursalUSD.map((entry, index) => <Cell key={`cell-${index}`} fill={ELEGANT_COLORS[index % ELEGANT_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
});

export default React.memo(StockDashboard);