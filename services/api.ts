import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import {
    User,
    Post,
    Comment,
    Reply,
    AuthResponse,
    CreateCommentData,
    CreateReplyData
} from '../types';

const baseURL = 'https://apifollower.devotech.com.br';

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});


api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authService = {
    login: async (login: string, password: string): Promise<AuthResponse> => {
        const response = await api.post('/api/user/login', {
            login,
            password
        });

        if (response.data.token) {
            await SecureStore.setItemAsync('token', response.data.token);
        }
        return response.data;
    },

    logout: async (): Promise<void> => {
        await api.post('/api/user/logout');
        await SecureStore.deleteItemAsync('token');
    },

    register: async (formData: FormData): Promise<any> => {
        const response = await api.post('/api/user/create', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },


};

export const userService = {
    getAll: async (): Promise<User[]> => {
        const response = await api.get('/api/user');
        return response.data.data || response.data;
    },

    getOne: async (id: string): Promise<User> => {
        const response = await api.get(`/api/user/${id}`);
        return response.data.data || response.data;
    },

    update: async (id: string, formData: FormData): Promise<any> => {
        const response = await api.post(`/api/user/update/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    delete: async (id: string): Promise<any> => {
        const response = await api.delete(`/api/user/${id}`);
        return response.data;
    },

    search: async (username: string): Promise<User[]> => {
        const response = await api.get(`/api/user/search?username=${username}`);
        return response.data.data || response.data;
    },

    follow: async (userId: string): Promise<any> => {
    const response = await api.post(`/api/user/follow/${userId}`);
    return response.data;
  },

  unfollow: async (userId: string): Promise<any> => {
    const response = await api.post(`/api/user/unfollow/${userId}`);
    return response.data;
  },

  getFollowers: async (userId: string): Promise<User[]> => {
    const response = await api.get(`/api/user/followers/${userId}`);
    return response.data.data || response.data;
  },

  getFollowing: async (userId: string): Promise<User[]> => {
    const response = await api.get(`/api/user/following/${userId}`);
    return response.data.data || response.data;
  },

   getFollowStatus: async (userId: string): Promise<{ isFollowing: boolean }> => {
    try {
      
      const response = await api.get(`/api/user/follow-status/${userId}`);
      return response.data;
    } catch (error) {
      
      const following = await userService.getFollowing(userId);
      const currentUser = await SecureStore.getItemAsync('user');
      const currentUserId = currentUser ? JSON.parse(currentUser).id : null;
      
      const isFollowing = following.some(user => user.id === currentUserId);
      return { isFollowing };
    }
  }
};

export const postService = {
    create: async (formData: FormData): Promise<any> => {
        const response = await api.post('/api/posts', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    getAll: async (): Promise<Post[]> => {
        const timestamp = new Date().getTime();
        const response = await api.get(`/api/posts?t=${timestamp}`);
        console.log('📋 Estrutura completa dos posts da API:', JSON.stringify(response.data, null, 2));
        return response.data.data || response.data;
    },

    getOne: async (id: string): Promise<Post> => {
        const response = await api.get(`/api/posts/${id}`);
        return response.data.data || response.data;
    },

    getByUser: async (userId: string): Promise<Post[]> => {
        const response = await api.get(`/api/posts/user/${userId}`);
        return response.data.data || response.data;
    },

    delete: async (id: string): Promise<any> => {
        const response = await api.delete(`/api/posts/${id}`);
        return response.data;
    },

    like: async (postId: string): Promise<any> => {
        const response = await api.post('/api/post/like', { post_id: postId });
        return response.data;
    },

    unlike: async (postId: string): Promise<any> => {
        const response = await api.post('/api/post/unlike', { post_id: postId });
        return response.data;
    },
};

export const commentService = {
    create: async (commentData: CreateCommentData): Promise<any> => {
        const response = await api.post('/api/comments/create', commentData);
        return response.data;
    },

    delete: async (id: string): Promise<any> => {
        const response = await api.delete(`/api/comments/delete/${id}`);
        return response.data;
    },

    like: async (commentId: string): Promise<any> => {
        try {
            const response = await api.post('/api/comment/like', { comment_id: commentId });
            return response.data;
        } catch (error: any) {
            console.error('Erro ao curtir comentário:', error.response?.data);
            throw error;
        }
    },

    unlike: async (commentId: string): Promise<any> => {
        try {
            const response = await api.post('/api/comment/unlike', { comment_id: commentId });
            return response.data;
        } catch (error: any) {
            console.error('Erro ao descurtir comentário:', error.response?.data);
            throw error;
        }
    },

    
};

export const replyService = {
    create: async (replyData: CreateReplyData): Promise<any> => {
        const response = await api.post('/api/replies/create', replyData);
        return response.data;
    },

    delete: async (id: string): Promise<any> => {
        const response = await api.delete(`/api/replies/delete/${id}`);
        return response.data;
    },
};

export default api;