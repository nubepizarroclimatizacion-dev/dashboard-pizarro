

import React from 'react';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: number;
  format?: 'currency' | 'number' | 'percentage';
  currencyCode?: 'ARS' | 'USD';
  subValue?: number;
  subValueColor?: 'red' | 'blue' | 'green';
  details?: React.ReactNode;
  progress?: number;
  change?: number;
  positiveChangeIsBad?: boolean;
}

const getFontSizeClass = (valStr: string) => {
    const len = valStr.length;
    if (len > 15) return 'text-xl';
    if (len > 12) return 'text-2xl';
    if (len > 9) return 'text-3xl';
    return 'text-4xl';
}

const ChangeIndicator = ({ value, invertColors = false }: { value: number; invertColors?: boolean }) => {
    if (value === 0 || !isFinite(value)) return null;

    const isPositive = value > 0;
    let colorClass = isPositive ? 'text-green-600' : 'text-red-600';
    if (invertColors) {
        colorClass = isPositive ? 'text-red-600' : 'text-green-600';
    }
    const Icon = isPositive ? TrendingUp : TrendingDown;

    return (
        <span className={`flex items-center justify-end text-xs font-semibold ${colorClass}`}>
            <Icon className="w-4 h-4 mr-1" />
            {value.toFixed(1)}% vs mes anterior
        </span>
    );
};

const KpiCard = ({ title, value, format = 'number', currencyCode = 'ARS', subValue, subValueColor = 'red', details, progress, change, positiveChangeIsBad = false }: KpiCardProps) => {
  let formattedValue: string;
  switch (format) {
      case 'currency':
          formattedValue = formatCurrency(value, currencyCode);
          break;
      case 'percentage':
          formattedValue = `${value.toFixed(2)}%`;
          break;
      case 'number':
      default:
          formattedValue = formatNumber(value);
          break;
  }
  
  const fontSizeClass = getFontSizeClass(formattedValue);

  let subValueColorClass = 'text-red-500';
  if (subValueColor === 'blue') subValueColorClass = 'text-pizarro-blue-600';
  if (subValueColor === 'green') subValueColorClass = 'text-green-600';

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col justify-between min-h-[140px]">
      <div>
        <h3 className="text-md font-semibold text-gray-500 truncate">{title}</h3>
        <div className="mt-2 text-right">
            <p className={`font-bold text-pizarro-blue-700 ${fontSizeClass} truncate`}>
            {formattedValue}
            </p>
            {subValue !== undefined && (
            <p className={`text-sm ${subValueColorClass} font-semibold truncate`}>
                {formatCurrency(subValue, currencyCode)}
            </p>
            )}
            {change !== undefined && (
                <div className="mt-1">
                    <ChangeIndicator value={change} invertColors={positiveChangeIsBad} />
                </div>
            )}
        </div>
      </div>
      
       {progress !== undefined && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-3.5 relative">
            <div 
              className={`${progress >= 100 ? 'bg-green-500' : 'bg-pizarro-blue-600'} h-3.5 rounded-full flex items-center justify-center transition-all duration-500`} 
              style={{ width: `${Math.min(progress, 100)}%` }}
            >
            </div>
             <span className="absolute w-full h-full top-0 left-0 flex items-center justify-center text-white text-[10px] font-bold drop-shadow">
                {progress.toFixed(1)}%
              </span>
          </div>
        </div>
      )}
      
       {details && (
        <div className={`pt-3 border-t border-gray-100 text-xs text-gray-500 ${progress === undefined && change === undefined ? 'mt-auto' : 'mt-3'}`}>
            {details}
        </div>
      )}
    </div>
  );
};

export default React.memo(KpiCard);