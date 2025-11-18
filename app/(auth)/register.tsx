import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { authService } from '../../services/api';
import { toastService } from '../../services/toast';
import { validators } from '../../utils/validators';
import { Ionicons } from '@expo/vector-icons';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    bio: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const validateField = (field: string, value: string) => {
    let validation;
    
    switch (field) {
      case 'name':
        validation = validators.name(value);
        break;
      case 'username':
        validation = validators.username(value);
        break;
      case 'email':
        validation = validators.email(value);
        break;
      case 'password':
        validation = validators.password(value);
        break;
      case 'bio':
        validation = validators.bio(value);
        break;
      default:
        return;
    }

    if (!validation.isValid && validation.message) {
      setErrors(prev => ({ ...prev, [field]: validation.message! }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    if (field === 'password' && validation.message && validation.isValid) {
      toastService.warning(validation.message, 'Senha fraca');
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    setTimeout(() => {
      validateField(field, value);
    }, 500);
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    const nameValidation = validators.name(formData.name);
    const usernameValidation = validators.username(formData.username);
    const emailValidation = validators.email(formData.email);
    const passwordValidation = validators.password(formData.password);
    const bioValidation = validators.bio(formData.bio);

    if (!nameValidation.isValid && nameValidation.message) {
      newErrors.name = nameValidation.message;
    }
    if (!usernameValidation.isValid && usernameValidation.message) {
      newErrors.username = usernameValidation.message;
    }
    if (!emailValidation.isValid && emailValidation.message) {
      newErrors.email = emailValidation.message;
    }
    if (!passwordValidation.isValid && passwordValidation.message) {
      newErrors.password = passwordValidation.message;
    }
    if (!bioValidation.isValid && bioValidation.message) {
      newErrors.bio = bioValidation.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      toastService.error('Corrija os erros antes de continuar', 'Formulário inválido');
      return;
    }

    setIsLoading(true);
    try {
      const registerData = new FormData();
      registerData.append('name', formData.name.trim());
      registerData.append('username', formData.username.trim().toLowerCase());
      registerData.append('email', formData.email.trim().toLowerCase());
      registerData.append('password', formData.password);
      if (formData.bio.trim()) {
        registerData.append('bio', formData.bio.trim());
      }

      await authService.register(registerData);
      toastService.success('Conta criada com sucesso!', 'Bem-vindo!');
      router.back();
    } catch (error: any) {
      console.error('Erro no registro:', error);
      
      let errorMessage = 'Erro ao criar conta';
      
      if (error.response) {

        if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Dados inválidos';
        } else if (error.response.status === 409) {
          errorMessage = 'Email ou nome de usuário já está em uso';
        } else if (error.response.status === 500) {
          errorMessage = 'Erro interno do servidor. Tente novamente.';
        } else {
          errorMessage = error.response.data?.message || `Erro ${error.response.status}`;
        }
      } else if (error.request) {
        errorMessage = 'Erro de conexão. Verifique sua internet.';
      }
      
      toastService.error(errorMessage, 'Erro no cadastro');
    } finally {
      setIsLoading(false);
    }
  };

  const getInputStyle = (field: string) => {
    if (errors[field]) {
      return [styles.input, styles.inputError];
    }
    return styles.input;
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Criar Conta</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={getInputStyle('name')}
          placeholder="Nome completo *"
          value={formData.name}
          onChangeText={(text) => handleFieldChange('name', text)}
          onBlur={() => validateField('name', formData.name)}
          editable={!isLoading}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={getInputStyle('username')}
          placeholder="Nome de usuário *"
          value={formData.username}
          onChangeText={(text) => handleFieldChange('username', text)}
          onBlur={() => validateField('username', formData.username)}
          autoCapitalize="none"
          editable={!isLoading}
        />
        {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={getInputStyle('email')}
          placeholder="Email *"
          value={formData.email}
          onChangeText={(text) => handleFieldChange('email', text)}
          onBlur={() => validateField('email', formData.email)}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isLoading}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[getInputStyle('password'), styles.passwordInput]}
            placeholder="Senha *"
            value={formData.password}
            onChangeText={(text) => handleFieldChange('password', text)}
            onBlur={() => validateField('password', formData.password)}
            secureTextEntry={!showPassword}
            editable={!isLoading}
          />
          <TouchableOpacity 
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons 
              name={showPassword ? "eye-off" : "eye"} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

        {formData.password.length > 0 && (
          <View style={styles.passwordTips}>
            <Text style={styles.tipsTitle}>Sua senha deve conter:</Text>
            <Text style={[
              styles.tip, 
              formData.password.length >= 6 && styles.tipValid
            ]}>
              ✓ Pelo menos 6 caracteres
            </Text>
            <Text style={[
              styles.tip,
              /[A-Z]/.test(formData.password) && styles.tipValid
            ]}>
              ✓ Letra maiúscula
            </Text>
            <Text style={[
              styles.tip,
              /[a-z]/.test(formData.password) && styles.tipValid
            ]}>
              ✓ Letra minúscula
            </Text>
            <Text style={[
              styles.tip,
              /\d/.test(formData.password) && styles.tipValid
            ]}>
              ✓ Número
            </Text>
            <Text style={[
              styles.tip,
              /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) && styles.tipValid
            ]}>
              ✓ Caractere especial
            </Text>
          </View>
        )}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[getInputStyle('bio'), styles.textArea]}
          placeholder="Bio (opcional)"
          value={formData.bio}
          onChangeText={(text) => handleFieldChange('bio', text)}
          onBlur={() => validateField('bio', formData.bio)}
          multiline
          numberOfLines={3}
          maxLength={150}
          editable={!isLoading}
        />
        {errors.bio && <Text style={styles.errorText}>{errors.bio}</Text>}
        <Text style={styles.charCount}>
          {formData.bio.length}/150 caracteres
        </Text>
      </View>

      <TouchableOpacity 
        style={[
          styles.button, 
          (isLoading || Object.keys(errors).length > 0) && styles.buttonDisabled
        ]} 
        onPress={handleRegister}
        disabled={isLoading || Object.keys(errors).length > 0}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Criar Conta</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => router.back()} 
        disabled={isLoading}
        style={styles.linkContainer}
      >
        <Text style={[styles.link, isLoading && styles.linkDisabled]}>
          Já tem conta? Faça login
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    backgroundColor: 'white',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF2F2',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    padding: 5,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  charCount: {
    textAlign: 'right',
    color: '#999',
    fontSize: 12,
    marginTop: 5,
  },
  passwordTips: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  tipsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  tip: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  tipValid: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkContainer: {
    alignItems: 'center',
  },
  link: {
    color: '#007AFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  linkDisabled: {
    color: '#ccc',
  },
});