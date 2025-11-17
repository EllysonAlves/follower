import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { postService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function CreatePost() {
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à sua galeria para selecionar uma imagem.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à sua câmera para tirar uma foto.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleCreatePost = async () => {
    if (!image) {
      Alert.alert('Erro', 'Selecione uma imagem para publicar');
      return;
    }

    if (!caption.trim()) {
      Alert.alert('Erro', 'Adicione uma legenda para sua publicação');
      return;
    }

    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('caption', caption);

      // Adicionar a imagem
      const imageFile = {
        uri: image,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any;
      formData.append('photo', imageFile);

      await postService.create(formData);
      
      Alert.alert('Sucesso', 'Post criado com sucesso!');
      router.back();
    } catch (error: any) {
      console.error('Erro ao criar post:', error);
      Alert.alert('Erro', 'Não foi possível criar o post. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Criar Publicação</Text>

      <View style={styles.imageSection}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={64} color="#ccc" />
            <Text style={styles.placeholderText}>Nenhuma imagem selecionada</Text>
          </View>
        )}

        <View style={styles.imageButtons}>
          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            <Ionicons name="images-outline" size={20} color="#007AFF" />
            <Text style={styles.imageButtonText}>Galeria</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
            <Ionicons name="camera-outline" size={20} color="#007AFF" />
            <Text style={styles.imageButtonText}>Câmera</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TextInput
        style={styles.captionInput}
        placeholder="Adicione uma legenda..."
        value={caption}
        onChangeText={setCaption}
        multiline
        numberOfLines={4}
        maxLength={500}
        editable={!isLoading}
      />

      <Text style={styles.charCount}>{caption.length}/500</Text>

      <TouchableOpacity
        style={[styles.postButton, (!image || isLoading) && styles.postButtonDisabled]}
        onPress={handleCreatePost}
        disabled={!image || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.postButtonText}>Publicar</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  imageSection: {
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    marginBottom: 15,
  },
  imagePlaceholder: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: '#999',
    marginTop: 10,
    fontSize: 16,
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  imageButtonText: {
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '600',
  },
  captionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  charCount: {
    textAlign: 'right',
    color: '#999',
    marginBottom: 20,
  },
  postButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#ccc',
  },
  postButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});