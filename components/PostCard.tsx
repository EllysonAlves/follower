import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../types';
import { postService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import CommentSection from './CommentSection';
import { toastService } from '../services/toast';
import { usePosts } from '../contexts/PostsContext';

interface PostCardProps {
    post: Post;
    onPostDeleted?: (postId: string) => void;
}

export default function PostCard({ post, onPostDeleted }: PostCardProps) {
    const [isLiking, setIsLiking] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { user } = useAuth();
    const router = useRouter();
    const { updatePostLikes, updatePostComments } = usePosts();

    // CÁLCULO ROBUSTO DO comments_count
    const calculateCommentsCount = () => {
        // Prioridade 1: comments_count direto da API
        if (post.comments_count !== undefined && post.comments_count !== null) {
            return post.comments_count;
        }
        
        // Prioridade 2: contar os comentários do array
        if (post.comments && post.comments.length > 0) {
            return post.comments.length;
        }
        
        // Prioridade 3: valor padrão
        return 0;
    };

    const calculateLikesCount = () => {
        return post.likes_count || 0;
    };

    const calculateIsLiked = () => {
        return post.liked_by_auth_user || false;
    };

    // Valores calculados - SEMPRE consistentes
    const commentsCount = calculateCommentsCount();
    const likesCount = calculateLikesCount();
    const isLiked = calculateIsLiked();

    // DEBUG: Verificar a consistência dos dados
    useEffect(() => {
        console.log(`🔄 PostCard ${post.id} - Dados calculados:`, {
            comments_count_original: post.comments_count,
            comments_count_calculado: commentsCount,
            comments_array_length: post.comments?.length,
            likes_count: likesCount,
            is_liked: isLiked,
            tem_comments_count: 'comments_count' in post,
            estrutura: Object.keys(post)
        });
    }, [post, commentsCount, likesCount, isLiked]);

    const handleLike = async () => {
        if (isLiking) return;

        setIsLiking(true);
        try {
            console.log('🔍 Estado atual do like:', {
                liked_by_auth_user: isLiked,
                likes_count: likesCount
            });

            // Atualização otimista NO CONTEXTO
            updatePostLikes(
                post.id, 
                likesCount + (isLiked ? -1 : 1), 
                !isLiked
            );

            // Fazer a requisição para a API
            if (isLiked) {
                console.log('🔄 Fazendo unlike...');
                await postService.unlike(post.id);
            } else {
                console.log('🔄 Fazendo like...');
                await postService.like(post.id);
            }

            console.log('✅ Like realizado com sucesso');

        } catch (error: any) {
            console.error('❌ Erro ao curtir post:', error);
            
            // Reverter a atualização otimista em caso de erro
            const originalPost = await postService.getOne(post.id);
            updatePostLikes(
                post.id, 
                originalPost.likes_count || 0, 
                originalPost.liked_by_auth_user || false
            );

            if (error.response?.status === 409) {
                toastService.info('Você já curtiu este post');
            } else {
                toastService.error('Não foi possível curtir o post');
            }
        } finally {
            setIsLiking(false);
        }
    };

    const navigateToUser = () => {
        if (post.user_id) {
            router.push({
                pathname: '/user/[id]',
                params: { id: post.user_id }
            });
        }
    };

    const handleDeletePost = async () => {
        setIsDeleting(true);
        try {
            await postService.delete(post.id);
            toastService.success('Post deletado com sucesso');
            setShowDeleteModal(false);
            
            if (onPostDeleted) {
                onPostDeleted(post.id);
            }
        } catch (error) {
            console.error('Erro ao deletar post:', error);
            toastService.error('Erro ao deletar o post');
        } finally {
            setIsDeleting(false);
        }
    };

    const openDeleteModal = () => {
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        if (!isDeleting) {
            setShowDeleteModal(false);
        }
    };

    return (
        <>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.userInfo}
                        onPress={navigateToUser}
                    >
                        {post.user?.avatar ? (
                            <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                <Text style={styles.avatarText}>
                                    {post.user?.username?.charAt(0).toUpperCase() || 'U'}
                                </Text>
                            </View>
                        )}
                        <Text style={styles.username}>{post.user?.username}</Text>
                    </TouchableOpacity>

                    {user?.id === post.user_id && (
                        <TouchableOpacity onPress={openDeleteModal}>
                            <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
                        </TouchableOpacity>
                    )}
                </View>

                <Image source={{ uri: post.photo }} style={styles.image} />

                <View style={styles.actions}>
                    <TouchableOpacity onPress={handleLike} disabled={isLiking}>
                        {isLiking ? (
                            <ActivityIndicator size={24} color="#666" />
                        ) : (
                            <Ionicons
                                name={isLiked ? "heart" : "heart-outline"}
                                size={24}
                                color={isLiked ? "red" : "black"}
                            />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setShowComments(true)}>
                        <Ionicons name="chatbubble-outline" size={24} color="black" />
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.likes}>
                        {likesCount} curtida{likesCount !== 1 ? 's' : ''}
                    </Text>
                    <Text style={styles.caption}>
                        <Text style={styles.username}>{post.user?.username}</Text> {post.caption}
                    </Text>
                    <TouchableOpacity onPress={() => setShowComments(true)}>
                        <Text style={styles.comments}>
                            Ver todos os {commentsCount} comentário{commentsCount !== 1 ? 's' : ''}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Modal de Comentários */}
            <Modal
                visible={showComments}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowComments(false)}
            >
                <CommentSection
                    postId={post.id}
                    onClose={() => setShowComments(false)}
                />
            </Modal>

            {/* Modal de Deletar Post */}
            <Modal
                visible={showDeleteModal}
                transparent={true}
                animationType="fade"
                onRequestClose={closeDeleteModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.deleteModal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Deletar Post</Text>
                            <TouchableOpacity onPress={closeDeleteModal} disabled={isDeleting}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.modalContent}>
                            <Ionicons name="warning" size={48} color="#FF6B6B" style={styles.warningIcon} />
                            <Text style={styles.modalMessage}>
                                Tem certeza que deseja deletar este post?
                            </Text>
                            <Text style={styles.modalSubtext}>
                                Esta ação não pode ser desfeita.
                            </Text>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={closeDeleteModal}
                                disabled={isDeleting}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.deleteButton]}
                                onPress={handleDeletePost}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text style={styles.deleteButtonText}>Deletar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

// Os styles permanecem os mesmos...
const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        backgroundColor: 'white',
        borderRadius: 8,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 10,
    },
    avatarPlaceholder: {
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    username: {
        fontWeight: 'bold',
    },
    image: {
        width: '100%',
        height: 400,
    },
    actions: {
        flexDirection: 'row',
        padding: 10,
        gap: 15,
    },
    footer: {
        padding: 10,
        paddingTop: 0,
    },
    likes: {
        fontWeight: 'bold',
        marginBottom: 5,
    },
    caption: {
        marginBottom: 5,
        lineHeight: 18,
    },
    comments: {
        color: 'gray',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    deleteModal: {
        backgroundColor: 'white',
        borderRadius: 12,
        width: '100%',
        maxWidth: 400,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    modalContent: {
        padding: 24,
        alignItems: 'center',
    },
    warningIcon: {
        marginBottom: 16,
    },
    modalMessage: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: 8,
    },
    modalSubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    modalActions: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#f8f8f8',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    deleteButton: {
        backgroundColor: '#FF6B6B',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    deleteButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
});