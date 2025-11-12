import React, { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, BarChart3, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const auth = useAuth();
    
    const handleLogin = (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        // Simulate network delay
        setTimeout(() => {
            const success = auth.login(username, password);
            if (!success) {
                setError('Usuario o contraseña incorrectos. Intente de nuevo.');
            }
            setIsLoading(false);
        }, 500);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 font-sans p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <div className="flex justify-center items-center gap-3">
                            <BarChart3 className="w-10 h-10 text-pizarro-blue-600" />
                            <h1 className="text-3xl font-bold text-gray-800">
                                Pizarro Climatización
                            </h1>
                        </div>
                        <p className="text-gray-500">Analizador de Datos v4</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                         {error && (
                            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-start" role="alert">
                                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">Error de autenticación</p>
                                    <p className="text-sm">{error}</p>
                                </div>
                            </div>
                        )}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                Usuario
                            </label>
                            <div className="mt-1">
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    autoComplete="username"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pizarro-blue-500 focus:border-pizarro-blue-500 sm:text-sm"
                                    placeholder="ej: admin"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Contraseña
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pizarro-blue-500 focus:border-pizarro-blue-500 sm:text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pizarro-blue-600 hover:bg-pizarro-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pizarro-blue-500 disabled:bg-pizarro-blue-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? (
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <LogIn className="w-5 h-5 mr-2 -ml-1" />
                                )}
                                Iniciar Sesión
                            </button>
                        </div>
                    </form>
                    <div className="text-center text-xs text-gray-400 pt-4">
                        <p>Usuarios de prueba:</p>
                        <p>admin / adminpassword</p>
                        <p>lector / lectorpassword</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
