
// components/RankingTable.tsx
import React, { useState, useMemo } from 'react';
import { RankingItem, ColorMap } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { Medal, Search } from 'lucide-react';

interface RankingTableProps {
  title: string;
  data: RankingItem[];
  colorMap: ColorMap;
  searchable?: boolean;
}

const MedalIcon = ({ rank }: { rank: number }) => {
  if (rank > 2) {
    // Render a placeholder to maintain alignment
    return <div className="w-4 h-4 mr-2" />;
  }
  const colors = ['text-yellow-400', 'text-gray-400', 'text-orange-500']; // Gold, Silver, Bronze
  return <Medal className={`w-4 h-4 mr-2 flex-shrink-0 ${colors[rank]}`} />;
};

const RANKING_LIMIT = 50;

const RankingTable: React.FC<RankingTableProps> = ({ title, data, colorMap, searchable = false }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    if (!searchTerm) {
      return data;
    }
    return data.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const limitedData = filteredData.slice(0, RANKING_LIMIT);
  const placeholderText = `Buscar en ${title.replace('Ranking de ', '').toLowerCase()}...`;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg h-[450px] flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      {searchable && (
        <div className="relative mb-2 flex-shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder={placeholderText}
            className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pizarro-blue-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      )}
      <div className="flex-grow overflow-y-auto pr-2">
        <table className="w-full text-xs text-left text-gray-500 table-fixed">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-2 py-3 w-10">#</th>
              <th scope="col" className="px-2 py-3 w-[45%]">Nombre</th>
              <th scope="col" className="px-1 py-3 text-right w-[30%]">Ventas Totales</th>
              <th scope="col" className="px-1 py-3 text-right w-[20%]">N° Facturas</th>
            </tr>
          </thead>
          <tbody>
            {limitedData.map((item, index) => {
              const isTop10 = index < 10;
              return (
                <tr 
                  key={item.name} 
                  className={`border-b hover:bg-gray-50 ${isTop10 ? 'font-bold text-gray-900' : 'text-gray-600'}`}
                >
                  <td className="px-2 py-2 align-top">{index + 1}</td>
                  <td className="px-2 py-2 align-top" title={item.name}>
                    <div className="flex items-start">
                      <MedalIcon rank={index} />
                      <span
                        className="w-3 h-3 rounded-full mr-2 flex-shrink-0 mt-1"
                        style={{ backgroundColor: colorMap[item.name] || '#cccccc' }}
                      ></span>
                      <span className="break-words">{item.name}</span>
                    </div>
                  </td>
                  <td className={`px-1 py-2 text-right tabular-nums align-top ${isTop10 ? 'text-pizarro-blue-800' : ''}`}>
                    {formatCurrency(item.totalSales)}
                  </td>
                  <td className="px-1 py-2 text-right tabular-nums align-top">{formatNumber(item.invoiceCount)}</td>
                </tr>
              )
            })}
             {limitedData.length === 0 && (
                <tr>
                    <td colSpan={4} className="text-center py-10 text-gray-500">
                        {searchTerm ? 'No se encontraron resultados.' : 'No hay datos disponibles.'}
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      {filteredData.length > RANKING_LIMIT && (
        <div className="pt-2 flex-shrink-0">
            <p className="text-xs text-center text-gray-500">
                Mostrando los primeros {RANKING_LIMIT} de {filteredData.length} resultados.
            </p>
        </div>
      )}
    </div>
  );
};

export default React.memo(RankingTable);
