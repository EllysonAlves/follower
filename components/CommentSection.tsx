import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Comment, Reply, CreateCommentData, CreateReplyData, Post } from '../types';
import { commentService, replyService, postService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toastService } from '../services/toast';
import { usePosts } from '../contexts/PostsContext';
import { EVENTS, eventService } from '@/services/eventService';

interface CommentSectionProps {
    postId: string;
    onClose?: () => void;
    onCommentAdded?: () => void; // Callback opcional para atualização externa
}

export default function CommentSection({ postId, onClose, onCommentAdded }: CommentSectionProps) {
    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<{ commentId: string; username: string } | null>(null);
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [likingCommentId, setLikingCommentId] = useState<string | null>(null);
    const { user } = useAuth();
    const { updatePostComments } = usePosts(); // Usando o contexto de posts

    useEffect(() => {
        loadPostWithComments();
    }, [postId]);

    const loadPostWithComments = async () => {
        try {
            setLoading(true);
            const postData = await postService.getOne(postId);
            setPost(postData);
            setComments(postData.comments || []);
        } catch (error) {
            console.error('Erro ao carregar post com comentários:', error);
            toastService.error('Não foi possível carregar os comentários');
            setComments([]);
        } finally {
            setLoading(false);
        }
    };

    const updateCommentCount = async () => {
        try {
            // Buscar o post atualizado para pegar o contador correto
            const updatedPost = await postService.getOne(postId);

            // Atualizar no contexto global
            updatePostComments(postId, updatedPost.comments_count || 0);

            // Chamar callback externo se existir
            if (onCommentAdded) {
                onCommentAdded();
            }
        } catch (error) {
            console.error('Erro ao atualizar contador de comentários:', error);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !user) return;

        setSubmitting(true);
        try {
            const commentData: CreateCommentData = {
                user_id: user.id,
                post_id: postId,
                text: newComment.trim()
            };

            console.log('📤 Enviando comentário...');
            await commentService.create(commentData);
            setNewComment('');
            toastService.success('Comentário adicionado!');

            console.log('✅ Comentário enviado, recarregando comentários...');
            await loadPostWithComments();

            console.log('🚀 Emitindo eventos de atualização...');
            eventService.emit(EVENTS.COMMENT_ADDED, { postId });
            eventService.emit(EVENTS.POST_UPDATED, { postId });

        } catch (error) {
            console.error('Erro ao adicionar comentário:', error);
            toastService.error('Não foi possível adicionar o comentário');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddReply = async (commentId: string) => {
        if (!replyText.trim() || !user) return;

        setSubmitting(true);
        try {
            const replyData: CreateReplyData = {
                comment_id: commentId,
                text: replyText.trim()
            };

            console.log('📤 Enviando resposta...');
            await replyService.create(replyData);
            setReplyText('');
            setReplyingTo(null);
            toastService.success('Resposta adicionada!');

            console.log('✅ Resposta enviada, recarregando comentários...');
            await loadPostWithComments();

            // Delay antes de emitir eventos
            setTimeout(() => {
                console.log('🚀 Emitindo eventos de atualização...');
                eventService.emit(EVENTS.COMMENT_ADDED, { postId });
                eventService.emit(EVENTS.POST_UPDATED, { postId });
            }, 500);

        } catch (error) {
            console.error('Erro ao adicionar resposta:', error);
            toastService.error('Não foi possível adicionar a resposta');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLikeComment = async (commentId: string) => {
        if (!user || likingCommentId) return;

        setLikingCommentId(commentId);

        try {
            const comment = comments.find(c => c.id === commentId);
            if (!comment) return;

            const currentIsLiked = comment.liked_by_auth_user || false;
            const currentLikesCount = comment.likes_count || 0;

            console.log(`❤️ Tentando ${currentIsLiked ? 'unlike' : 'like'} no comentário ${commentId}`);

            // Atualização otimista IMEDIATA
            setComments(prevComments =>
                prevComments.map(comment =>
                    comment.id === commentId
                        ? {
                            ...comment,
                            liked_by_auth_user: !currentIsLiked,
                            likes_count: currentLikesCount + (currentIsLiked ? -1 : 1)
                        }
                        : comment
                )
            );

            // Fazer a requisição para a API
            if (currentIsLiked) {
                await commentService.unlike(commentId);
                console.log('✅ Unlike realizado com sucesso');
            } else {
                await commentService.like(commentId);
                console.log('✅ Like realizado com sucesso');
            }

            // Recarregar para sincronizar com a API
            await loadPostWithComments();

        } catch (error: any) {
            console.error('❌ Erro ao curtir comentário:', error.response?.data || error.message);

            // Reverter a atualização otimista em caso de erro
            await loadPostWithComments();

            if (error.response?.status === 409) {
                toastService.info('Você já curtiu este comentário');
            } else {
                toastService.error('Não foi possível curtir o comentário');
            }
        } finally {
            setLikingCommentId(null);
        }
    };

    const handleLikeReply = async (replyId: string, commentId: string) => {
        if (!user || likingCommentId) return;

        setLikingCommentId(replyId);

        try {
            // Encontrar o comentário e a reply
            const comment = comments.find(c => c.id === commentId);
            const reply = comment?.replies?.find(r => r.id === replyId);

            if (!comment || !reply) return;

            const currentIsLiked = reply.liked_by_auth_user || false;
            const currentLikesCount = reply.likes_count || 0;

            console.log(`❤️ Tentando ${currentIsLiked ? 'unlike' : 'like'} na resposta ${replyId}`);

            // Atualização otimista IMEDIATA
            setComments(prevComments =>
                prevComments.map(comment =>
                    comment.id === commentId
                        ? {
                            ...comment,
                            replies: comment.replies?.map(reply =>
                                reply.id === replyId
                                    ? {
                                        ...reply,
                                        liked_by_auth_user: !currentIsLiked,
                                        likes_count: currentLikesCount + (currentIsLiked ? -1 : 1)
                                    }
                                    : reply
                            )
                        }
                        : comment
                )
            );

            // Fazer a requisição para a API (usando o mesmo serviço de comentários)
            if (currentIsLiked) {
                await commentService.unlike(replyId);
                console.log('✅ Unlike na resposta realizado com sucesso');
            } else {
                await commentService.like(replyId);
                console.log('✅ Like na resposta realizado com sucesso');
            }

            // Recarregar para sincronizar com a API
            await loadPostWithComments();

        } catch (error: any) {
            console.error('❌ Erro ao curtir resposta:', error.response?.data || error.message);

            // Reverter a atualização otimista em caso de erro
            await loadPostWithComments();

            if (error.response?.status === 409) {
                toastService.info('Você já curtiu esta resposta');
            } else {
                toastService.error('Não foi possível curtir a resposta');
            }
        } finally {
            setLikingCommentId(null);
        }
    };

    const renderReply = (reply: Reply, commentId: string) => {
        const likesCount = reply.likes_count || 0;

        return (
            <View key={reply.id} style={styles.replyContainer}>
                <View style={styles.replyHeader}>
                    <Text style={styles.replyUsername}>@{reply.username}</Text>
                    {/* <TouchableOpacity 
            style={styles.likeButton}
            onPress={() => handleLikeReply(reply.id, commentId)}
            disabled={likingCommentId === reply.id}
          >
            {likingCommentId === reply.id ? (
              <ActivityIndicator size={14} color="#666" />
            ) : (
              <>
                <Ionicons 
                  name={reply.liked_by_auth_user ? "heart" : "heart-outline"} 
                  size={14} 
                  color={reply.liked_by_auth_user ? "red" : "#666"} 
                />
                {likesCount > 0 && (
                  <Text style={styles.likesCount}>{likesCount}</Text>
                )}
              </>
            )}
          </TouchableOpacity> */}
                </View>
                <Text style={styles.replyText}>{reply.text}</Text>
                <Text style={styles.replyTime}>
                    {new Date(reply.created_at).toLocaleDateString('pt-BR')}
                </Text>
            </View>
        );
    };

    const renderComment = ({ item }: { item: Comment }) => {
        const likesCount = item.likes_count || 0;

        return (
            <View style={styles.commentContainer}>
                <View style={styles.commentHeader}>
                    <Text style={styles.commentUsername}>@{item.username}</Text>
                    <TouchableOpacity
                        style={styles.likeButton}
                        onPress={() => handleLikeComment(item.id)}
                        disabled={likingCommentId === item.id}
                    >
                        {likingCommentId === item.id ? (
                            <ActivityIndicator size={16} color="#666" />
                        ) : (
                            <>
                                <Ionicons
                                    name={item.liked_by_auth_user ? "heart" : "heart-outline"}
                                    size={16}
                                    color={item.liked_by_auth_user ? "red" : "#666"}
                                />
                                {likesCount > 0 && (
                                    <Text style={styles.likesCount}>{likesCount}</Text>
                                )}
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={styles.commentText}>{item.text}</Text>

                <View style={styles.commentFooter}>
                    <Text style={styles.commentTime}>
                        {new Date(item.created_at).toLocaleDateString('pt-BR')}
                    </Text>
                    <TouchableOpacity
                        style={styles.replyButton}
                        onPress={() => setReplyingTo({ commentId: item.id, username: item.username || 'usuário' })}
                    >
                        <Text style={styles.replyButtonText}>Responder</Text>
                    </TouchableOpacity>
                </View>

                {/* Replies */}
                {item.replies && item.replies.length > 0 && (
                    <View style={styles.repliesContainer}>
                        {item.replies.map(reply => renderReply(reply, item.id))}
                    </View>
                )}

                {/* Input de resposta */}
                {replyingTo?.commentId === item.id && (
                    <View style={styles.replyInputContainer}>
                        <TextInput
                            style={styles.replyInput}
                            placeholder={`Respondendo para @${replyingTo.username}...`}
                            value={replyText}
                            onChangeText={setReplyText}
                            multiline
                            maxLength={200}
                        />
                        <View style={styles.replyActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setReplyingTo(null);
                                    setReplyText('');
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.submitButton, !replyText.trim() && styles.submitButtonDisabled]}
                                onPress={() => handleAddReply(item.id)}
                                disabled={!replyText.trim() || submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Responder</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Comentários</Text>
                {onClose && (
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Lista de comentários */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Carregando comentários...</Text>
                </View>
            ) : (
                <FlatList
                    data={comments}
                    keyExtractor={(item) => item.id}
                    renderItem={renderComment}
                    contentContainerStyle={styles.commentsList}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
                            <Text style={styles.emptyStateText}>Nenhum comentário ainda</Text>
                            <Text style={styles.emptyStateSubtext}>Seja o primeiro a comentar!</Text>
                        </View>
                    }
                />
            )}

            {/* Input de novo comentário */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.commentInput}
                    placeholder="Adicione um comentário..."
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline
                    maxLength={500}
                    editable={!submitting}
                />
                <TouchableOpacity
                    style={[styles.sendButton, (!newComment.trim() || submitting) && styles.sendButtonDisabled]}
                    onPress={handleAddComment}
                    disabled={!newComment.trim() || submitting}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Ionicons name="send" size={20} color="white" />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
    },
    commentsList: {
        flexGrow: 1,
        padding: 15,
    },
    commentContainer: {
        backgroundColor: '#f8f8f8',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    commentUsername: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#333',
    },
    likeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    likesCount: {
        fontSize: 12,
        color: '#666',
    },
    commentText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 18,
        marginBottom: 8,
    },
    commentFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    commentTime: {
        fontSize: 12,
        color: '#999',
    },
    replyButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    replyButtonText: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '500',
    },
    repliesContainer: {
        marginTop: 10,
        marginLeft: 10,
        borderLeftWidth: 2,
        borderLeftColor: '#e0e0e0',
        paddingLeft: 10,
    },
    replyContainer: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 10,
        marginBottom: 8,
    },
    replyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    replyUsername: {
        fontWeight: 'bold',
        fontSize: 13,
        color: '#333',
    },
    replyText: {
        fontSize: 13,
        color: '#333',
        lineHeight: 16,
        marginBottom: 4,
    },
    replyTime: {
        fontSize: 11,
        color: '#999',
    },
    replyInputContainer: {
        marginTop: 10,
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    replyInput: {
        fontSize: 14,
        padding: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        marginBottom: 10,
        minHeight: 40,
    },
    replyActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    cancelButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 14,
    },
    submitButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 6,
    },
    submitButtonDisabled: {
        backgroundColor: '#ccc',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: 'white',
    },
    commentInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginRight: 10,
        maxHeight: 100,
        textAlignVertical: 'center',
    },
    sendButton: {
        backgroundColor: '#007AFF',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#ccc',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyStateText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 10,
        marginBottom: 5,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
});