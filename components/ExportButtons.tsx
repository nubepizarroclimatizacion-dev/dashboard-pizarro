
import React from 'react';
import { Image, FileText, Loader2 } from 'lucide-react';

interface ExportButtonsProps {
  onExport: (format: 'png' | 'pdf') => void;
  isExporting: boolean;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ onExport, isExporting }) => {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-600">Exportar vista:</span>
      <button
        onClick={() => onExport('png')}
        disabled={isExporting}
        className="flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pizarro-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Image className="w-4 h-4 mr-2" />
        )}
        PNG
      </button>
      <button
        onClick={() => onExport('pdf')}
        disabled={isExporting}
        className="flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pizarro-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <FileText className="w-4 h-4 mr-2" />
        )}
        PDF
      </button>
    </div>
  );
};

export default ExportButtons;
