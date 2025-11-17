// contexts/PostsContext.tsx
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Post } from '../types';
import { postService } from '../services/api';

interface PostsContextType {
  posts: Post[];
  setPosts: (posts: Post[]) => void;
  updatePostComments: (postId: string, commentsCount: number) => void;
  updatePostLikes: (postId: string, likesCount: number, liked: boolean) => void;
  refreshPosts: () => Promise<void>;
  loading: boolean;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const PostsProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  const updatePostComments = useCallback((postId: string, commentsCount: number) => {
    console.log('📝 Atualizando contador de comentários para post:', postId, 'count:', commentsCount);
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, comments_count: commentsCount }
          : post
      )
    );
  }, []);

  const updatePostLikes = useCallback((postId: string, likesCount: number, liked: boolean) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              likes_count: likesCount,
              liked_by_auth_user: liked
            }
          : post
      )
    );
  }, []);

 const refreshPosts = useCallback(async () => {
  try {
    setLoading(true);
    const postsData = await postService.getAll();
    
    console.log('🎯 DADOS RECEBIDOS DA API - Posts:', postsData.length);
    
    // NORMALIZAR OS DADOS - garantir que todos os campos existam
    const normalizedPosts = postsData.map(post => ({
      ...post,
      comments_count: post.comments_count || 0,
      likes_count: post.likes_count || 0,
      liked_by_auth_user: post.liked_by_auth_user || false,
      comments: post.comments || []
    }));
    
    if (normalizedPosts.length > 0) {
      console.log('📊 Primeiro post normalizado:', {
        id: normalizedPosts[0].id,
        comments_count: normalizedPosts[0].comments_count,
        likes_count: normalizedPosts[0].likes_count,
        liked_by_auth_user: normalizedPosts[0].liked_by_auth_user
      });
    }
    
    setPosts(normalizedPosts);
  } catch (error) {
    console.error('Error loading posts:', error);
  } finally {
    setLoading(false);
  }
}, []);

  const value: PostsContextType = {
    posts,
    setPosts,
    updatePostComments,
    updatePostLikes,
    refreshPosts,
    loading
  };

  return (
    <PostsContext.Provider value={value}>
      {children}
    </PostsContext.Provider>
  );
};

export const usePosts = () => {
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
};