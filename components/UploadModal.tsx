import React from 'react';
import { X, TrendingUp, ShoppingCart, CheckCircle, ReceiptText, Briefcase, Archive } from 'lucide-react';
import FileUpload from './FileUpload';
import PurchaseFileUpload from './PurchaseFileUpload';
import ExpenseFileUpload from './ExpenseFileUpload';
import HRFileUpload from './HRFileUpload';
import StockFileUpload from './StockFileUpload';
import { SaleRecord, PurchaseRecord, ExpenseRecord, HRRecord, StockRecord } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSalesDataLoaded: (data: SaleRecord[], error?: string) => void;
  onPurchasesDataLoaded: (data: PurchaseRecord[], error?: string) => void;
  onExpensesDataLoaded: (data: ExpenseRecord[], error?: string) => void;
  onHRDataLoaded: (data: HRRecord[], error?: string) => void;
  onStockDataLoaded: (data: StockRecord[], error?: string) => void;
  setIsLoading: (loading: boolean) => void;
  salesDataLoaded: boolean;
  purchasesDataLoaded: boolean;
  expensesDataLoaded: boolean;
  hrDataLoaded: boolean;
  stockDataLoaded: boolean;
  error: string | null;
}

const UploadModal: React.FC<UploadModalProps> = ({ 
  isOpen, 
  onClose, 
  onSalesDataLoaded, 
  onPurchasesDataLoaded, 
  onExpensesDataLoaded,
  onHRDataLoaded,
  onStockDataLoaded,
  setIsLoading, 
  salesDataLoaded, 
  purchasesDataLoaded, 
  expensesDataLoaded,
  hrDataLoaded,
  stockDataLoaded,
  error 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Cargar Datos</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </header>
        <main className="p-8 overflow-y-auto">
          <p className="text-gray-600 mb-6 text-center">Cargue sus archivos de Excel (.xlsx) o CSV. Puede cargar uno o más archivos para comenzar el análisis.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <TrendingUp className="w-6 h-6 mr-2 text-pizarro-blue-600"/>
                <h3 className="text-xl font-semibold text-gray-700">Ventas</h3>
                {salesDataLoaded && <span title="Datos de ventas cargados"><CheckCircle className="w-5 h-5 ml-2 text-green-500"/></span>}
              </div>
              <FileUpload onDataLoaded={onSalesDataLoaded} setIsLoading={setIsLoading} />
            </div>
            <div>
              <div className="flex items-center mb-4">
                <ShoppingCart className="w-6 h-6 mr-2 text-pizarro-blue-600"/>
                <h3 className="text-xl font-semibold text-gray-700">Compras</h3>
                {purchasesDataLoaded && <span title="Datos de compras cargados"><CheckCircle className="w-5 h-5 ml-2 text-green-500"/></span>}
              </div>
              <PurchaseFileUpload onDataLoaded={onPurchasesDataLoaded} setIsLoading={setIsLoading} />
            </div>
            <div>
              <div className="flex items-center mb-4">
                <ReceiptText className="w-6 h-6 mr-2 text-pizarro-blue-600"/>
                <h3 className="text-xl font-semibold text-gray-700">Gastos</h3>
                {expensesDataLoaded && <span title="Datos de gastos cargados"><CheckCircle className="w-5 h-5 ml-2 text-green-500"/></span>}
              </div>
              <ExpenseFileUpload onDataLoaded={onExpensesDataLoaded} setIsLoading={setIsLoading} />
            </div>
            <div>
              <div className="flex items-center mb-4">
                <Briefcase className="w-6 h-6 mr-2 text-pizarro-blue-600"/>
                <h3 className="text-xl font-semibold text-gray-700">RRHH</h3>
                {hrDataLoaded && <span title="Datos de RRHH cargados"><CheckCircle className="w-5 h-5 ml-2 text-green-500"/></span>}
              </div>
              <HRFileUpload onDataLoaded={onHRDataLoaded} setIsLoading={setIsLoading} />
            </div>
            <div>
              <div className="flex items-center mb-4">
                <Archive className="w-6 h-6 mr-2 text-pizarro-blue-600"/>
                <h3 className="text-xl font-semibold text-gray-700">Stock</h3>
                {stockDataLoaded && <span title="Datos de stock cargados"><CheckCircle className="w-5 h-5 ml-2 text-green-500"/></span>}
              </div>
              <StockFileUpload onDataLoaded={onStockDataLoaded} setIsLoading={setIsLoading} />
            </div>
          </div>
           {error && <p className="mt-6 text-center text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
        </main>
        <footer className="p-4 bg-gray-50 border-t border-gray-200 mt-auto text-right">
            <button onClick={onClose} className="px-4 py-2 bg-pizarro-blue-600 text-white rounded-md hover:bg-pizarro-blue-700 transition-colors">
                Cerrar y Analizar
            </button>
        </footer>
      </div>
    </div>
  );
};

export default UploadModal;
