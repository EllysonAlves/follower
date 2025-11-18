import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { User, Post } from '../../types';
import { userService, postService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toastService } from '../../services/toast';

export default function UserProfile() {
    const { id } = useLocalSearchParams();
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [userPosts, setUserPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loadingFollow, setLoadingFollow] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');

    const userId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
    const isOwnProfile = currentUser && userId === currentUser.id;

    useEffect(() => {
        loadUserData();
    }, [id]);

    const loadUserData = async () => {
        try {
            if (userId) {
                console.log('Carregando dados do perfil do usuário:', userId);
                
                const [userData, postsData, followersData, followingData] = await Promise.all([
                    userService.getOne(userId),
                    postService.getByUser(userId),
                    userService.getFollowers(userId),
                    userService.getFollowing(userId)
                ]);
                
                console.log('Dados carregados - Avatar info:', {
                    userId: userData.id,
                    username: userData.username,
                    avatar: userData.avatar,
                    temAvatar: !!userData.avatar,
                    avatarValido: userData.avatar && userData.avatar.startsWith('http')
                });
                
                setUser(userData);
                setUserPosts(postsData);
                setFollowersCount(followersData.length);
                setFollowingCount(followingData.length);

                if (currentUser && currentUser.id && !isOwnProfile) {
                    console.log('Verificando se usuário logado', currentUser.id, 'está seguindo perfil', userId);
                    
                    const followingList = await userService.getFollowing(currentUser.id);
                    console.log('Usuários que o logado segue:', followingList.map(u => ({id: u.id, name: u.name})));
                    
                    const isCurrentlyFollowing = followingList.some(followedUser => followedUser.id === userId);
                    console.log('Resultado da verificação:', isCurrentlyFollowing);
                    
                    setIsFollowing(isCurrentlyFollowing);
                } else {
                    setIsFollowing(false);
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
    };

    
    const renderAvatar = () => {
        if (!user) return null;

       
        if (user.avatar && user.avatar.startsWith('http')) {
            return (
                <Image 
                    source={{ uri: user.avatar }} 
                    style={styles.avatar}
                    onError={(e) => {
                        console.log(' Erro ao carregar avatar:', user.avatar);
                    }}
                />
            );
        }
        
      
        const initial = user.name?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() || 'U';
        return (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>{initial}</Text>
            </View>
        );
    };

    const handleFollow = async () => {
        if (!currentUser) {
            toastService.error('Você precisa estar logado para seguir usuários');
            return;
        }

        if (loadingFollow) return;
        
        setLoadingFollow(true);
        try {
            if (isFollowing) {
                console.log('Deixando de seguir usuário:', userId);
                await userService.unfollow(userId);
                setIsFollowing(false);
                setFollowersCount(prev => Math.max(0, prev - 1));
                toastService.success('Deixou de seguir');
            } else {
                console.log('Seguindo usuário:', userId);
                await userService.follow(userId);
                setIsFollowing(true);
                setFollowersCount(prev => prev + 1);
                toastService.success('Agora você está seguindo');
            }
        } catch (error: any) {
            console.error('Erro ao seguir/desseguir:', error);
            const message = isFollowing 
                ? 'Erro ao deixar de seguir' 
                : 'Erro ao seguir usuário';
            toastService.error(message);
        } finally {
            setLoadingFollow(false);
        }
    };

    const navigateToFollowers = () => {
        console.log('Navegando para seguidores do usuário:', userId);
        router.push({
            pathname: '/followers',
            params: { userId: userId }
        });
    };

    const navigateToFollowing = () => {
        console.log('Navegando para seguindo do usuário:', userId);
        router.push({
            pathname: '/followings',
            params: { userId: userId }
        });
    };

    const navigateToPost = (postId: string) => {
        router.push({
            pathname: '/post/[id]',
            params: { id: postId }
        });
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

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={{ marginTop: 10, textAlign: 'center' }}>Carregando perfil...</Text>
            </View>
        );
    }

    if (!user) {
        return (
            <View style={styles.container}>
                <Text style={{ textAlign: 'center', marginTop: 20 }}>Usuário não encontrado</Text>
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
                        {renderAvatar()}
                    </View>

                    <View style={styles.statsContainer}>
                        <View style={styles.stat}>
                            <Text style={styles.statNumber}>{userPosts.length}</Text>
                            <Text style={styles.statLabel}>Publicações</Text>
                        </View>
                        
                        <TouchableOpacity style={styles.stat} onPress={navigateToFollowers}>
                            <Text style={styles.statNumber}>{followersCount}</Text>
                            <Text style={styles.statLabel}>Seguidores</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.stat} onPress={navigateToFollowing}>
                            <Text style={styles.statNumber}>{followingCount}</Text>
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
                    {!isOwnProfile && currentUser && (
                        <TouchableOpacity 
                            style={[
                                styles.followButton,
                                isFollowing ? styles.unfollowButton : styles.followButtonActive
                            ]}
                            onPress={handleFollow}
                            disabled={loadingFollow}
                        >
                            {loadingFollow ? (
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
                    
                    {!isOwnProfile && currentUser && (
                        <TouchableOpacity style={styles.messageButton}>
                            <Text style={styles.messageButtonText}>Mensagem</Text>
                        </TouchableOpacity>
                    )}
                    
                    {isOwnProfile && (
                        <TouchableOpacity style={styles.editButton}>
                            <Text style={styles.editButtonText}>Editar Perfil</Text>
                        </TouchableOpacity>
                    )}
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
                {activeTab === 'posts' ? (
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
                                {user.name} ainda não compartilhou nenhuma foto
                            </Text>
                        </View>
                    )
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="bookmark-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyStateTitle}>Nenhum post salvo</Text>
                        <Text style={styles.emptyStateText}>
                            Posts salvos aparecerão aqui
                        </Text>
                    </View>
                )}
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingTop: 30,
        flex: 1,
        backgroundColor: 'white',
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
    followButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 40,
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
    messageButton: {
        flex: 1,
        backgroundColor: '#f8f8f8',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    messageButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    editButton: {
        flex: 1,
        backgroundColor: '#f8f8f8',
        paddingVertical: 10,
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
});