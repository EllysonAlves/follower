import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { User, Post } from '../../types';
import { userService, postService } from '../../services/api';
import UserPostCard from '../../components/UserPostCard';

export default function UserProfile() {
    const { id } = useLocalSearchParams();
    const [user, setUser] = useState<User | null>(null);
    const [userPosts, setUserPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUserData();
    }, [id]);

    const loadUserData = async () => {
        try {
            if (typeof id === 'string') {
                const [userData, postsData] = await Promise.all([
                    userService.getOne(id),
                    postService.getByUser(id)
                ]);
                setUser(userData);
                setUserPosts(postsData);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Carregando...</Text>
            </View>
        );
    }

    if (!user) {
        return (
            <View style={styles.container}>
                <Text>Usuário não encontrado</Text>
            </View>
        );
    }

    return (
        <>
            {/* Remove o header */}
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
                        <View style={styles.stat}>
                            <Text style={styles.statNumber}>0</Text>
                            <Text style={styles.statLabel}>Seguidores</Text>
                        </View>
                        <View style={styles.stat}>
                            <Text style={styles.statNumber}>0</Text>
                            <Text style={styles.statLabel}>Seguindo</Text>
                        </View>
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
                    <View style={styles.followButton}>
                        <Text style={styles.followButtonText}>Seguir</Text>
                    </View>
                    <View style={styles.messageButton}>
                        <Text style={styles.messageButtonText}>Mensagem</Text>
                    </View>
                </View>

                {/* Posts do usuário */}
                <View style={styles.postsSection}>
                    <Text style={styles.sectionTitle}>Publicações</Text>
                    {userPosts.map(post => (
                        <UserPostCard key={post.id} post={post} />
                    ))}
                    {userPosts.length === 0 && (
                        <View style={styles.noPosts}>
                            <Text style={styles.noPostsText}>Nenhum post ainda</Text>
                            <Text style={styles.noPostsSubtext}>
                                Quando {user.name} compartilhar fotos, elas aparecerão aqui.
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
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
        backgroundColor: '#007AFF',
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    followButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white',
    },
    messageButton: {
        flex: 1,
        backgroundColor: '#f8f8f8',
        paddingVertical: 8,
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
    postsSection: {
        padding: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    noPosts: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    noPostsText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 8,
    },
    noPostsSubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});