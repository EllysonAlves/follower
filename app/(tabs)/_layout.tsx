import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { Redirect } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (!isLoading && !user) {
    return <Redirect href="/(auth)/login" />;
  }

  const HeaderRight = () => (
    <View style={{ flexDirection: 'row', gap: 15, marginRight: 15 }}>
      <TouchableOpacity onPress={() => router.push('/post/create')}>
        <Ionicons name="add-circle-outline" size={24} color="black" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/activities')}>
        <Ionicons name="heart-outline" size={24} color="black" />
      </TouchableOpacity>
    </View>
  );

  return (
    <Tabs screenOptions={{ 
      headerShown: true,
      headerRight: HeaderRight
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Buscar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}