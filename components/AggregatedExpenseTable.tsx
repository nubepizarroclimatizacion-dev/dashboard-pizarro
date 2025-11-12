import React, { useMemo } from 'react';
import { AggregatedExpenseItem } from '../types';
import { formatCurrency } from '../utils/formatters';

interface AggregatedExpenseTableProps {
  title: string;
  subtitle?: string;
  data: AggregatedExpenseItem[];
  onItemClick?: (name: string) => void;
  selectedItem?: string | null;
}

const AggregatedExpenseTable: React.FC<AggregatedExpenseTableProps> = ({ title, subtitle, data, onItemClick, selectedItem }) => {
  const totalAmount = useMemo(() => data.reduce((sum, item) => sum + item.total, 0), [data]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg h-[450px] flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 truncate" title={title}>{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 -mt-1">{subtitle}</p>}
      </div>
      <div className="flex-grow overflow-y-auto pr-2">
        {data.length > 0 ? (
          <div className="space-y-2">
            {data.map((item, index) => {
              const percentage = totalAmount > 0 ? (item.total / totalAmount) * 100 : 0;
              const isSelected = item.name === selectedItem;
              const isClickable = !!onItemClick;

              const containerClasses = `
                p-2 rounded-lg transition-all duration-200
                ${isClickable ? 'cursor-pointer hover:bg-pizarro-blue-50' : ''}
                ${isSelected ? 'bg-pizarro-blue-100 ring-2 ring-pizarro-blue-400' : 'border border-transparent'}
              `;

              return (
                <div
                  key={`${item.name}-${index}`}
                  className={containerClasses}
                  onClick={isClickable ? () => onItemClick(item.name) : undefined}
                  role={isClickable ? 'button' : undefined}
                  tabIndex={isClickable ? 0 : -1}
                  onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onItemClick(item.name); } : undefined}
                  aria-pressed={isSelected}
                >
                  <div className="flex justify-between items-center mb-1 text-sm">
                    <span className="font-medium text-gray-700 truncate" title={item.name}>
                      {item.name}
                    </span>
                    <span className="font-bold text-pizarro-blue-800 tabular-nums">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-pizarro-blue-400 to-pizarro-blue-600 h-2 rounded-full transition-width duration-500 ease-out"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-semibold text-gray-500 min-w-[40px] text-right ml-3">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-500">No hay datos para la selección actual.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(AggregatedExpenseTable);