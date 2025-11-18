import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types';
import { authService } from '../services/api';

interface AuthContextData {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStoredAuth();
    }, []);

    const loadStoredAuth = async () => {
        try {
            console.log('🔍 Carregando autenticação armazenada...');
            const storedToken = await SecureStore.getItemAsync('token');
            console.log('📱 Token armazenado:', storedToken ? 'Encontrado' : 'Não encontrado');

            if (storedToken) {
                setToken(storedToken);
                
            }
        } catch (error) {
            console.error('❌ Error loading stored auth:', error);
        } finally {
            setIsLoading(false);
            console.log('✅ Auth loading finalizado');
        }
    };

    const login = async (login: string, password: string) => {
        console.log('🔐 Tentando login com:', login);
        try {
            const response = await authService.login(login, password);
            console.log('✅ Login bem-sucedido:', response);
            console.log('👤 User data:', response.user);
            console.log('🔑 Token:', response.token ? 'Recebido' : 'Não recebido');

           
            if (response.user) {
                setUser(response.user);
                setToken(response.token);

               
                const savedToken = await SecureStore.getItemAsync('token');
                console.log('💾 Token salvo no SecureStore:', savedToken ? 'Sim' : 'Não');
                console.log('🔄 Estado atualizado - User:', response.user.name);
            } else {
                console.error('❌ User não veio na resposta');
                throw new Error('Dados do usuário não recebidos');
            }
        } catch (error: any) {
            console.error('❌ Erro no login:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            console.log('🚪 Fazendo logout...');
            await authService.logout();
            setUser(null);
            setToken(null);
            console.log('✅ Logout realizado');
        } catch (error) {
            console.error('❌ Error during logout:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};