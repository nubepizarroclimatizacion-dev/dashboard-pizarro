// components/GoalComplianceDashboard.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { SalesGoal } from '../types';
import { Award, ChevronDown, Check, X, AlertTriangle, TrendingUp, TrendingDown, ArrowRight, ListFilter, Calendar as CalendarIcon } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

// --- Helper Functions & Interfaces ---

// FIX: Define and export BranchComplianceData to resolve an import error in ComplianceCard.tsx.
// This type seems to be for an aggregated, multi-period view which is not currently implemented
// in this dashboard, but the ComplianceCard component requires it.
export interface BranchComplianceData {
  branchName: string;
  avgCompliance: number;
  pctMonthsMet: number;
  trend: 'up' | 'down' | 'stable';
  status: 'green' | 'yellow' | 'red';
  monthsMet: number;
  totalMonths: number;
}

interface MonthlyComplianceData {
  branchName: string;
  compliance: number;
  status: 'green' | 'yellow' | 'red';
  actual: number;
  goal: number;
}

interface DetailRowData extends SalesGoal {
    compliance: number;
    status: 'green' | 'yellow' | 'red';
}

interface GoalComplianceDashboardProps {
    goals: SalesGoal[];
    filters: {
        branches: string[];
        years: string[];
        months: number[];
        startDate: Date | null;
        endDate: Date | null;
    };
}

const getStatus = (compliance: number): 'green' | 'yellow' | 'red' => {
  if (compliance >= 100) return 'green';
  if (compliance >= 90) return 'yellow';
  return 'red';
};

const statusConfig = {
  green: { color: '#22c55e', text: 'text-green-600', bg: 'bg-green-500', label: 'Cumple el objetivo', icon: <Check className="w-4 h-4 mr-1.5"/> },
  yellow: { color: '#f59e0b', text: 'text-yellow-600', bg: 'bg-yellow-500', label: 'Cerca del objetivo', icon: <AlertTriangle className="w-4 h-4 mr-1.5"/> },
  red: { color: '#ef4444', text: 'text-red-600', bg: 'bg-red-500', label: 'No cumple', icon: <X className="w-4 h-4 mr-1.5"/> },
};

// --- Sub-components ---

// NEW: Redesigned SummaryCard with trend indicator
const SummaryCard = ({ title, icon, performanceData, previousCompliance }: {
    title: string;
    icon: React.ReactNode;
    performanceData: { compliance: number; totalActual: number; totalGoal: number; difference: number; } | null;
    previousCompliance?: number | null;
}) => {
    if (!performanceData) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col justify-center items-center text-center border h-full min-h-[260px]">
                <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-3">{icon} {title}</h3>
                <p className="text-gray-500">No hay datos de objetivos para la selección actual.</p>
            </div>
        );
    }

    const { compliance, totalActual, totalGoal, difference } = performanceData;
    const status = getStatus(compliance);
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (Math.min(compliance, 100) / 100) * circumference;

    let trend: number | null = null;
    if (previousCompliance !== null && previousCompliance !== undefined) {
        if (previousCompliance > 0) {
            trend = ((compliance - previousCompliance) / previousCompliance) * 100;
        } else if (compliance > 0) {
            trend = 100;
        } else {
            trend = 0;
        }
    }

    const TrendIndicator = ({ value }: { value: number | null }) => {
        if (value === null || !isFinite(value)) return <div className="h-5"></div>;
        const isPositive = value >= 0;
        const colorClass = isPositive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
        const Icon = isPositive ? TrendingUp : TrendingDown;
        return (
            <span className={`text-xs font-bold px-2 py-1 rounded-full inline-flex items-center ${colorClass}`}>
                <Icon className="w-3 h-3 mr-1" /> {isPositive && '+'}{value.toFixed(1)}%
            </span>
        );
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-3">
                        {icon}
                        <span>{title}</span>
                    </h3>
                    {trend !== null && <TrendIndicator value={trend} />}
                </div>

                <div className="flex items-center gap-6">
                    <div className="relative w-32 h-32 flex-shrink-0">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                            <circle
                                cx="50" cy="50" r="45" fill="none"
                                stroke={statusConfig[status].color}
                                strokeWidth="10"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                transform="rotate(-90 50 50)"
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-4xl font-bold ${statusConfig[status].text}`}>{compliance.toFixed(0)}<span className="text-2xl">%</span></span>
                        </div>
                    </div>

                    <div className="flex-grow space-y-2.5">
                        <div className="flex justify-between items-baseline">
                            <span className="text-sm text-gray-500">Real:</span>
                            <span className="text-base font-semibold text-gray-800">{formatCurrency(totalActual)}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                            <span className="text-sm text-gray-500">Objetivo:</span>
                            <span className="text-base font-semibold text-gray-800">{formatCurrency(totalGoal)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`mt-4 p-3 rounded-lg flex justify-between items-center ${difference >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <span className="text-sm font-medium text-gray-700">Diferencia</span>
                <span className={`text-lg font-bold ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
                </span>
            </div>
        </div>
    );
};


const GaugeCard: React.FC<{ data: MonthlyComplianceData; rank: number }> = ({ data, rank }) => {
    const { branchName, compliance, status } = data;
    const { color } = statusConfig[status];
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (Math.min(compliance, 150) / 100) * circumference; // Cap at 150% for visual
    const rankColors = ['text-yellow-400', 'text-gray-400', 'text-orange-500'];

    return (
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200 hover:shadow-xl hover:scale-105 transition-all duration-300 flex flex-col items-center text-center">
            <div className="relative w-40 h-40">
                <svg className="w-full h-full" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                    <circle
                        cx="60" cy="60" r="54" fill="none"
                        stroke={color}
                        strokeWidth="10"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        transform="rotate(-90 60 60)"
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {rank <= 3 && <Award className={`w-6 h-6 ${rankColors[rank-1]}`} />}
                    <span className={`text-4xl font-bold ${statusConfig[status].text}`}>{compliance.toFixed(0)}%</span>
                </div>
            </div>
            <p className="mt-3 font-bold text-pizarro-blue-800 text-md truncate w-full" title={branchName}>{branchName.replace('SUCURSAL', '').trim()}</p>
        </div>
    );
};

const DetailRow: React.FC<{ data: DetailRowData, monthName: string }> = ({ data, monthName }) => {
    const { status, compliance } = data;
    const { color, label, icon } = statusConfig[status];
    const progress = Math.min(compliance, 100);
    const shortfall = Math.max(0, data.goalAmount - data.actualAmount);

    return (
        <tr className="border-b border-gray-200 last:border-0 hover:bg-gray-50 text-sm">
            <td className="px-4 py-3 font-medium text-gray-800">🏢 {data.branch.replace('SUCURSAL', '').trim()}</td>
            <td className="px-4 py-3 text-gray-600">📅 {monthName}</td>
            <td className="px-4 py-3 text-gray-600 tabular-nums">{formatCurrency(data.actualAmount)}</td>
            <td className="px-4 py-3 text-gray-600 tabular-nums">{formatCurrency(data.goalAmount)}</td>
            <td className="px-4 py-3 tabular-nums font-medium">
                {shortfall > 0 ? (
                    <span className="text-red-600">{formatCurrency(shortfall)}</span>
                ) : (
                    <span className="text-green-600 flex items-center">
                        <Check className="w-4 h-4 mr-1"/>
                        Logrado
                    </span>
                )}
            </td>
            <td className="px-4 py-3">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="h-2.5 rounded-full" style={{ width: `${progress}%`, backgroundColor: color, transition: 'width 0.5s ease-out' }}></div>
                </div>
            </td>
            <td className={`px-4 py-3 font-medium ${statusConfig[status].text}`}>
                <div className="flex items-center">{icon} {label}</div>
            </td>
        </tr>
    );
};

// --- Main Component ---

const GoalComplianceDashboard = React.forwardRef<HTMLDivElement, GoalComplianceDashboardProps>(({ goals, filters }, ref) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [showAllGauges, setShowAllGauges] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'green' | 'yellow' | 'red'>('all');
  const [showAllInTable, setShowAllInTable] = useState(false);
  
  const filteredGoals = useMemo(() => {
    return goals.filter(g => {
        if (filters.branches.length > 0 && !filters.branches.includes(g.branch)) return false;
        if (filters.years.length > 0 && !filters.years.map(y => parseInt(y)).includes(g.year)) return false;
        if (filters.months.length > 0 && !filters.months.includes(g.month)) return false;
        
        // Date range filters (startDate, endDate) are intentionally ignored for this dashboard.
        return true;
    });
  }, [goals, filters]);

  const overallPerformance = useMemo(() => {
    if (filteredGoals.length === 0) return null;

    const totalActual = filteredGoals.reduce((sum, g) => sum + g.actualAmount, 0);
    const totalGoal = filteredGoals.reduce((sum, g) => sum + g.goalAmount, 0);
    const compliance = totalGoal > 0 ? (totalActual / totalGoal) * 100 : 0;
    const difference = totalActual - totalGoal;

    return { totalActual, totalGoal, compliance, difference };
  }, [filteredGoals]);

  const { availablePeriods, monthsMap, latestPeriod } = useMemo(() => {
    const allPeriods = new Set<string>();
    const periodsWithData = new Set<string>();
    const monthsMap = new Map<number, string>();
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    filteredGoals.forEach(g => {
        const period = `${g.year}-${String(g.month).padStart(2, '0')}`;
        allPeriods.add(period);
        
        if (g.actualAmount > 0) {
            periodsWithData.add(period);
        }

        if(!monthsMap.has(g.month)) {
            monthsMap.set(g.month, monthNames[g.month - 1]);
        }
    });
    
    const sortedAvailablePeriods = Array.from(allPeriods).sort().reverse();
    const sortedPeriodsWithData = Array.from(periodsWithData).sort().reverse();

    return { 
        availablePeriods: sortedAvailablePeriods, 
        monthsMap, 
        latestPeriod: sortedPeriodsWithData[0] || sortedAvailablePeriods[0] || null 
    };
  }, [filteredGoals]);

  useEffect(() => {
    if (latestPeriod && (!selectedPeriod || !availablePeriods.includes(selectedPeriod))) {
      setSelectedPeriod(latestPeriod);
    } else if (!latestPeriod) {
      setSelectedPeriod(null);
    }
  }, [latestPeriod, selectedPeriod, availablePeriods]);

  const periodGoals = useMemo(() => {
    if (!selectedPeriod) return [];
    const [year, month] = selectedPeriod.split('-').map(Number);
    return filteredGoals.filter(g => g.year === year && g.month === month);
  }, [filteredGoals, selectedPeriod]);

  const periodPerformance = useMemo(() => {
    if (periodGoals.length === 0) return null;

    const totalActual = periodGoals.reduce((sum, g) => sum + g.actualAmount, 0);
    const totalGoal = periodGoals.reduce((sum, g) => sum + g.goalAmount, 0);
    const compliance = totalGoal > 0 ? (totalActual / totalGoal) * 100 : 0;
    const difference = totalActual - totalGoal;

    return { totalActual, totalGoal, compliance, difference };
  }, [periodGoals]);

  // NEW: Calculate previous period performance for trend analysis
  const previousPeriodPerformance = useMemo(() => {
    if (!selectedPeriod) return null;
    const [year, month] = selectedPeriod.split('-').map(Number);
    
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth === 0) {
        prevMonth = 12;
        prevYear -= 1;
    }

    const previousPeriodGoals = filteredGoals.filter(g => g.year === prevYear && g.month === prevMonth);
    
    if (previousPeriodGoals.length === 0) return null;

    const totalActual = previousPeriodGoals.reduce((sum, g) => sum + g.actualAmount, 0);
    const totalGoal = previousPeriodGoals.reduce((sum, g) => sum + g.goalAmount, 0);
    const compliance = totalGoal > 0 ? (totalActual / totalGoal) * 100 : 0;
    
    return { compliance };
  }, [filteredGoals, selectedPeriod]);

  const gaugeData = useMemo<MonthlyComplianceData[]>(() => {
    return periodGoals
      .map(g => {
        const compliance = g.goalAmount > 0 ? (g.actualAmount / g.goalAmount) * 100 : 0;
        return {
          branchName: g.branch,
          compliance,
          status: getStatus(compliance),
          actual: g.actualAmount,
          goal: g.goalAmount,
        };
      })
      .sort((a, b) => b.compliance - a.compliance);
  }, [periodGoals]);

  const detailData = useMemo<DetailRowData[]>(() => {
    return periodGoals
      .filter(g => g.actualAmount > 0)
      .map(g => {
        const compliance = g.goalAmount > 0 ? (g.actualAmount / g.goalAmount) * 100 : 0;
        return { ...g, compliance, status: getStatus(compliance) };
      })
      .filter(g => statusFilter === 'all' || g.status === statusFilter)
      .sort((a, b) => b.compliance - a.compliance);
  }, [periodGoals, statusFilter]);

  const executiveSummary = useMemo(() => {
      if(gaugeData.length === 0) return null;
      const topPerformer = gaugeData[0];
      const lowPerformers = gaugeData.filter(b => b.status === 'red');
      
      let summary = `🔥 La sucursal **${topPerformer.branchName.replace('SUCURSAL ','')}** lidera el cumplimiento este mes con un **${topPerformer.compliance.toFixed(1)}%**.`;
      if(lowPerformers.length > 0) {
          summary += ` ⚠️ **${lowPerformers[0].branchName.replace('SUCURSAL ','')}**${lowPerformers.length > 1 ? ` y otras ${lowPerformers.length - 1}` : ''} sucursal${lowPerformers.length > 1 ? 'es' : ''} present${lowPerformers.length > 1 ? 'an' : 'a'} un rendimiento bajo y requiere${lowPerformers.length > 1 ? 'n' : ''} atención.`
      }
      return summary;
  }, [gaugeData]);

  if (goals.length === 0) {
    return <div ref={ref} className="text-center py-12 bg-white rounded-lg shadow-md"><p className="text-gray-500">No se han definido objetivos.</p></div>;
  }
  if (filteredGoals.length === 0) {
      return <div ref={ref} className="text-center py-12 bg-white rounded-lg shadow-md"><p className="text-gray-500">No hay datos de objetivos para los filtros seleccionados.</p></div>;
  }
  if (!selectedPeriod) {
    return <div ref={ref} className="text-center py-12 bg-white rounded-lg shadow-md"><p className="text-gray-500">Cargando datos de objetivos...</p></div>;
  }

  const visibleGauges = showAllGauges ? gaugeData : gaugeData.slice(0, 5);
  const visibleDetails = showAllInTable ? detailData : detailData.slice(0, 8);

  return (
    <div className="space-y-8 font-sans" ref={ref}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SummaryCard
                title="Cumplimiento General (Filtros)"
                icon={<ListFilter className="w-6 h-6 text-pizarro-blue-600"/>}
                performanceData={overallPerformance}
            />
            <SummaryCard
                title={`Cumplimiento Período (${selectedPeriod.replace('-', ' / ')})`}
                icon={<CalendarIcon className="w-6 h-6 text-pizarro-blue-600"/>}
                performanceData={periodPerformance}
                previousCompliance={previousPeriodPerformance?.compliance}
            />
        </div>

      {/* Section 1: Gauges */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-xl font-bold text-gray-800">📊 Cumplimiento de Objetivos por Sucursal</h2>
            <div className="flex items-center gap-2">
                <select 
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="h-9 text-sm border-gray-300 rounded-md shadow-sm focus:ring-pizarro-blue-500 focus:border-pizarro-blue-500"
                >
                    {availablePeriods.map(p => <option key={p} value={p}>{p.replace('-', ' / ')}</option>)}
                </select>
                {gaugeData.length > 5 && (
                    <button onClick={() => setShowAllGauges(!showAllGauges)} className="text-sm font-medium text-pizarro-blue-600 hover:text-pizarro-blue-800 h-9 px-3 bg-pizarro-blue-50 rounded-md">
                        {showAllGauges ? 'Ver Top 5' : `Ver todas (${gaugeData.length})`}
                    </button>
                )}
            </div>
        </div>
        {visibleGauges.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {visibleGauges.map((data, index) => (
                    <GaugeCard key={data.branchName} data={data} rank={index + 1} />
                ))}
            </div>
        ) : (
            <p className="text-center text-gray-500 py-8">No hay datos de cumplimiento para el período seleccionado.</p>
        )}
      </div>

      {/* Section 2: Details Table */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
                 <h2 className="text-xl font-bold text-gray-800">📋 Desglose de Cumplimiento</h2>
                 <p className="text-sm text-gray-500 mt-1">Detalle mensual por sucursal con comparación contra metas.</p>
            </div>
            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
                {(Object.keys(statusConfig) as ('green' | 'yellow' | 'red')[]).map(key => (
                     <button key={key} onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${statusFilter === key ? `bg-white text-pizarro-blue-700 shadow` : 'text-gray-600 hover:bg-gray-200'}`}>
                         {statusConfig[key].label.split(' ')[0]}
                     </button>
                ))}
            </div>
        </div>
         <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                        <th className="px-4 py-3 text-left">🏢 Sucursal</th>
                        <th className="px-4 py-3 text-left">📅 Mes</th>
                        <th className="px-4 py-3 text-left">💰 Ventas</th>
                        <th className="px-4 py-3 text-left">🎯 Objetivo</th>
                        <th className="px-4 py-3 text-left">📉 Falto</th>
                        <th className="px-4 py-3 text-left w-32">📈 % Cumplimiento</th>
                        <th className="px-4 py-3 text-left">Estado</th>
                    </tr>
                </thead>
                <tbody>
                    {visibleDetails.map(d => <DetailRow key={d.id} data={d} monthName={monthsMap.get(d.month) || ''}/>)}
                </tbody>
            </table>
         </div>
         {detailData.length === 0 && <p className="text-center text-gray-500 py-8">No hay registros para mostrar con los filtros actuales.</p>}
         {detailData.length > 8 && (
             <div className="text-center mt-6">
                 <button onClick={() => setShowAllInTable(!showAllInTable)} className="text-sm font-medium text-pizarro-blue-600 hover:text-pizarro-blue-800">
                    {showAllInTable ? 'Mostrar menos' : `Ver más (${detailData.length - 8} restantes)`}
                 </button>
             </div>
         )}
         {executiveSummary && (
             <div className="mt-6 pt-4 border-t border-gray-200 text-center text-sm text-gray-600">
                <p dangerouslySetInnerHTML={{ __html: executiveSummary.replace(/\*\*(.*?)\*\*/g, '<strong class="text-pizarro-blue-700">$1</strong>') }} />
             </div>
         )}
      </div>
    </div>
  );
});

export default GoalComplianceDashboard;