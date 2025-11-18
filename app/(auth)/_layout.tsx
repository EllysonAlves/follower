import { Stack } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Redirect } from 'expo-router';
import { useEffect } from 'react';

export default function AuthLayout() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    console.log('🔄 AuthLayout - Estado atualizado:', { 
      user: user ? `Logado como ${user.name}` : 'Não logado', 
      isLoading 
    });
  }, [user, isLoading]);

  console.log('🔄 AuthLayout - Render:', { 
    user: user ? `Logado como ${user.name}` : 'Não logado', 
    isLoading 
  });

  if (!isLoading && user) {
    console.log('➡️ Redirecionando para tabs...');
    return <Redirect href="/(tabs)" />;
  }

  console.log('👥 Permanece na tela de auth');

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}