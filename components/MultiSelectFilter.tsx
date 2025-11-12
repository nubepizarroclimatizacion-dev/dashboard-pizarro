import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface MultiSelectFilterProps {
  label: string;
  options: string[];
  selectedOptions: string[];
  onChange: (selected: string[]) => void;
}

const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({ label, options, selectedOptions, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleToggleOption = (option: string) => {
    const newSelection = selectedOptions.includes(option)
      ? selectedOptions.filter(item => item !== option)
      : [...selectedOptions, option];
    onChange(newSelection);
  };

  const clearSelection = () => {
      onChange([]);
  }

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getPluralLabel = (baseLabel: string) => {
    if (baseLabel === 'Mes') return 'Meses';
    if (baseLabel.endsWith('r') || baseLabel.endsWith('l')) return `${baseLabel}es`;
    return `${baseLabel}s`;
  }

  const getButtonLabel = () => {
    const count = selectedOptions.length;
    if (count === 0) {
      return `Todos los ${getPluralLabel(label)}`;
    }
    if (count === 1) {
      return selectedOptions[0];
    }
    // Muestra el último seleccionado y la cantidad de los demás para un feedback inmediato
    const lastSelected = selectedOptions[count - 1];
    const othersCount = count - 1;
    return `${lastSelected} (+${othersCount} más)`;
  };

  const displayValue = getButtonLabel();

  return (
    <div className="relative w-full" ref={wrapperRef}>
        <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
        <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-md text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-pizarro-blue-500 focus:border-pizarro-blue-500"
        >
            <span className="truncate" title={selectedOptions.join(', ')}>{displayValue}</span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
        </button>

        {isOpen && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 flex flex-col">
                <div className="p-2 border-b border-gray-200">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="w-full pl-8 pr-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pizarro-blue-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>
                <ul className="overflow-y-auto flex-1 p-1">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map(option => (
                        <li key={option}
                            onClick={() => handleToggleOption(option)}
                            className="px-3 py-2 text-sm text-gray-800 rounded-md cursor-pointer hover:bg-pizarro-blue-50 flex items-center"
                        >
                            <input
                                type="checkbox"
                                readOnly
                                checked={selectedOptions.includes(option)}
                                className="h-4 w-4 rounded border-gray-300 text-pizarro-blue-600 focus:ring-pizarro-blue-500 mr-3 pointer-events-none"
                            />
                            <span>{option}</span>
                        </li>
                        ))
                    ) : (
                        <li className="px-3 py-2 text-sm text-gray-500 text-center">No se encontraron resultados.</li>
                    )}
                </ul>
                 {selectedOptions.length > 0 && (
                    <div className="p-2 border-t border-gray-200">
                        <button 
                            onClick={clearSelection}
                            className="w-full text-sm text-pizarro-blue-600 hover:text-pizarro-blue-800"
                        >
                            Limpiar selección
                        </button>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default React.memo(MultiSelectFilter);