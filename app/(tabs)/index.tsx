// Feed.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import PostCard from '../../components/PostCard';
import { usePosts } from '../../contexts/PostsContext';
import { eventService, EVENTS } from '../../services/eventService';

export default function Feed() {
  const { posts, refreshPosts, loading } = usePosts();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    console.log('🔰 Feed montado - carregando posts iniciais');
    refreshPosts();
  }, []); 

  useEffect(() => {
    console.log('🎯 Configurando event listeners');

    const handlePostUpdated = ({ postId }: { postId: string }) => {
      console.log('🔄 Evento recebido: POST_UPDATED para', postId);

      setTimeout(() => {
        console.log('⏰ Refresh após evento');
        refreshPosts();
      }, 1000);
    };

    const handleCommentAdded = ({ postId }: { postId: string }) => {
      console.log('💬 Evento recebido: COMMENT_ADDED para', postId);

      setTimeout(() => {
        console.log('⏰ Refresh após comentário');
        refreshPosts();
      }, 1000);
    };

    eventService.on(EVENTS.POST_UPDATED, handlePostUpdated);
    eventService.on(EVENTS.COMMENT_ADDED, handleCommentAdded);

    return () => {
      console.log('🧹 Limpando event listeners');
      eventService.off(EVENTS.POST_UPDATED, handlePostUpdated);
      eventService.off(EVENTS.COMMENT_ADDED, handleCommentAdded);
    };
  }, [refreshPosts]); 

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshPosts();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          if (!item.comments_count && item.comments_count !== 0) {
            console.warn('❌ Post com comments_count inválido:', item.id, item);
          }
          return <PostCard post={item} />;
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loading}
            onRefresh={onRefresh}
          />
        }
        contentContainerStyle={styles.listContent}
        extraData={posts} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
});