import React, { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import { Edit, Trash2, Plus, KeyRound, AlertCircle, CheckCircle } from 'lucide-react';

const Message = ({ message, type }: { message: string | null, type: 'error' | 'success' }) => {
    if (!message) return null;
    const isError = type === 'error';
    const config = {
        icon: isError ? <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" /> : <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />,
        containerClasses: isError ? "bg-red-100 border-red-500 text-red-700" : "bg-green-100 border-green-500 text-green-700",
    };

    return (
        <div className={`border-l-4 p-4 rounded-md flex items-start my-4 ${config.containerClasses}`} role="alert">
            {config.icon}
            <span className="text-sm">{message}</span>
        </div>
    );
};


const UserManagementPanel: React.FC = () => {
    const { currentUser, users, addUser, updateUser, deleteUser, updatePassword } = useAuth();
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '', role: 'reader' as 'admin' | 'reader' });
    const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
    
    // Separate state for messages
    const [userMgmtError, setUserMgmtError] = useState<string | null>(null);
    const [userMgmtSuccess, setUserMgmtSuccess] = useState<string | null>(null);
    const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
    const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);

    const clearMessages = () => {
        setUserMgmtError(null);
        setUserMgmtSuccess(null);
        setPasswordChangeError(null);
        setPasswordChangeSuccess(null);
    };

    const handleEditClick = (user: User) => {
        setEditingUser(user);
        setFormData({ username: user.username, password: '', role: user.role });
        setIsAdding(false);
        clearMessages();
    };

    const handleAddClick = () => {
        setIsAdding(true);
        setEditingUser(null);
        setFormData({ username: '', password: '', role: 'reader' });
        clearMessages();
    };

    const handleCancel = () => {
        setEditingUser(null);
        setIsAdding(false);
        clearMessages();
    };
    
    const inputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pizarro-blue-500 focus:border-pizarro-blue-500 sm:text-sm";

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFormSubmit = (e: FormEvent) => {
        e.preventDefault();
        clearMessages();

        if (!formData.username) {
            setUserMgmtError("El nombre de usuario es requerido.");
            return;
        }

        if (isAdding) {
            if (!formData.password || formData.password.length < 6) {
                setUserMgmtError("La contraseña es requerida y debe tener al menos 6 caracteres.");
                return;
            }
            const result = addUser({ username: formData.username, password: formData.password, role: formData.role });
            if(result.success) {
                setUserMgmtSuccess(`Usuario '${formData.username}' creado exitosamente.`);
                handleCancel();
            } else {
                setUserMgmtError(result.message || 'Ocurrió un error.');
            }
        } else if (editingUser) {
            const userToUpdate = { ...editingUser, username: formData.username, role: formData.role };
            if (formData.password) {
                if (formData.password.length < 6) {
                    setUserMgmtError("La nueva contraseña debe tener al menos 6 caracteres.");
                    return;
                }
                updatePassword(editingUser.id, formData.password);
            }
            updateUser(userToUpdate);
            setUserMgmtSuccess(`Usuario '${formData.username}' actualizado.`);
            handleCancel();
        }
    };

    const handleDelete = (userId: number) => {
        clearMessages();
        const userToDelete = users.find(u => u.id === userId);
        if (!userToDelete) return; // Should not happen but as a safeguard

        if (window.confirm(`¿Está seguro de que desea eliminar al usuario '${userToDelete.username}'? Esta acción es irreversible.`)) {
            const result = deleteUser(userId);
            if (!result.success) {
                setUserMgmtError(result.message || 'Ocurrió un error al eliminar el usuario.');
            } else {
                setUserMgmtSuccess(`Usuario '${userToDelete.username}' eliminado exitosamente.`);
            }
        }
    };
    
    const handlePasswordChangeSubmit = (e: FormEvent) => {
        e.preventDefault();
        clearMessages();
        if(passwordData.newPassword.length < 6) {
            setPasswordChangeError("La nueva contraseña debe tener al menos 6 caracteres.");
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordChangeError("Las contraseñas no coinciden.");
            return;
        }
        if (currentUser) {
            updatePassword(currentUser.id, passwordData.newPassword);
            setPasswordChangeSuccess("¡Contraseña actualizada exitosamente!");
            setPasswordData({ newPassword: '', confirmPassword: '' });
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* --- ADMIN PANEL --- */}
            {currentUser?.role === 'admin' && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Gestionar Usuarios</h3>
                    <Message message={userMgmtError} type="error" />
                    <Message message={userMgmtSuccess} type="success" />
                    <div className="mb-4">
                        <button onClick={handleAddClick} disabled={isAdding} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pizarro-blue-600 hover:bg-pizarro-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pizarro-blue-500 disabled:opacity-50">
                            <Plus className="w-5 h-5 mr-2" />
                            Agregar Nuevo Usuario
                        </button>
                    </div>
                    {(isAdding || editingUser) && (
                        <form onSubmit={handleFormSubmit} className="p-4 bg-gray-50 rounded-md border border-gray-200 mb-4 space-y-4">
                             <h4 className="font-semibold">{isAdding ? 'Nuevo Usuario' : `Editando a ${editingUser?.username}`}</h4>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                                <input type="text" name="username" value={formData.username} onChange={handleFormChange} className={inputClasses}/>
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña ({isAdding ? 'Requerida' : 'Dejar en blanco para no cambiar'})</label>
                                <input type="password" name="password" value={formData.password} onChange={handleFormChange} className={inputClasses}/>
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                                <select name="role" value={formData.role} onChange={handleFormChange} className={inputClasses}>
                                    <option value="reader">Lector</option>
                                    <option value="admin">Administrador</option>
                                </select>
                             </div>
                             <div className="flex gap-2">
                                <button type="submit" className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700">Guardar</button>
                                <button type="button" onClick={handleCancel} className="px-4 py-2 bg-gray-200 text-sm rounded-md hover:bg-gray-300">Cancelar</button>
                             </div>
                        </form>
                    )}
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {users.map(user => (
                            <div key={user.id} className="flex items-center justify-between p-3 bg-white border rounded-md">
                                <div>
                                    <p className="font-medium text-gray-900">{user.username}</p>
                                    <p className="text-xs text-gray-500">{user.role === 'admin' ? 'Administrador' : 'Lector'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEditClick(user)} className="p-2 text-gray-500 hover:text-pizarro-blue-600"><Edit className="w-4 h-4"/></button>
                                    <button onClick={() => handleDelete(user.id)} disabled={user.id === currentUser.id} className="p-2 text-gray-500 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- CHANGE PASSWORD PANEL (for everyone) --- */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <KeyRound className="w-5 h-5 mr-2 text-pizarro-blue-600"/>
                    Cambiar mi Contraseña
                </h3>
                 <Message message={passwordChangeError} type="error" />
                 <Message message={passwordChangeSuccess} type="success" />
                <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                        <input type="password" value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} className={inputClasses} placeholder="Mínimo 6 caracteres"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
                        <input type="password" value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} className={inputClasses}/>
                    </div>
                    <div>
                        <button type="submit" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pizarro-blue-600 hover:bg-pizarro-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pizarro-blue-500">
                            Actualizar Contraseña
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserManagementPanel;
