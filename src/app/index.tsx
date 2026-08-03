import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Path, Svg } from 'react-native-svg';
import { useAuth } from '../context/authContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const params = useLocalSearchParams<{ successMessage?: string | string[] }>();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  useEffect(() => {
    const message = Array.isArray(params.successMessage)
      ? params.successMessage[0]
      : params.successMessage;

    if (message) {
      setSuccessMessage(message);
    } else {
      setSuccessMessage(null);
    }
  }, [params.successMessage]);

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
        {successMessage ? (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerText}>{successMessage}</Text>
          </View>
        ) : null}

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
              {showPassword ? (
                <Svg width={20} height={20} viewBox="0 0 24 24">
                  <Path
                    d="M0 0h24v24H0z"
                    fill="none"
                  />
                  <Path
                    d="M12 9a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5a5 5 0 0 1 5-5a5 5 0 0 1 5 5a5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5"
                    fill="#1f2b99"
                  />
                </Svg>
              ) : (
                <Svg width={20} height={20} viewBox="0 0 16 16">
                  <Path d="M0 0h16v16H0z" fill="none" />
                  <Path
                    d="M8 11c-1.65 0-3-1.35-3-3s1.35-3 3-3s3 1.35 3 3s-1.35 3-3 3m0-5c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2"
                    fill="#1f2b99"
                  />
                  <Path
                    d="M8 13c-3.19 0-5.99-1.94-6.97-4.84a.44.44 0 0 1 0-.32C2.01 4.95 4.82 3 8 3s5.99 1.94 6.97 4.84c.04.1.04.22 0 .32C13.99 11.05 11.18 13 8 13M2.03 8c.89 2.4 3.27 4 5.97 4s5.07-1.6 5.97-4C13.08 5.6 10.7 4 8 4S2.93 5.6 2.03 8"
                    fill="#1f2b99"
                  />
                  <Path
                    d="M14 14.5a.47.47 0 0 1-.35-.15l-12-12c-.2-.2-.2-.51 0-.71s.51-.2.71 0l11.99 12.01c.2.2.2.51 0 .71c-.1.1-.23.15-.35.15Z"
                    fill="#1f2b99"
                  />
                </Svg>
              )}
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
  successBanner: {
    backgroundColor: '#E8F8EE',
    borderColor: '#2F855A',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  successBannerText: {
    color: '#2F855A',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
});