import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { toastService } from '../../services/toast';

export default function Login() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login: authLogin, user } = useAuth();
  const router = useRouter();

  console.log('📱 Tela Login - Estado:', { user: user ? 'Logado' : 'Não logado' });

  const handleLogin = async () => {
    if (!login || !password) {
      toastService.error('Preencha todos os campos', 'Campos obrigatórios');
      return;
    }

    console.log('🔄 Iniciando processo de login...');
    setIsLoading(true);
    
    try {
      await authLogin(login, password);
      console.log('✅ Login finalizado na tela');
      toastService.success('Login realizado com sucesso!', 'Bem-vindo');
      
    } catch (error: any) {
      console.error('❌ Erro capturado na tela:', error);
      
      let errorMessage = 'Erro ao fazer login';
      let errorTitle = 'Erro no Login';
      
      if (error.response) {
        errorMessage = error.response.data?.messages.error || `Erro ${error.response.status}`;

        if (error.response.status === 401) {
          errorTitle = 'Credenciais inválidas';
          errorMessage = 'Email/senha incorretos. Verifique suas credenciais.';
        } else if (error.response.status === 404) {
          errorTitle = 'Usuário não encontrado';
          errorMessage = 'Verifique se o email ou username está correto.';
        } else if (error.response.status === 500) {
          errorTitle = 'Erro no servidor';
          errorMessage = 'Problema temporário. Tente novamente em alguns instantes.';
        }
        
        console.log('📊 Detalhes do erro:', error.response.data);
      } else if (error.request) {

        errorTitle = 'Problema de conexão';
        errorMessage = 'Verifique sua conexão com a internet e tente novamente.';
        console.log('🌐 Erro de rede:', error.request);
      } else {
 
        errorMessage = error.messages.error || 'Erro desconhecido ao tentar fazer login';
      }
      
      toastService.error(errorMessage, errorTitle);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToRegister = () => {
    router.push('/(auth)/register');
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/images/mensi.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    
      
      <TextInput
        style={styles.input}
        placeholder="Email ou nome de usuário"
        value={login}
        onChangeText={setLogin}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!isLoading}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isLoading}
      />
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Entrar</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={navigateToRegister} disabled={isLoading}>
        <Text style={[styles.link, isLoading && styles.linkDisabled]}>
          Não tem conta? Cadastre-se
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 300, 
    height: 300, 
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: 'white',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    color: '#007AFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  linkDisabled: {
    color: '#ccc',
  },
});