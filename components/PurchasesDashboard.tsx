// components/PurchasesDashboard.tsx

import React, { useState, useMemo, useCallback } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid, LineChart, Line, BarChart, Bar, Sector } from 'recharts';
import { PurchasesAnalysisResults, ProviderDetailItem, ProviderRankingItem } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';
import KpiCard from './KpiCard';
import ChartCard from './ChartCard';
import { Search } from 'lucide-react';

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    let displayLabel = payload[0].payload.name || label;
    if (/\d{4}-\d{2}/.test(label)) {
      const [year, month] = label.split('-');
      const date = new Date(Date.UTC(Number(year), Number(month) - 1, 15));
      displayLabel = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    }

    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-xl text-sm transition-opacity duration-200">
        <p className="font-bold text-gray-800 mb-2">{displayLabel}</p>
        <div className="space-y-1">
            {payload.map((pld: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: pld.stroke || pld.fill }}></span>
                      <span className="text-gray-600">{pld.name}:</span>
                  </div>
                  <span className="font-semibold text-gray-800 ml-4">{formatCurrency(pld.value as number)}</span>
              </div>
            ))}
            {payload[0].payload.purchaseCount && (
                <div className="flex items-center justify-between pt-1 mt-1 border-t border-gray-100">
                     <div className="flex items-center">
                         <span className="w-2.5 h-2.5 rounded-full mr-2 bg-gray-400"></span>
                         <span className="text-gray-600">N° Compras:</span>
                     </div>
                    <span className="font-semibold text-gray-800 ml-4">{formatNumber(payload[0].payload.purchaseCount)}</span>
                </div>
            )}
        </div>
      </div>
    );
  }
  return null;
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


const ProviderDetailsTable = ({ data }: { data: ProviderDetailItem[] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        return data.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [data, searchTerm]);

    return (
        <ChartCard title="📑 Detalle por Proveedor" className="lg:col-span-3 h-[500px]">
            <div className="flex flex-col h-full">
                <div className="relative flex-grow-0 mb-4 p-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Buscar proveedor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-1/2 pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-pizarro-blue-300 focus:outline-none" />
                </div>
                <div className="flex-grow overflow-y-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-100 sticky top-0">
                            <tr>
                                <th className="px-4 py-2">Proveedor</th>
                                <th className="px-4 py-2 text-right">Sin Impuestos</th>
                                <th className="px-4 py-2 text-right">IVA</th>
                                <th className="px-4 py-2 text-right">Otros Tributos</th>
                                <th className="px-4 py-2 text-right">Total Con Impuestos</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredData.map((item) => (
                                <tr key={item.name} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 font-medium text-gray-900">{item.name}</td>
                                    <td className="px-4 py-2 text-right text-gray-600 tabular-nums">{formatCurrency(item.subtotal)}</td>
                                    <td className="px-4 py-2 text-right text-gray-600 tabular-nums">{formatCurrency(item.vat)}</td>
                                    <td className="px-4 py-2 text-right text-gray-600 tabular-nums">{formatCurrency(item.otherTaxes)}</td>
                                    <td className="px-4 py-2 text-right font-bold text-pizarro-blue-800 tabular-nums">{formatCurrency(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </ChartCard>
    );
};

const PurchasesDashboard = React.forwardRef<HTMLDivElement, { results: PurchasesAnalysisResults }>(({ results }, ref) => {
  const { kpis, purchasesOverTime, providerRanking, purchasesByType, vatOverTime, providerDetails, salesVsPurchasesTrend } = results;
  const MODALITY_COLORS = { 'Blanco': '#0284c7', 'Negro': '#475569' };
  const RANKING_COLORS = ['#0c4a6e', '#075985', '#0369a1', '#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe', '#f0f9ff'];

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const onPieClick = useCallback((_: any, index: number) => {
    setActiveIndex(prevIndex => (prevIndex === index ? null : index));
  }, []);

  const modalityLegendPayload = useMemo(() => {
    return purchasesByType.map((entry) => ({
      value: entry.name,
      color: MODALITY_COLORS[entry.name as 'Blanco' | 'Negro'] || '#cccccc',
    }));
  }, [purchasesByType]);

  const timeAxisTickFormatter = (tick: string): string => {
    const date = new Date(`${tick}-15T00:00:00Z`);
    return date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit', timeZone: 'UTC' });
  };
  
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    // Only render label if the slice is larger than 2% to avoid clutter
    if (percent < 0.05) return null;
    return (
      <text
        x={x}
        y={y}
        fill="#FFFFFF"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-sm font-bold pointer-events-none"
        stroke="#000000"
        strokeWidth={0.5}
        paintOrder="stroke"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-6" ref={ref}>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Compras" value={kpis.totalPurchases} format="currency" change={kpis.totalPurchasesChange} positiveChangeIsBad />
        <KpiCard title="Promedio por Proveedor" value={kpis.averagePurchasePerProvider} format="currency" />
        <KpiCard title="Mes con Mayor Compra" value={kpis.topMonth.total} format="currency" details={<span className="font-bold text-pizarro-blue-700">{kpis.topMonth.name}</span>} />
        <KpiCard title="Proveedor Principal" value={kpis.topProvider.total} format="currency" details={<span className="font-bold text-pizarro-blue-700">{kpis.topProvider.name}</span>} />
      </div>
      
      {/* Main Charts: Evolution & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title="📊 Evolución de Compras Mensuales" className="lg:col-span-2 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={purchasesOverTime} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={timeAxisTickFormatter} tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => formatNumber(v as number, true)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="Blanco" stackId="1" stroke={MODALITY_COLORS.Blanco} fill={MODALITY_COLORS.Blanco} fillOpacity={0.7} />
                <Area type="monotone" dataKey="Negro" stackId="1" stroke={MODALITY_COLORS.Negro} fill={MODALITY_COLORS.Negro} fillOpacity={0.7} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
          
          <ChartCard title="💡 Distribución por Modalidad" className="h-[400px]">
            <div className="flex flex-col h-full cursor-pointer relative">
                <div className="flex-grow w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                            <Pie 
                                data={purchasesByType} 
                                dataKey="value" 
                                nameKey="name" 
                                cx="50%" 
                                cy="50%" 
                                innerRadius="55%" 
                                outerRadius="95%" 
                                paddingAngle={3} 
                                cornerRadius={5}
                                label={renderCustomizedLabel} 
                                labelLine={false}
                                activeIndex={activeIndex}
                                activeShape={renderActiveShape}
                                onClick={onPieClick}
                            >
                                {purchasesByType.map((entry) => <Cell key={`cell-${entry.name}`} fill={MODALITY_COLORS[entry.name as 'Blanco' | 'Negro']} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <CustomLegend payload={modalityLegendPayload} />
            </div>
          </ChartCard>
      </div>

      {/* Financial Correlation Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {salesVsPurchasesTrend && salesVsPurchasesTrend.length > 0 && (
              <ChartCard title="⚖️ Comparativa: Ventas vs. Compras" className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesVsPurchasesTrend} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tickFormatter={timeAxisTickFormatter} tick={{ fontSize: 11 }}/>
                          <YAxis tickFormatter={(v) => formatNumber(v as number, true)} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Line type="monotone" dataKey="Ventas" stroke="#0284c7" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="Compras" stroke="#db2777" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
                      </LineChart>
                  </ResponsiveContainer>
              </ChartCard>
          )}

          <ChartCard title="📈 Tendencia de IVA Comprado" className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={vatOverTime} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={timeAxisTickFormatter} tick={{ fontSize: 11 }}/>
                      <YAxis tickFormatter={(v) => formatNumber(v as number, true)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="Ventas" name="IVA" stroke="#14b8a6" strokeWidth={2} />
                  </LineChart>
              </ResponsiveContainer>
          </ChartCard>
      </div>
      
       {/* Provider Details and Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <ProviderDetailsTable data={providerDetails} />
        <ChartCard title="🏢 Ranking de Proveedores (Top 10)" className="lg:col-span-2 h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={providerRanking.slice(0,10)} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="2 2" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => formatNumber(v as number, true)} tick={{ fontSize: 10 }} />
                    <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        tick={{ fontSize: 11, fill: '#374151', width: 95 }}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        reversed={true}
                     />
                    <Tooltip cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }} content={<CustomTooltip />} />
                    <Bar dataKey="totalPurchases" name="Compras" radius={[0, 4, 4, 0]}>
                        {providerRanking.slice(0,10).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={RANKING_COLORS[index % RANKING_COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
});

export default React.memo(PurchasesDashboard);