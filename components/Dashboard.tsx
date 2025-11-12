// components/Dashboard.tsx

import React, { useMemo, useState, useCallback } from 'react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  AreaChart, Area, CartesianGrid, XAxis, YAxis, BarChart, Bar, LineChart, Line, Sector,
} from 'recharts';
import { AnalysisResults, ColorMap, AverageSaleBySalespersonData } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';
import KpiCard from './KpiCard';
import ChartCard from './ChartCard';
import RankingTable from './RankingTable';
import { Search, ChevronDown, UserPlus, Repeat, TrendingUp, TrendingDown } from 'lucide-react';

// Helper function to interpolate between two colors
const interpolateColor = (color1: string, color2: string, factor: number): string => {
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };
    const rgbToHex = (r: number, g: number, b: number) => '#' + [r, g, b].map(x => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');

    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);

    if (!c1 || !c2) return color1; // fallback

    const r = c1.r + factor * (c2.r - c1.r);
    const g = c1.g + factor * (c2.g - c1.g);
    const b = c1.b + factor * (c2.b - c1.b);

    return rgbToHex(r, g, b);
};


// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  // Pie/Donut Chart for Customer Acquisition
  if (payload[0].name === 'Nuevos' || payload[0].name === 'Recurrentes') {
      const { name, value, payload: piePayload } = payload[0];
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow-lg text-sm">
          <p className="font-bold mb-1" style={{ color: piePayload.fill }}>{name}</p>
          <p className="text-gray-700">{`Clientes: ${formatNumber(value)}`}</p>
          <p className="text-gray-700">{`Porcentaje: ${piePayload.percentage.toFixed(2)}%`}</p>
        </div>
      );
  }

  // Generic Pie/Donut Chart (Branches, Type)
  if (payload[0].payload && payload[0].payload.name && payload[0].dataKey === 'value') {
      const data = payload[0];
      return (
          <div className="bg-white p-2 border border-gray-300 rounded shadow-lg text-sm">
            <p className="font-bold mb-1">{data.name}</p>
            <p className="text-gray-700">{`Ventas: ${formatCurrency(data.value)}`}</p>
          </div>
      );
  }
  
  // Bar Chart for Customer Trend
  if (payload[0].dataKey === 'new' || payload[0].dataKey === 'recurring') {
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow-lg text-sm">
          <p className="font-bold mb-1">{label}</p>
          {payload.map((pld: any) => (
             <p key={pld.dataKey} style={{ color: pld.fill }}>
                {`${pld.name === 'new' ? 'Nuevos' : 'Recurrentes'}: ${formatNumber(pld.value)}`}
            </p>
          ))}
        </div>
      );
  }

  // --- UNIFIED TOOLTIP FOR LINE/AREA CHARTS ---
  let finalLabel = label;
  if (typeof label === 'string' && /^\d{4}-\d{2}$/.test(label)) { // YYYY-MM format from main evolution chart
      const [year, month] = label.split('-');
      const date = new Date(Date.UTC(Number(year), Number(month) - 1, 15));
      finalLabel = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  } else if (payload[0].payload.day) { // Daily charts
      finalLabel = `Día: ${label}`;
  } else if (payload[0].payload.month) { // Monthly comparison chart
      finalLabel = `Mes: ${label}`;
  }
  
  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-xl text-sm">
        <p className="font-bold text-gray-800 mb-2">{finalLabel}</p>
        <div className="space-y-1">
            {payload.map((pld: any) => (
              <div key={pld.dataKey} className="flex items-center justify-between">
                  <div className="flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: pld.color || pld.stroke || '#8884d8' }}></span>
                      <span className="text-gray-600">{pld.name || pld.dataKey}:</span>
                  </div>
                  <span className="font-semibold text-gray-800 ml-4">{formatCurrency(pld.value)}</span>
              </div>
            ))}
        </div>
    </div>
  );
};

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
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="#fff"
        strokeWidth={2}
      />
    </g>
  );
};

const SalespersonPerformanceTable = ({ data, averageSaleKpi }: { data: AverageSaleBySalespersonData[], averageSaleKpi: number }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        return data.filter(item => 
            (item.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [data, searchTerm]);

    return (
        <ChartCard title="💼 Venta Promedio por Vendedor" className="lg:col-span-3 h-[450px]">
            <div className="flex flex-col h-full">
                <div className="relative flex-grow-0 mb-4 p-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar vendedor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-1/2 pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-pizarro-blue-300 focus:outline-none"
                    />
                </div>
                 <div className="mb-4 text-center bg-pizarro-blue-50 p-2 rounded-md">
                    <span className="text-sm text-gray-600">Promedio general por venta: </span>
                    <span className="font-bold text-pizarro-blue-700">{formatCurrency(averageSaleKpi)}</span>
                </div>
                <div className="flex-grow overflow-y-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-100 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 w-8">#</th>
                                <th className="px-4 py-2">Vendedor</th>
                                <th className="px-4 py-2 text-right">Total Vendido</th>
                                <th className="px-4 py-2 text-right">Facturas</th>
                                <th className="px-4 py-2 text-right">Promedio Venta</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredData.map((item, index) => (
                                <tr key={item.name} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 font-medium text-gray-500">{index + 1}</td>
                                    <td className="px-4 py-2 font-medium text-gray-900">{item.name}</td>
                                    <td className="px-4 py-2 text-right text-gray-600 tabular-nums">{formatCurrency(item.totalSales)}</td>
                                    <td className="px-4 py-2 text-right text-gray-600 tabular-nums">{formatNumber(item.invoiceCount)}</td>
                                    <td className="px-4 py-2 text-right font-bold text-pizarro-blue-800 tabular-nums">{formatCurrency(item.averageSale)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredData.length === 0 && (
                        <div className="text-center py-10 text-gray-500">
                            No se encontraron resultados para la búsqueda.
                        </div>
                    )}
                </div>
            </div>
        </ChartCard>
    )
}

const CustomerAcquisitionCard = ({ customerAcquisition }: { customerAcquisition: AnalysisResults['customerAcquisition'] }) => {
    if (!customerAcquisition) return null;

    const { latestMonthData, previousMonthComparison, lastSixMonthsTrend, totalCustomers, latestMonth } = customerAcquisition;
    const CUSTOMER_ACQUISITION_COLORS = ['#0284c7', '#14b8a6']; // Sky Blue for New, Teal for Recurring

    const ComparisonIndicator = ({ value }: { value: number }) => {
        const isPositive = value >= 0;
        const colorClass = isPositive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
        const Icon = isPositive ? TrendingUp : TrendingDown;
        if(Math.abs(value) === 100 && !isPositive) return null; // Don't show -100% for first time appearance
        
        return (
            <span className={`text-xs font-bold ml-2 px-1.5 py-0.5 rounded-full inline-flex items-center ${colorClass}`}>
                <Icon className="w-3 h-3 mr-0.5" /> {isPositive && '+'}{value.toFixed(0)}%
            </span>
        );
    };

    return (
        <ChartCard title="🧍‍♂️ Clientes Nuevos vs Recurrentes" className="lg:col-span-2 h-auto min-h-[450px]">
            <div className="h-full flex flex-col justify-between">
                <p className="text-sm text-gray-500 text-center mb-2">Análisis para <span className="font-semibold text-pizarro-blue-700">{latestMonth}</span></p>
                <div className="relative w-full h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={[
                                    { name: 'Nuevos', value: latestMonthData.newCustomers.count, percentage: latestMonthData.newCustomers.percentage },
                                    { name: 'Recurrentes', value: latestMonthData.recurringCustomers.count, percentage: latestMonthData.recurringCustomers.percentage },
                                ]}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius="70%"
                                outerRadius="90%"
                                startAngle={90}
                                endAngle={-270}
                                paddingAngle={5}
                                cornerRadius={8}
                            >
                                <Cell key="cell-nuevos" fill={CUSTOMER_ACQUISITION_COLORS[0]} stroke={CUSTOMER_ACQUISITION_COLORS[0]} />
                                <Cell key="cell-recurrentes" fill={CUSTOMER_ACQUISITION_COLORS[1]} stroke={CUSTOMER_ACQUISITION_COLORS[1]}/>
                            </Pie>
                            <Tooltip
                                content={<CustomTooltip />}
                                // Move the tooltip to the right to prevent it from overlapping the central text,
                                // especially when hovering over the top "Recurrentes" segment.
                                wrapperStyle={{ transform: 'translateX(25px)' }}
                                cursor={{ fill: 'transparent' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                        <span className="text-4xl font-bold text-gray-800">{formatNumber(totalCustomers)}</span>
                        <p className="text-sm text-gray-500 -mt-1">Clientes Activos</p>
                    </div>
                </div>
                <div className="my-4 px-2 space-y-3">
                    <div className="flex items-center">
                        <UserPlus className="w-6 h-6 mr-3 text-blue-500"/>
                        <div>
                            <span className="font-semibold text-gray-800">Clientes Nuevos: {latestMonthData.newCustomers.percentage.toFixed(1)}%</span>
                            <ComparisonIndicator value={previousMonthComparison.newCustomersPctChange} />
                        </div>
                    </div>
                    <div className="flex items-center">
                        <Repeat className="w-6 h-6 mr-3 text-green-600"/>
                         <div>
                            <span className="font-semibold text-gray-800">Clientes Recurrentes: {latestMonthData.recurringCustomers.percentage.toFixed(1)}%</span>
                            <ComparisonIndicator value={previousMonthComparison.recurringCustomersPctChange} />
                         </div>
                    </div>
                </div>
                <div className="flex-grow min-h-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={lastSixMonthsTrend} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 10 }} width={30} />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: '#f3f4f6'}} />
                            <Bar dataKey="new" name="new" stackId="a" fill={CUSTOMER_ACQUISITION_COLORS[0]} radius={[4, 4, 0, 0]} barSize={20} />
                            <Bar dataKey="recurring" name="recurring" stackId="a" fill={CUSTOMER_ACQUISITION_COLORS[1]} radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </ChartCard>
    );
};

const Dashboard = React.forwardRef<HTMLDivElement, { results: AnalysisResults; colorMap: ColorMap; goalKpis: any | null; }>(({ results, colorMap, goalKpis }, ref) => {
  const { kpis, salesByBranch, salesByType, salesOverTime, branchRanking, salespersonRanking, clientRanking, yearlySalesTrend, availableYearsForTrend, averageSaleBySalesperson, customerAcquisition } = results;
  const YEAR_TREND_COLORS = ['#0284c7', '#14b8a6', '#f97316', '#6d28d9', '#475569'];

  const [activeBranchIndex, setActiveBranchIndex] = useState<number | null>(null);
  const [activeTypeIndex, setActiveTypeIndex] = useState<number | null>(null);

  const onBranchPieClick = useCallback((_: any, index: number) => {
    setActiveBranchIndex(prevIndex => (prevIndex === index ? null : index));
  }, []);
  
  const onTypePieClick = useCallback((_: any, index: number) => {
    setActiveTypeIndex(prevIndex => (prevIndex === index ? null : index));
  }, []);

  const branchLegendPayload = useMemo(() => {
    return salesByBranch.map((entry) => ({
      value: entry.name,
      color: colorMap[entry.name] || '#cccccc',
    }));
  }, [salesByBranch, colorMap]);

  const typeLegendPayload = useMemo(() => {
    return salesByType.map((entry) => ({
      value: entry.name,
      color: entry.name === 'Blanco' ? '#0284c7' : '#475569',
    }));
  }, [salesByType]);


  const isSingleMonthView = !!results.dailySalesOverTime && results.dailySalesOverTime.length > 0;
  const isDailyTrendView = !!results.dailyYearlySalesTrend && results.dailyYearlySalesTrend.length > 0;

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't render label for very small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-sm font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]"
        pointerEvents="none"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  
  const gradientStops = useMemo(() => {
    const data = isSingleMonthView ? results.dailySalesOverTime! : salesOverTime;
    if (!data || data.length < 2) {
      const fallbackColor = '#0ea5e9'; // sky-500
      return [{ offset: '0%', color: fallbackColor }, { offset: '100%', color: fallbackColor }];
    }
    
    // Cold Season: April (4) to September (9) -> Light Blue to Dark Blue
    const lightBlue = '#7dd3fc'; // sky-300
    const darkBlue = '#0c4a6e'; // sky-900

    // Hot Season: October (10) to March (3) -> Orange to Red
    const orange = '#fde047'; // yellow-300
    const red = '#f97316'; // orange-500

    return data.map((item, index) => {
      const month = parseInt(item.date.substring(5, 7), 10);
      let color = '#4E79A7'; // Default

      // Cold season (months 4-9)
      if (month >= 4 && month <= 9) {
        // Factor from 0 (April) to 1 (September)
        const factor = (month - 4) / (9 - 4);
        color = interpolateColor(lightBlue, darkBlue, factor);
      }
      // Hot season (months 10-12 and 1-3)
      else {
        // Normalize months to a continuous sequence: Oct=10, ..., Mar=15
        const seasonalMonth = month >= 10 ? month : month + 12;
        // Factor from 0 (October) to 1 (March)
        const factor = (seasonalMonth - 10) / (15 - 10);
        color = interpolateColor(orange, red, factor);
      }
      
      const offset = `${(index / (data.length - 1)) * 100}%`;
      return { offset, color };
    });
  }, [salesOverTime, results.dailySalesOverTime, isSingleMonthView]);

  const timeAxisTickFormatter = (tick: string, index: number): string => {
    const [year, month] = tick.split('-');
    // Usar UTC para evitar que los cambios de zona horaria afecten el mes/año
    const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 15));
    const monthIndex = date.getUTCMonth();
    
    const monthNameRaw = date.toLocaleDateString('es-ES', { month: 'short', timeZone: 'UTC' }).replace('.', '');
    const monthName = monthNameRaw.charAt(0).toUpperCase() + monthNameRaw.slice(1);
    
    // Mostrar el año para el primer tick, o para cada enero
    if (index === 0 || monthIndex === 0) {
        const yearName = date.toLocaleDateString('es-ES', { year: '2-digit', timeZone: 'UTC' });
        return `${monthName} '${yearName}`;
    }
    
    return monthName;
  };
  
  const dailyAxisTickFormatter = (tick: string): string => {
    // tick is 'YYYY-MM-DD', we want to show just the day number
    return new Date(`${tick}T00:00:00Z`).getUTCDate().toString();
  };

  return (
    <div className="space-y-6" ref={ref}>
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {goalKpis && (
           <KpiCard
              title="Cumplimiento de Objetivos"
              value={goalKpis.achievement}
              format="percentage"
              progress={goalKpis.achievement}
              subValue={goalKpis.difference}
              subValueColor={goalKpis.difference >= 0 ? 'green' : 'red'}
              details={
                  <div className="space-y-1">
                      <div className="flex justify-between items-center">
                          <span>Real:</span>
                          <span className="font-semibold text-gray-700">{formatCurrency(goalKpis.totalActual)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span>Objetivo:</span>
                          <span className="font-semibold text-gray-700">{formatCurrency(goalKpis.totalGoal)}</span>
                      </div>
                  </div>
              }
            />
        )}
        <KpiCard
          title="Ventas Totales (Neto)"
          value={kpis.totalSales}
          format="currency"
          change={kpis.totalSalesChange}
          details={
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span>Blanco:</span>
                <span className="font-semibold text-gray-700">{formatCurrency(kpis.blancoSales)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Negro:</span>
                <span className="font-semibold text-gray-700">{formatCurrency(kpis.negroSales)}</span>
              </div>
            </div>
          }
        />
        <KpiCard title="Promedio por Factura" value={kpis.averageSale} format="currency" change={kpis.averageSaleChange} />
        <KpiCard title="Facturas Emitidas" value={kpis.invoiceCount} subValue={kpis.invoiceTotal} subValueColor="blue" change={kpis.invoiceCountChange}/>
        <KpiCard
          title="Notas de Crédito"
          value={kpis.creditNoteCount}
          subValue={-kpis.creditNoteTotal}
          subValueColor="red"
          details={
             <p className="text-center">
              {`Representan un ${kpis.creditNotePercentage.toFixed(2)}% de la facturación`}
            </p>
          }
        />
      </div>

      {/* Sales Over Time Chart */}
      <ChartCard 
        title={isSingleMonthView ? "Evolución de Ventas Diarias" : "Evolución de Ventas Mensuales"} 
        className="h-[350px]"
      >
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={isSingleMonthView ? results.dailySalesOverTime : salesOverTime} 
              margin={{ top: 5, right: 20, left: 40, bottom: 50 }}
            >
              <defs>
                <linearGradient id="salesAreaGradient" x1="0" y1="0" x2="1" y2="0">
                  {gradientStops.map((stop, index) => (
                    <stop key={`area-${index}`} offset={stop.offset} stopColor={stop.color} stopOpacity={0.4}/>
                  ))}
                </linearGradient>
                <linearGradient id="salesLineGradient" x1="0" y1="0" x2="1" y2="0">
                  {gradientStops.map((stop, index) => (
                    <stop key={`line-${index}`} offset={stop.offset} stopColor={stop.color} stopOpacity={1}/>
                  ))}
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="date"
                tickFormatter={isSingleMonthView ? dailyAxisTickFormatter : timeAxisTickFormatter}
                angle={isSingleMonthView ? 0 : -40}
                textAnchor={isSingleMonthView ? "middle" : "end"}
                height={isSingleMonthView ? 20 : 60}
                interval="preserveStartEnd"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db' }}
                tickLine={{ stroke: '#d1d5db' }}
              />
              <YAxis 
                tickFormatter={(value) => formatNumber(value as number, true)}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db' }}
                tickLine={{ stroke: '#d1d5db' }}
              />
              <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 1000 }}/>
              <Legend />
              <Area 
                type="monotone" 
                dataKey="Ventas" 
                stroke="url(#salesLineGradient)"
                strokeWidth={3}
                fill="url(#salesAreaGradient)"
                activeDot={{ r: 7, stroke: 'white', strokeWidth: 2 }}
                dot={false}
              />
            </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Yearly Trend Chart */}
      {(yearlySalesTrend.length > 0 || isDailyTrendView) && (
          <ChartCard 
            title={isDailyTrendView ? "Tendencia de Ventas Diarias (Comparativa Anual)" : "Comparativa Anual de Ventas por Mes"} 
            className="h-[350px]"
          >
              <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={isDailyTrendView ? results.dailyYearlySalesTrend : yearlySalesTrend} 
                margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
              >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={isDailyTrendView ? "day" : "month"} />
                  <YAxis tickFormatter={(value) => formatNumber(value as number, true)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {(isDailyTrendView ? results.availableYearsForDailyTrend : availableYearsForTrend)?.map((year, index) => (
                      <Line 
                          key={year}
                          type="monotone" 
                          dataKey={year} 
                          stroke={YEAR_TREND_COLORS[index % YEAR_TREND_COLORS.length]} 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                          activeDot={{ r: 7 }}
                          connectNulls={true}
                      />
                  ))}
              </AreaChart>
              </ResponsiveContainer>
          </ChartCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RankingTable title="Ranking de Sucursales" data={branchRanking} colorMap={colorMap}/>
        <RankingTable title="Ranking de Vendedores" data={salespersonRanking} colorMap={colorMap} searchable={true}/>
        <RankingTable title="Ranking de Clientes" data={clientRanking} colorMap={colorMap} searchable={true}/>
      </div>

      {/* NEW SECTION: Average Sale & Customer Acquisition */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {averageSaleBySalesperson.length > 0 && <SalespersonPerformanceTable data={averageSaleBySalesperson} averageSaleKpi={kpis.averageSale} />}
          {customerAcquisition && <CustomerAcquisitionCard customerAcquisition={customerAcquisition} />}
      </div>

      {/* Pie Charts for participation */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Participación de Ventas por Sucursal" className="h-[550px]">
            <div className="flex flex-col h-full cursor-pointer relative">
              <div className="flex-grow w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                        <Pie
                            data={salesByBranch}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius="55%"
                            outerRadius="95%"
                            paddingAngle={3}
                            cornerRadius={5}
                            labelLine={false}
                            label={renderCustomizedLabel}
                            activeIndex={activeBranchIndex}
                            activeShape={renderActiveShape}
                            onClick={onBranchPieClick}
                        >
                            {salesByBranch.map((entry) => (
                                <Cell key={`cell-${entry.name}`} fill={colorMap[entry.name] || '#cccccc'} stroke={colorMap[entry.name] || '#cccccc'} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
              </div>
              <CustomLegend payload={branchLegendPayload} />
            </div>
          </ChartCard>
          
          <ChartCard title="Distribución de Ventas por Tipo" className="h-[550px]">
            <div className="flex flex-col h-full cursor-pointer relative">
              <div className="flex-grow w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                          <Pie
                              data={salesByType}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={renderCustomizedLabel}
                              innerRadius="55%"
                              outerRadius="95%"
                              paddingAngle={3}
                              cornerRadius={5}
                              dataKey="value"
                              nameKey="name"
                              activeIndex={activeTypeIndex}
                              activeShape={renderActiveShape}
                              onClick={onTypePieClick}
                          >
                              {salesByType.map((entry) => (
                                  <Cell key={`cell-${entry.name}`} fill={entry.name === 'Blanco' ? '#0284c7' : '#475569'} stroke={entry.name === 'Blanco' ? '#0284c7' : '#475569'}/>
                              ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                  </ResponsiveContainer>
                </div>
                <CustomLegend payload={typeLegendPayload} />
            </div>
          </ChartCard>
      </div>
    </div>
  );
});

export default React.memo(Dashboard);