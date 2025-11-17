import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../types';
import { postService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface UserPostCardProps {
  post: Post;
}

export default function UserPostCard({ post }: UserPostCardProps) {
  const [currentPost, setCurrentPost] = useState(post);
  const [isLiking, setIsLiking] = useState(false);
  const { user } = useAuth();

  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    try {
      if (currentPost.is_liked) {
        await postService.unlike(currentPost.id);
        setCurrentPost(prev => ({
          ...prev,
          is_liked: false,
          likes_count: (prev.likes_count || 1) - 1
        }));
      } else {
        await postService.like(currentPost.id);
        setCurrentPost(prev => ({
          ...prev,
          is_liked: true,
          likes_count: (prev.likes_count || 0) + 1
        }));
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível curtir o post');
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: post.photo }} style={styles.image} />
      
      <View style={styles.actions}>
        <TouchableOpacity onPress={handleLike} disabled={isLiking}>
          <Ionicons 
            name={currentPost.is_liked ? "heart" : "heart-outline"} 
            size={24} 
            color={currentPost.is_liked ? "red" : "black"} 
          />
        </TouchableOpacity>
        
        <View style={styles.likesContainer}>
          <Text style={styles.likesCount}>{currentPost.likes_count || 0}</Text>
          <Text style={styles.likesText}>curtidas</Text>
        </View>
      </View>

      {post.caption && (
        <Text style={styles.caption}>
          <Text style={styles.username}>{post.user?.username}</Text> {post.caption}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 300,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  likesCount: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  likesText: {
    fontSize: 14,
    color: '#666',
  },
  caption: {
    padding: 10,
    paddingTop: 0,
    fontSize: 14,
  },
  username: {
    fontWeight: 'bold',
  },
});