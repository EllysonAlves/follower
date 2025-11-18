import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import { userService } from '../services/api';
import { toastService } from '../services/toast';

export default function Following() {
  const { userId } = useLocalSearchParams();
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingStatus, setFollowingStatus] = useState<Set<string>>(new Set());
  const [loadingFollow, setLoadingFollow] = useState<string | null>(null);
  const { user: currentUser } = useAuth();
  const router = useRouter();

  const targetUserId = typeof userId === 'string' ? userId : Array.isArray(userId) ? userId[0] : '';

  useEffect(() => {
    loadFollowing();
  }, [targetUserId]);

  const loadFollowing = async () => {
    try {
      if (targetUserId) {
        const followingData = await userService.getFollowing(targetUserId);
        setFollowing(followingData);
        
        
        await loadFollowStatus();
      }
    } catch (error) {
      console.error('Erro ao carregar seguindo:', error);
      toastService.error('Não foi possível carregar os usuários seguidos');
    } finally {
      setLoading(false);
    }
  };

  const loadFollowStatus = async () => {
    try {
      if (currentUser) {
        const followingList = await userService.getFollowing(currentUser.id);
        const followingSet = new Set(followingList.map(user => user.id));
        setFollowingStatus(followingSet);
      }
    } catch (error) {
      console.error('Erro ao carregar status de follow:', error);
    }
  };

  const handleFollow = async (userId: string) => {
    if (loadingFollow) return;
    
    setLoadingFollow(userId);
    try {
      if (followingStatus.has(userId)) {
       
        await userService.unfollow(userId);
        setFollowingStatus(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        toastService.success('Deixou de seguir');
      } else {
        
        await userService.follow(userId);
        setFollowingStatus(prev => new Set(prev).add(userId));
        toastService.success('Seguindo');
      }
    } catch (error: any) {
      console.error('Erro ao seguir/desseguir:', error);
      const message = followingStatus.has(userId) 
        ? 'Erro ao deixar de seguir' 
        : 'Erro ao seguir usuário';
      toastService.error(message);
    } finally {
      setLoadingFollow(null);
    }
  };

  const navigateToUser = (userId: string) => {
    router.push({
      pathname: '/user/[id]',
      params: { id: userId }
    });
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const isFollowing = followingStatus.has(item.id);
    const isLoading = loadingFollow === item.id;
    const isOwnProfile = currentUser && item.id === currentUser.id;

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => navigateToUser(item.id)}
      >
        <View style={styles.userInfo}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {item.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userUsername}>@{item.username}</Text>
          </View>
        </View>
        
        {!isOwnProfile && currentUser && (
          <TouchableOpacity 
            style={[
              styles.followButton,
              isFollowing ? styles.unfollowButton : styles.followButtonActive
            ]}
            onPress={() => handleFollow(item.id)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={isFollowing ? "#666" : "white"} />
            ) : (
              <Text style={[
                styles.followButtonText,
                isFollowing ? styles.unfollowButtonText : styles.followButtonTextActive
              ]}>
                {isFollowing ? 'Seguindo' : 'Seguir'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Seguindo' }} />
      
      <FlatList
        data={following}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Não está seguindo ninguém</Text>
            <Text style={styles.emptyStateSubtext}>
              Quando este usuário seguir alguém, aparecerá aqui.
            </Text>
          </View>
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
  },
  listContent: {
    padding: 10,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  avatarPlaceholder: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    color: '#666',
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 15,
    minWidth: 100,
    alignItems: 'center',
  },
  followButtonActive: {
    backgroundColor: '#007AFF',
  },
  unfollowButton: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  followButtonTextActive: {
    color: 'white',
  },
  unfollowButtonText: {
    color: '#666',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
});