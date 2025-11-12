import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LabelList } from 'recharts';
import { HRAnalysisResults } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';
import ChartCard from './ChartCard';
import { Briefcase, Users, Cake, Calendar, Wallet, BadgeDollarSign, Medal, Plane, Search } from 'lucide-react';
import KpiCard from './KpiCard';


const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  let displayLabel = payload[0].payload.name || payload[0].payload.category || label;
  if (typeof label === 'string' && /\d{4}-\d{2}/.test(label)) {
    const [year, month] = label.split('-');
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, 15));
    displayLabel = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  }

  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-xl text-sm">
      <p className="font-bold text-gray-800 mb-2">{displayLabel}</p>
      {payload.map((pld: any, index: number) => (
        <div key={`${pld.dataKey}-${index}`} className="flex items-center justify-between">
            <div className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: pld.stroke || pld.fill }}></span>
                <span className="text-gray-600">{pld.name}:</span>
            </div>
            <span className="font-semibold text-gray-800 ml-4">
              {
                pld.name === 'Sueldo Prom.' ? formatCurrency(pld.value) :
                pld.name === 'Antig. Prom.' ? `${pld.value.toFixed(1)} años` :
                pld.name === 'N° Empleados' ? formatNumber(pld.value) :
                pld.name === 'Prom. Días' ? `${pld.value.toFixed(1)} días` :
                formatCurrency(pld.value)
              }
            </span>
        </div>
      ))}
    </div>
  );
};

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


const HRDashboard = React.forwardRef<HTMLDivElement, { results: HRAnalysisResults }>(({ results }, ref) => {
  const { kpis, salaryDistributionByType, costByArea, costByActivity, seniorityDistribution, employeesByActivity, birthdaysInMonth, employeeRanking } = results;
  
  const ELEGANT_COLORS = ['#0284c7', '#14b8a6', '#f97316', '#6d28d9', '#475569', '#db2777'];
  const SENIORITY_COLORS = ['#0c4a6e', '#0369a1', '#0ea5e9', '#7dd3fc']; // Dark to light blue gradient

  const [showInactive, setShowInactive] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');


  const filteredEmployeeRanking = useMemo(() => {
      if (showInactive) {
          return employeeRanking;
      }
      return employeeRanking.filter(emp => emp.fechaBaja === null);
  }, [employeeRanking, showInactive]);
  
  const sortedEmployeeRanking = useMemo(() => {
    const searchTerm = employeeSearchTerm.toLowerCase();
    const searchedData = filteredEmployeeRanking.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm) ||
        emp.area.toLowerCase().includes(searchTerm)
    );

    return [...searchedData].sort((a, b) => {
      const areaCompare = a.area.localeCompare(b.area);
      if (areaCompare !== 0) return areaCompare;
      // Secondary sort by name
      return a.name.localeCompare(b.name);
    });
  }, [filteredEmployeeRanking, employeeSearchTerm]);


  return (
    <div className="space-y-6" ref={ref}>
       {/* --- NEW KPI Section --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Primary KPIs */}
        <KpiCard
            title="Total Sueldos Pagados"
            value={kpis.totalSalaries}
            format="currency"
            change={kpis.totalSalariesChange}
            positiveChangeIsBad
            details={
              <div className="bg-pizarro-blue-50 p-2 rounded-md text-center">
                  <p className="font-semibold text-pizarro-blue-800">Costo laboral del período</p>
              </div>
            }
        />
         <KpiCard
            title="Empleados Activos"
            value={kpis.employeeCount}
            format="number"
            change={kpis.employeeCountChange}
            details={
              <div className="bg-green-50 p-2 rounded-md text-center">
                  <p className="font-semibold text-green-800">Snapshot del último mes</p>
              </div>
            }
        />

        {/* Secondary KPIs */}
        <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center">
            <BadgeDollarSign className="w-6 h-6 text-pizarro-blue-600" />
            <h4 className="ml-2 font-semibold text-gray-600">Sueldo Promedio</h4>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-4 divide-x divide-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-500">Empleados</p>
              <p className="text-2xl font-bold text-gray-800 truncate" title={formatCurrency(kpis.avgSalaryEmployee)}>{formatCurrency(kpis.avgSalaryEmployee)}</p>
            </div>
            <div className="text-center pl-4">
              <p className="text-xs text-gray-500">Gerencia</p>
              <p className="text-2xl font-bold text-gray-800 truncate" title={formatCurrency(kpis.avgSalaryManagement)}>{formatCurrency(kpis.avgSalaryManagement)}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">Por persona en el período</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center">
            <Cake className="w-6 h-6 text-pink-500" />
            <h4 className="ml-2 font-semibold text-gray-600">Edad Promedio</h4>
          </div>
          <p className="text-3xl font-bold text-gray-800 mt-2">{kpis.avgAge.toFixed(1)} <span className="text-xl font-medium text-gray-500">años</span></p>
           <p className="text-xs text-gray-500 mt-1">De los empleados activos</p>
        </div>
         <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center">
            <Medal className="w-6 h-6 text-yellow-500" />
            <h4 className="ml-2 font-semibold text-gray-600">Antigüedad Promedio</h4>
          </div>
          <p className="text-3xl font-bold text-gray-800 mt-2">{kpis.avgSeniority.toFixed(1)} <span className="text-xl font-medium text-gray-500">años</span></p>
          <p className="text-xs text-gray-500 mt-1">De los empleados activos</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center">
            <Plane className="w-6 h-6 text-sky-500" />
            <h4 className="ml-2 font-semibold text-gray-600">Vacaciones Promedio</h4>
          </div>
          <p className="text-3xl font-bold text-gray-800 mt-2">{kpis.avgVacationDays.toFixed(1)} <span className="text-xl font-medium text-gray-500">días</span></p>
          <p className="text-xs text-gray-500 mt-1">Calculado por empleado activo</p>
        </div>
      </div>


      <ChartCard title="Distribución por Tipo" className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 5, right: 5, bottom: 40, left: 5 }}>
            <Pie 
              data={salaryDistributionByType} 
              dataKey="value" 
              nameKey="name" 
              cx="50%" 
              cy="50%" 
              innerRadius="60%" 
              outerRadius="90%" 
              paddingAngle={5}
              labelLine={false}
              label={renderCustomizedLabel}
            >
               {salaryDistributionByType.map((entry, index) => <Cell key={`cell-${index}`} fill={ELEGANT_COLORS[index % ELEGANT_COLORS.length]} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ bottom: 0 }}/>
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Costo por Área" className="h-[500px]">
           <ResponsiveContainer width="100%" height="100%">
            <BarChart data={costByArea} layout="vertical" margin={{ left: 5, right: 30, top: 5, bottom: 5}}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => formatNumber(v as number, true)} tick={{fontSize: 10}} />
              <YAxis dataKey="name" type="category" width={180} tick={{fontSize: 11, width: 170 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Costo" fill="#0369a1" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
         <ChartCard title="Costo por Actividad" className="h-[500px]">
           <ResponsiveContainer width="100%" height="100%">
            <BarChart data={costByActivity} layout="vertical" margin={{ left: 5, right: 30, top: 5, bottom: 5}}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => formatNumber(v as number, true)} tick={{fontSize: 10}} />
              <YAxis dataKey="name" type="category" width={180} tick={{fontSize: 11, width: 170 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Costo" fill="#0ea5e9" barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      
      {/* --- Workforce Analysis Section --- */}
      <div className="bg-white p-4 rounded-lg shadow-lg col-span-1 lg:col-span-3">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          <Users className="inline-block w-6 h-6 mr-2 -mt-1 text-pizarro-blue-600"/>
          Análisis de Personal
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Distribución por Antigüedad" className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={seniorityDistribution} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} label={{ value: 'N° Empleados', angle: -90, position: 'insideLeft' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="N° Empleados" radius={[4, 4, 0, 0]} barSize={80}>
                            {seniorityDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={SENIORITY_COLORS[index % SENIORITY_COLORS.length]} />
                            ))}
                            <LabelList dataKey="value" position="top" style={{ fill: '#374151', fontSize: '12px' }} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Empleados por Actividad" className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={employeesByActivity} layout="vertical" margin={{ left: 5, right: 40, top: 5, bottom: 5}}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tickFormatter={(v) => formatNumber(v as number)} tick={{fontSize: 10}} />
                  <YAxis dataKey="name" type="category" width={180} tick={{fontSize: 11, width: 170 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="N° Empleados" fill="#14b8a6" barSize={40}>
                    <LabelList dataKey="value" position="right" style={{ fill: '#374151', fontSize: '12px' }} formatter={(value: number) => formatNumber(value)} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
        </div>
      </div>

      {/* --- NEW Employee Ranking Section --- */}
      <ChartCard title="👥 Detalle de Empleados" className="h-[500px]">
        <div className="flex flex-col h-full">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <div className="relative w-full sm:w-1/3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por empleado o área..."
                        value={employeeSearchTerm}
                        onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-pizarro-blue-300 focus:outline-none"
                    />
                </div>
                <div className="flex-shrink-0">
                    <label className="flex items-center text-sm text-gray-600 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={() => setShowInactive(!showInactive)}
                            className="h-4 w-4 rounded border-gray-300 text-pizarro-blue-600 focus:ring-pizarro-blue-500 mr-2"
                        />
                        Mostrar empleados inactivos
                    </label>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-100 sticky top-0">
                        <tr>
                            <th className="px-4 py-2">Empleado</th>
                            <th className="px-4 py-2">Área</th>
                            <th className="px-4 py-2">Puesto</th>
                            <th className="px-4 py-2 text-center">Antigüedad</th>
                            <th className="px-4 py-2 text-center">Días de Vacaciones</th>
                            <th className="px-4 py-2 text-right">Monto Total (Período)</th>
                            <th className="px-4 py-2 text-center">Estado / Fecha Baja</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {sortedEmployeeRanking.map((emp) => (
                            <tr key={emp.cuil} className="hover:bg-gray-50">
                                <td className="px-4 py-2 font-medium text-gray-900">{emp.name}</td>
                                <td className="px-4 py-2 text-gray-600">{emp.area}</td>
                                <td className="px-4 py-2 text-gray-600">{emp.category}</td>
                                <td className="px-4 py-2 text-center text-gray-600 tabular-nums">
                                    {emp.seniority.toFixed(1)} años
                                </td>
                                <td className="px-4 py-2 text-center text-gray-600 tabular-nums">
                                    {emp.vacationDays}
                                </td>
                                <td className="px-4 py-2 text-right font-semibold text-pizarro-blue-800 tabular-nums">
                                    {formatCurrency(emp.totalAmount)}
                                </td>
                                <td className="px-4 py-2 text-center">
                                    {emp.fechaBaja ? (
                                        <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-1 rounded-full">
                                            {emp.fechaBaja.toLocaleDateString('es-ES')}
                                        </span>
                                    ) : (
                                        <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                            Activo
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {sortedEmployeeRanking.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        No hay empleados para mostrar con los filtros actuales.
                    </div>
                )}
            </div>
        </div>
      </ChartCard>
      
      {/* --- NEW Birthday Section --- */}
      <ChartCard title="🎂 Cumpleaños del Mes">
        {birthdaysInMonth && birthdaysInMonth.length > 0 ? (
          <div className="overflow-y-auto h-80 pr-2">
            <ul className="space-y-4">
              {birthdaysInMonth.map((person, index) => (
                <li key={`${person.name}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <p className="font-semibold text-gray-800">{person.name}</p>
                    <p className="text-sm text-gray-500">
                      {person.birthDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 italic">{person.position} en {person.branch}</p>
                  </div>
                  <div className="bg-pink-100 text-pink-700 text-sm font-bold px-3 py-1 rounded-full flex-shrink-0">
                    Cumple {person.ageTurning} años
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="h-80 flex flex-col items-center justify-center text-center text-gray-500">
            <Cake className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="font-semibold">Sin cumpleaños</p>
            <p className="text-sm">No hay cumpleaños para los meses seleccionados en los filtros.</p>
          </div>
        )}
      </ChartCard>

    </div>
  );
});

export default React.memo(HRDashboard);