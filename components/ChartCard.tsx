

import React from 'react';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white p-4 rounded-lg shadow-lg flex flex-col relative ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <div className="w-full flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
};

export default React.memo(ChartCard);