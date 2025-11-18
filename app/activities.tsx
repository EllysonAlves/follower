import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import { userService } from '../services/api';
import { toastService } from '../services/toast';
import { Ionicons } from '@expo/vector-icons';

type ActivityType = 'followed_you' | 'you_followed' | 'new_follower';

interface Activity {
  id: string;
  type: ActivityType;
  user: User;
  timestamp: string;
  read: boolean;
}

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user: currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      if (currentUser) {
    
        const [followers, following] = await Promise.all([
          userService.getFollowers(currentUser.id),
          userService.getFollowing(currentUser.id)
        ]);

        
        const activitiesData = generateActivities(followers, following);
        setActivities(activitiesData);
      }
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
      toastService.error('Não foi possível carregar as atividades');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateActivities = (followers: User[], following: User[]): Activity[] => {
    const activities: Activity[] = [];

   
    followers.forEach(follower => {
      activities.push({
        id: `follow_${follower.id}`,
        type: 'followed_you',
        user: follower,
        timestamp: new Date().toISOString(), 
        read: false
      });
    });

  
    following.forEach(followedUser => {
      activities.push({
        id: `following_${followedUser.id}`,
        type: 'you_followed',
        user: followedUser,
        timestamp: new Date().toISOString(),
        read: false
      });
    });

   
    return activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadActivities();
  };

  const navigateToUser = (userId: string) => {
    router.push({
      pathname: '/user/[id]',
      params: { id: userId }
    });
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'followed_you':
        return 'person-add';
      case 'you_followed':
        return 'person';
      case 'new_follower':
        return 'heart';
      default:
        return 'notifications';
    }
  };

  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case 'followed_you':
        return '#007AFF';
      case 'you_followed':
        return '#34C759';
      case 'new_follower':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getActivityText = (type: ActivityType, userName: string) => {
    switch (type) {
      case 'followed_you':
        return `${userName} começou a te seguir`;
      case 'you_followed':
        return `Você começou a seguir ${userName}`;
      case 'new_follower':
        return `${userName} é seu novo seguidor`;
      default:
        return 'Nova atividade';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Agora mesmo';
    } else if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    } else {
      return `${Math.floor(diffInHours / 24)}d atrás`;
    }
  };

  const renderActivityItem = ({ item }: { item: Activity }) => {
    return (
      <TouchableOpacity
        style={[
          styles.activityItem,
          !item.read && styles.unreadActivity
        ]}
        onPress={() => navigateToUser(item.user.id)}
      >
        <View style={styles.activityContent}>
          <View style={[styles.iconContainer, { backgroundColor: getActivityColor(item.type) }]}>
            <Ionicons name={getActivityIcon(item.type)} size={20} color="white" />
          </View>
          
          <View style={styles.activityInfo}>
            <View style={styles.userInfo}>
              {item.user.avatar ? (
                <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {item.user.name?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              <View style={styles.textContainer}>
                <Text style={styles.activityText}>
                  {getActivityText(item.type, item.user.name)}
                </Text>
                <Text style={styles.timestamp}>
                  {formatTime(item.timestamp)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando atividades...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Atividades' }} />
      
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={renderActivityItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off" size={64} color="#CCCCCC" />
            <Text style={styles.emptyStateText}>Nenhuma atividade</Text>
            <Text style={styles.emptyStateSubtext}>
              Suas atividades aparecerão aqui quando você tiver seguidores ou seguir alguém.
            </Text>
          </View>
        }
        ListHeaderComponent={
          activities.length > 0 ? (
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Atividades Recentes</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
    backgroundColor: 'white',
  },
  unreadActivity: {
    backgroundColor: '#F8FBFF',
  },
  activityContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
  },
  activityText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 13,
    color: '#666',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});