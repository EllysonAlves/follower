import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Post, User } from '../../types';
import { postService, userService } from '../../services/api';

export default function Profile() {
  const { user, logout } = useAuth();
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const router = useRouter();

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setStatsLoading(true);
      
      const [postsData, followersData, followingData] = await Promise.all([
        postService.getByUser(user!.id),
        userService.getFollowers(user!.id),
        userService.getFollowing(user!.id)
      ]);
      
      setUserPosts(postsData);
      setFollowers(followersData);
      setFollowing(followingData);
      
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      Alert.alert('Erro', 'Não foi possível carregar seus dados');
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Erro ao fazer logout:', error);
            }
          }
        }
      ]
    );
  };

  const navigateToEditProfile = () => {
    router.push('/profile/edit');
  };

  const navigateToPost = (postId: string) => {
    router.push({
      pathname: '/post/[id]',
      params: { id: postId }
    });
  };

  const navigateToFollowers = () => {
    if (user) {
      router.push({
        pathname: '/followers',
        params: { userId: user.id }
      });
    }
  };

  const navigateToFollowing = () => {
    if (user) {
      router.push({
        pathname: '/followings',
        params: { userId: user.id }
      });
    }
  };

  const renderPostItem = ({ item }: { item: Post }) => (
    <TouchableOpacity 
      style={styles.postItem}
      onPress={() => navigateToPost(item.id)}
    >
      <Image source={{ uri: item.photo }} style={styles.postImage} />
      <View style={styles.postOverlay}>
        <View style={styles.postStats}>
          <Ionicons name="heart" size={16} color="white" />
          <Text style={styles.postStatText}>{item.likes_count || 0}</Text>
          <Ionicons name="chatbubble" size={16} color="white" style={styles.statIcon} />
          <Text style={styles.postStatText}>{item.comments_count || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text>Usuário não carregado</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header do perfil */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {user.name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{userPosts.length}</Text>
              <Text style={styles.statLabel}>Publicações</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.stat}
              onPress={navigateToFollowers}
              disabled={statsLoading}
            >
              {statsLoading ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text style={styles.statNumber}>{followers.length}</Text>
              )}
              <Text style={styles.statLabel}>Seguidores</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.stat}
              onPress={navigateToFollowing}
              disabled={statsLoading}
            >
              {statsLoading ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text style={styles.statNumber}>{following.length}</Text>
              )}
              <Text style={styles.statLabel}>Seguindo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Informações do usuário */}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userUsername}>@{user.username}</Text>
          {user.bio && (
            <Text style={styles.userBio}>{user.bio}</Text>
          )}
        </View>

        {/* Botões de ação */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={navigateToEditProfile}
          >
            <Text style={styles.editButtonText}>Editar Perfil</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <Ionicons 
              name="grid" 
              size={24} 
              color={activeTab === 'posts' ? '#007AFF' : '#666'} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'saved' && styles.activeTab]}
            onPress={() => setActiveTab('saved')}
          >
            <Ionicons 
              name="bookmark" 
              size={24} 
              color={activeTab === 'saved' ? '#007AFF' : '#666'} 
            />
          </TouchableOpacity>
        </View>

        {/* Conteúdo das tabs */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Carregando posts...</Text>
          </View>
        ) : activeTab === 'posts' ? (
          userPosts.length > 0 ? (
            <View style={styles.postsGrid}>
              <FlatList
                data={userPosts}
                keyExtractor={(item) => item.id}
                renderItem={renderPostItem}
                numColumns={3}
                scrollEnabled={false}
                contentContainerStyle={styles.gridContent}
              />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="camera-outline" size={64} color="#ccc" />
              <Text style={styles.emptyStateTitle}>Nenhuma publicação</Text>
              <Text style={styles.emptyStateText}>
                Compartilhe suas primeiras fotos e vídeos
              </Text>
              <TouchableOpacity 
                style={styles.createPostButton}
                onPress={() => router.push('/post/create')}
              >
                <Text style={styles.createPostButtonText}>Criar primeira publicação</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>Nenhum post salvo</Text>
            <Text style={styles.emptyStateText}>
              Posts que você salvar aparecerão aqui
            </Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 50, 
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 10,
  },
  avatarContainer: {
    marginRight: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  userInfo: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  userBio: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  logoutButton: {
    padding: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  postsGrid: {
    padding: 1,
  },
  gridContent: {
    padding: 0.5,
  },
  postItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 0.5,
    backgroundColor: '#f8f8f8',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postStatText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  statIcon: {
    marginLeft: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  createPostButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createPostButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});