import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/authContext';

export default function LoginScreen() {
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  const validate = (): boolean => {
    const newErrors: { username?: string; password?: string } = {};
    if (!username.trim()) newErrors.username = 'Ingresá tu usuario';
    if (!password) newErrors.password = 'Ingresá tu contraseña';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await login({ username: username.trim(), password, rememberMe });
    } catch (error: unknown) {
      console.error('Login error', error);
      const message =
      error instanceof Error ? error.message : 'Ocurrió un error. Intentá de nuevo.';
      setErrors((prev) => ({ ...prev, password: message }));
      Alert.alert('Error al iniciar sesión', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/safeli.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.title}>¡Bienvenido/a!</Text>

        {/* Username */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, errors.username ? styles.inputError : null]}
            placeholder="Usuario"
            placeholderTextColor="#A0AEC0"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}
        </View>

        {/* Password */}
        <View style={styles.inputWrapper}>
          <View style={[styles.passwordContainer, errors.password ? styles.inputError : null]}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Contraseña"
              placeholderTextColor="#A0AEC0"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword((prev) => !prev)}
              style={styles.eyeButton}
              accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {/* <FontAwesome6
                name={showPassword ? 'eye' : 'eye-slash'}
                size={18}
                color="#4A5568"
              /> */}
              <Text style={styles.eyeText}>
                {showPassword ? '🙈' : '👁️'}
              </Text>
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
        </View>

        {/* Forgot password */}
        <TouchableOpacity
          onPress={() => router.push('/forgot-password')}
          style={styles.forgotButton}
        >
          <Text style={styles.forgotText}>¿Te olvidaste la contraseña?</Text>
        </TouchableOpacity>

        {/* Remember me */}
        <TouchableOpacity
          style={styles.rememberMeRow}
          onPress={() => setRememberMe((prev) => !prev)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
            {rememberMe && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.rememberMeText}>Mantenerme iniciado/a</Text>
        </TouchableOpacity>

        {/* Login button */}
        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
          )}
        </TouchableOpacity>

        {/* Sign up link */}
        <View style={styles.signUpRow}>
          <Text style={styles.signUpPrompt}>¿Todavía no tenés una cuenta? </Text>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text style={styles.signUpLink}>Registrate</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer bar */}
      <View style={styles.footer} />
    </ScrollView>
  );
}

const SAFELI_BLUE = '#1A3FA8';
const SAFELI_LIGHT_BLUE = '#D6E4F7';

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F5F8FF',
  },
  header: {
    backgroundColor: SAFELI_BLUE,
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 60,
  },
  body: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 28,
  },
  inputWrapper: {
    marginBottom: 14,
  },
  input: {
    backgroundColor: SAFELI_LIGHT_BLUE,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: '#1A202C',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#E53E3E',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SAFELI_LIGHT_BLUE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: '#1A202C',
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  eyeText: {
    fontSize: 18,
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  forgotButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  forgotText: {
    color: SAFELI_BLUE,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: SAFELI_BLUE,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: SAFELI_BLUE,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  rememberMeText: {
    fontSize: 14,
    color: '#4A5568',
  },
  primaryButton: {
    backgroundColor: SAFELI_BLUE,
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: SAFELI_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpPrompt: {
    color: '#4A5568',
    fontSize: 14,
  },
  signUpLink: {
    color: SAFELI_BLUE,
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  footer: {
    backgroundColor: SAFELI_BLUE,
    height: 12,
  },
});