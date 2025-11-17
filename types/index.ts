export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string | null;
  bio?: string;
}

export interface Post {
  content: any;
  id: string;
  user_id: string;
  photo: string;
  caption: string;
  created_at: string;
  user?: User;
  username?: string;
  avatar?: string | null;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
  liked_by_auth_user?: boolean; 
  comments?: Comment[];
}

export interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  text: string;
  created_at: string;
  user?: User;
  username?: string;
  avatar?: string | null;
  likes_count?: number;
  is_liked?: boolean;
  liked_by_auth_user?: boolean; 
  replies?: Reply[];
  replies_count?: number;
}

export interface Reply {
  id: string;
  comment_id: string;
  user_id: string;
  text: string;
  created_at: string;
  user?: User;
  username?: string;
  avatar?: string | null;
  likes_count?: number;
  liked_by_auth_user?: boolean; 
}


export interface CreateCommentData {
  user_id: string;
  post_id: string;
  text: string;
}

export interface CreateReplyData {
  comment_id: string;
  text: string;
}

export interface AuthResponse {
  status: number;
  message: string;
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data?: T;
}