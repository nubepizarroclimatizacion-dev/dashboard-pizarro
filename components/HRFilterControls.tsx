import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import MultiSelectFilter from './MultiSelectFilter';

interface HRFilterControlsProps {
  years: string[];
  months: { name: string; num: number }[];
  areas: string[];
  activities: string[];
  types: string[];
  filters: {
    years: string[];
    months: number[];
    areas: string[];
    activities: string[];
    types: string[];
  };
  onFilterChange: (filterName: string, value: any) => void;
  onResetFilters: () => void;
}

const HRFilterControls: React.FC<HRFilterControlsProps> = ({
  years, months, areas, activities, types, filters, onFilterChange, onResetFilters
}) => {

  const handleMonthChange = (selectedNames: string[]) => {
    const selectedNumbers = selectedNames
      .map(name => months.find(m => m.name === name)?.num)
      .filter((num): num is number => num !== undefined);
    onFilterChange('months', selectedNumbers);
  };
  
  const selectedMonthNames = filters.months
    .map(num => months.find(m => m.num === num)?.name)
    .filter((name): name is string => name !== undefined);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <SlidersHorizontal className="w-5 h-5 mr-2 text-pizarro-blue-600" />
          Filtros de Sueldos y RRHH
        </h3>
        <button onClick={onResetFilters} className="text-sm font-medium text-pizarro-blue-600 hover:text-pizarro-blue-800 transition-colors">
          Limpiar Filtros
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <MultiSelectFilter
            label="Año"
            options={years}
            selectedOptions={filters.years}
            onChange={(selected) => onFilterChange('years', selected)}
        />
        <MultiSelectFilter
            label="Mes"
            options={months.map(m => m.name)}
            selectedOptions={selectedMonthNames}
            onChange={handleMonthChange}
        />
         <MultiSelectFilter
            label="Área"
            options={areas}
            selectedOptions={filters.areas}
            onChange={(selected) => onFilterChange('areas', selected)}
        />
        <MultiSelectFilter
            label="Actividad"
            options={activities}
            selectedOptions={filters.activities}
            onChange={(selected) => onFilterChange('activities', selected)}
        />
        <MultiSelectFilter
            label="Tipo"
            options={types}
            selectedOptions={filters.types}
            onChange={(selected) => onFilterChange('types', selected)}
        />
      </div>
    </div>
  );
};

export default React.memo(HRFilterControls);