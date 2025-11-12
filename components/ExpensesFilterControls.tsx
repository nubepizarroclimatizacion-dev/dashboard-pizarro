import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import MultiSelectFilter from './MultiSelectFilter';

interface ExpensesFilterControlsProps {
  categories: string[];
  subcategories: string[];
  years: string[];
  months: { name: string; num: number }[];
  filters: {
    categories: string[];
    subcategories: string[];
    years: string[];
    months: number[];
  };
  onFilterChange: (filterName: string, value: any) => void;
  onResetFilters: () => void;
}

const ExpensesFilterControls: React.FC<ExpensesFilterControlsProps> = ({
  categories, subcategories, years, months, filters, onFilterChange, onResetFilters,
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
          Filtros de Gastos
        </h3>
        <button onClick={onResetFilters} className="text-sm font-medium text-pizarro-blue-600 hover:text-pizarro-blue-800 transition-colors">
          Limpiar Filtros
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MultiSelectFilter
            label="Categoría"
            options={categories}
            selectedOptions={filters.categories}
            onChange={(selected) => onFilterChange('categories', selected)}
        />
        <MultiSelectFilter
            label="Subcategoría"
            options={subcategories}
            selectedOptions={filters.subcategories}
            onChange={(selected) => onFilterChange('subcategories', selected)}
        />
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
      </div>
    </div>
  );
};

export default React.memo(ExpensesFilterControls);
