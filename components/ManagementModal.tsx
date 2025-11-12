import React, { useState } from 'react';
import { X, Palette, Users, ShieldCheck } from 'lucide-react';
import { ColorMap } from '../types';
import { useAuth } from '../contexts/AuthContext';
import UserManagementPanel from './UserManagementPanel';

interface ManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  colorMap: ColorMap;
  setColorMap: React.Dispatch<React.SetStateAction<ColorMap>>;
  items: {
    branches: string[];
    salespeople: string[];
    clients: string[];
  };
}

const ManagementModal: React.FC<ManagementModalProps> = ({ isOpen, onClose, colorMap, setColorMap, items }) => {
  const [activeTab, setActiveTab] = useState('users');
  const { currentUser } = useAuth();

  if (!isOpen) return null;

  const handleColorChange = (name: string, color: string) => {
    setColorMap(prevMap => ({
      ...prevMap,
      [name]: color,
    }));
  };

  const ColorPickerRow: React.FC<{ name: string }> = ({ name }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-200">
      <span className="text-gray-700 truncate pr-4">{name}</span>
      <div className="relative">
        <input
          type="color"
          value={colorMap[name] || '#ffffff'}
          onChange={(e) => handleColorChange(name, e.target.value)}
          className="w-10 h-10 p-1 border-none cursor-pointer appearance-none bg-transparent"
          style={{'backgroundColor': 'transparent'}}
        />
        <div 
         className="absolute top-0 left-0 w-10 h-10 rounded-md border border-gray-300 pointer-events-none"
         style={{ backgroundColor: colorMap[name] || '#ffffff' }}
        ></div>
      </div>
    </div>
  );

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center">
            <ShieldCheck className="mr-3 text-pizarro-blue-600 w-7 h-7"/>
            <h2 className="text-xl font-bold text-gray-800">
              Panel de Gestión
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </header>
        
        <div className="border-b border-gray-200 px-6">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'users' ? 'border-pizarro-blue-500 text-pizarro-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                    <Users className="w-5 h-5 mr-2"/>
                    Usuarios y Seguridad
                </button>
                <button
                    onClick={() => setActiveTab('colors')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'colors' ? 'border-pizarro-blue-500 text-pizarro-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                    <Palette className="w-5 h-5 mr-2"/>
                    Configuración de Colores
                </button>
            </nav>
        </div>

        <main className="p-6 overflow-y-auto bg-gray-50 flex-grow">
          <div className={activeTab === 'users' ? 'block' : 'hidden'}>
            <UserManagementPanel />
          </div>

          <div className={activeTab === 'colors' ? 'block' : 'hidden'}>
              <div className="bg-white p-6 rounded-lg shadow-md">
                 <h3 className="text-lg font-semibold text-gray-700 mb-4">Personalizar colores de los gráficos</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                    <h4 className="text-md font-semibold text-gray-700 mb-3">Sucursales</h4>
                    <div className="space-y-2">
                        {items.branches.map(branch => <ColorPickerRow key={branch} name={branch} />)}
                    </div>
                    </div>
                    <div>
                    <h4 className="text-md font-semibold text-gray-700 mb-3">Vendedores</h4>
                    <div className="space-y-2">
                        {items.salespeople.map(sp => <ColorPickerRow key={sp} name={sp} />)}
                    </div>
                    </div>
                    <div>
                    <h4 className="text-md font-semibold text-gray-700 mb-3">Clientes</h4>
                    <div className="space-y-2">
                        {items.clients.map(client => <ColorPickerRow key={client} name={client} />)}
                    </div>
                    </div>
                </div>
              </div>
          </div>
        </main>
         <footer className="p-4 bg-gray-100 border-t border-gray-200 mt-auto text-right">
            <button
                onClick={onClose}
                className="px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pizarro-blue-600 hover:bg-pizarro-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pizarro-blue-500"
            >
                Cerrar
            </button>
        </footer>
      </div>
    </div>
  );
};

export default ManagementModal;