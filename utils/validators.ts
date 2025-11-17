export const validators = {
  email: (email: string): { isValid: boolean; message?: string } => {
    if (!email) {
      return { isValid: false, message: 'Email é obrigatório' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, message: 'Digite um email válido' };
    }

    return { isValid: true };
  },

  username: (username: string): { isValid: boolean; message?: string } => {
    if (!username) {
      return { isValid: false, message: 'Nome de usuário é obrigatório' };
    }

    if (username.length < 3) {
      return { isValid: false, message: 'Nome de usuário deve ter pelo menos 3 caracteres' };
    }

    if (username.length > 20) {
      return { isValid: false, message: 'Nome de usuário deve ter no máximo 20 caracteres' };
    }

    const usernameRegex = /^[a-zA-Z0-9_.]+$/;
    if (!usernameRegex.test(username)) {
      return { isValid: false, message: 'Nome de usuário só pode conter letras, números, . e _' };
    }

    return { isValid: true };
  },

  password: (password: string): { isValid: boolean; message?: string } => {
    if (!password) {
      return { isValid: false, message: 'Senha é obrigatória' };
    }

    if (password.length < 6) {
      return { isValid: false, message: 'Senha deve ter pelo menos 6 caracteres' };
    }

    if (password.length > 50) {
      return { isValid: false, message: 'Senha deve ter no máximo 50 caracteres' };
    }

    // Verificar força da senha (opcional)
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;

    if (strength < 2) {
      return { 
        isValid: true, // Ainda é válida, mas mostramos um aviso
        message: 'Senha fraca. Recomendamos usar letras maiúsculas, minúsculas, números e caracteres especiais'
      };
    }

    return { isValid: true };
  },

  name: (name: string): { isValid: boolean; message?: string } => {
    if (!name) {
      return { isValid: false, message: 'Nome completo é obrigatório' };
    }

    if (name.length < 2) {
      return { isValid: false, message: 'Nome deve ter pelo menos 2 caracteres' };
    }

    if (name.length > 50) {
      return { isValid: false, message: 'Nome deve ter no máximo 50 caracteres' };
    }

    return { isValid: true };
  },

  bio: (bio: string): { isValid: boolean; message?: string } => {
    if (bio && bio.length > 150) {
      return { isValid: false, message: 'Bio deve ter no máximo 150 caracteres' };
    }

    return { isValid: true };
  },
};