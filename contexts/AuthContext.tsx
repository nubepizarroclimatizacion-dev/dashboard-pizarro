import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { User } from '../types';

// --- Mock User Data (simulates a database) ---
const initialUsers: User[] = [
  { id: 1, username: 'admin', password: 'adminpassword', role: 'admin' },
  { id: 2, username: 'lector', password: 'lectorpassword', role: 'reader' },
];

// --- Auth Context Shape ---
interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (username: string, password: string) => boolean;
  logout: () => void;
  updatePassword: (userId: number, newPassword: string) => boolean;
  updateUser: (user: User) => boolean;
  deleteUser: (userId: number) => { success: boolean, message?: string };
  addUser: (user: Omit<User, 'id'>) => { success: boolean, message?: string };
}

const AuthContext = createContext<AuthContextType | null>(null);

// --- Auth Provider Component ---
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const storedUsers = localStorage.getItem('users');
      return storedUsers ? JSON.parse(storedUsers) : initialUsers;
    } catch {
      return initialUsers;
    }
  });

  useEffect(() => {
    try {
        localStorage.setItem('users', JSON.stringify(users));
    } catch (error) {
        console.error("Failed to save users to local storage", error);
    }
  }, [users]);

  useEffect(() => {
    try {
        if (currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('currentUser');
        }
    } catch (error) {
        console.error("Failed to save current user to local storage", error);
    }
  }, [currentUser]);

  const login = useCallback((username: string, password: string): boolean => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      const { password, ...userToStore } = user;
      setCurrentUser(userToStore);
      return true;
    }
    return false;
  }, [users]);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const updatePassword = useCallback((userId: number, newPassword: string): boolean => {
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, password: newPassword } : u));
    return true;
  }, []);

  const updateUser = useCallback((updatedUser: User): boolean => {
    setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
    if(currentUser && currentUser.id === updatedUser.id) {
        const { password, ...userToStore } = updatedUser;
        setCurrentUser(userToStore);
    }
    return true;
  }, [currentUser]);

  const deleteUser = useCallback((userId: number): { success: boolean, message?: string } => {
    if (userId === currentUser?.id) {
        return { success: false, message: 'No puede eliminarse a sí mismo.' };
    }

    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) {
        return { success: false, message: 'Usuario no encontrado.' };
    }

    // Prevent deleting the last admin
    const adminUsers = users.filter(u => u.role === 'admin');
    if (userToDelete.role === 'admin' && adminUsers.length <= 1) {
        return { success: false, message: 'No se puede eliminar al último administrador.' };
    }

    setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
    return { success: true };
  }, [currentUser, users]);

  const addUser = useCallback((newUser: Omit<User, 'id'>): { success: boolean, message?: string } => {
    if (users.some(u => u.username === newUser.username)) {
      return { success: false, message: 'El nombre de usuario ya existe.' };
    }
    setUsers(prevUsers => [
      ...prevUsers,
      { ...newUser, id: Date.now() } // Simple unique ID generation
    ]);
    return { success: true };
  }, [users]);
  
  const value = useMemo(() => ({
    currentUser,
    users,
    login,
    logout,
    updatePassword,
    updateUser,
    deleteUser,
    addUser
  }), [currentUser, users, login, logout, updatePassword, updateUser, deleteUser, addUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- Custom Hook to use Auth Context ---
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
