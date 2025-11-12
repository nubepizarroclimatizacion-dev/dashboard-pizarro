import React, { useState, useEffect, useRef } from 'react';
import { SlidersHorizontal, ChevronDown, Search } from 'lucide-react';
import MultiSelectFilter from './MultiSelectFilter';

interface FilterControlsProps {
  branches: string[];
  salespeople: string[];
  years: string[];
  months: { name: string; num: number }[];
  filters: {
    branches: string[];
    salespeople: string[];
    years: string[];
    months: number[];
    startDate: Date | null;
    endDate: Date | null;
  };
  showDateFilters?: boolean;
  onFilterChange: (filterName: string, value: any) => void;
  onResetFilters: () => void;
}

const formatDateForInput = (date: Date | null): string => {
  if (!date || isNaN(date.getTime())) return '';
  // Use local date parts to avoid timezone conversion issues with toISOString().
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const FilterControls: React.FC<FilterControlsProps> = ({
  branches,
  salespeople,
  years,
  months,
  filters,
  onFilterChange,
  onResetFilters,
  showDateFilters = true,
}) => {
  const [startDateStr, setStartDateStr] = useState(() => formatDateForInput(filters.startDate));
  const [endDateStr, setEndDateStr] = useState(() => formatDateForInput(filters.endDate));

  // Sync local state if parent state changes (e.g., reset filters)
  useEffect(() => {
    setStartDateStr(formatDateForInput(filters.startDate));
  }, [filters.startDate]);

  useEffect(() => {
    setEndDateStr(formatDateForInput(filters.endDate));
  }, [filters.endDate]);


  const handleMonthChange = (selectedNames: string[]) => {
    const selectedNumbers = selectedNames
      .map(name => months.find(m => m.name === name)?.num)
      .filter((num): num is number => num !== undefined);
    onFilterChange('months', selectedNumbers);
  };
  
  const selectedMonthNames = filters.months
    .map(num => months.find(m => m.num === num)?.name)
    .filter((name): name is string => name !== undefined);

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Update local string state immediately to show user's input
    if (name === 'startDate') {
      setStartDateStr(value);
    } else if (name === 'endDate') {
      setEndDateStr(value);
    }

    // A valid date from the picker will be a "YYYY-MM-DD" string.
    // If input is cleared, value is "".
    if (value === '') {
      onFilterChange(name, null); // Propagate clearing the date
      return;
    }
    
    // Basic validation: the year part of the string should be reasonable.
    // This prevents propagation of invalid years like "222222".
    const year = parseInt(value.substring(0, 4), 10);
    if (year > 1900 && year < 9999) {
      onFilterChange(name, value);
    } 
    // If the year is invalid, we don't update the parent filter state.
    // The user can see their invalid input in the box and correct it.
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <SlidersHorizontal className="w-5 h-5 mr-2 text-pizarro-blue-600" />
          Filtros Aplicados
        </h3>
        <button
          onClick={onResetFilters}
          className="text-sm font-medium text-pizarro-blue-600 hover:text-pizarro-blue-800 transition-colors"
        >
          Limpiar Filtros
        </button>
      </div>
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${showDateFilters ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4`}>
        
        <MultiSelectFilter
            label="Sucursal"
            options={branches}
            selectedOptions={filters.branches}
            onChange={(selected) => onFilterChange('branches', selected)}
        />
        
        <MultiSelectFilter
            label="Vendedor"
            options={salespeople}
            selectedOptions={filters.salespeople}
            onChange={(selected) => onFilterChange('salespeople', selected)}
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

        {showDateFilters && (
          <>
            <div>
                <label htmlFor="startDate" className="text-sm font-medium text-gray-700 mb-1 block">Fecha Desde</label>
                <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={startDateStr}
                    onChange={handleDateInputChange}
                    max="9999-12-31"
                    className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-md text-left text-gray-900 focus:outline-none focus:ring-2 focus:ring-pizarro-blue-500 focus:border-pizarro-blue-500"
                />
            </div>
            <div>
                <label htmlFor="endDate" className="text-sm font-medium text-gray-700 mb-1 block">Fecha Hasta</label>
                <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={endDateStr}
                    onChange={handleDateInputChange}
                    max="9999-12-31"
                    className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-md text-left text-gray-900 focus:outline-none focus:ring-2 focus:ring-pizarro-blue-500 focus:border-pizarro-blue-500"
                />
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default React.memo(FilterControls);