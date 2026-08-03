import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import { Path, Svg } from 'react-native-svg';
import { useAuth } from '../context/authContext';

interface FormFields {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  birthDate: Date | null;
  password: string;
  confirmPassword: string;
  nroTelefono: string;
  foto: any;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  birthDate?: string;
  password?: string;
  confirmPassword?: string;
  nroTelefono?: string;
}

export default function SignUpScreen() {
  const { signUp } = useAuth();

  const [form, setForm] = useState<FormFields>({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    birthDate: null,
    password: '',
    confirmPassword: '',
    nroTelefono: '',
    foto: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validatePhoneNumber = (value: string): string | undefined => {
    const trimmedValue = value.trim();

    if (!trimmedValue) return undefined;

    if (!/^\d{10}$/.test(trimmedValue)) {
      return 'Ingresá un número de celular válido de 10 numeros en formato 11xxxxxxxx';
    }

    return undefined;
  };

  const updateField = (field: keyof FormFields, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    if (field === 'nroTelefono') {
      setErrors((prev) => ({
        ...prev,
        nroTelefono: validatePhoneNumber(String(value)),
      }));
    } else if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const formatDate = (rawDate: Date) => {
    const day = rawDate.getDate().toString().padStart(2, '0');
    const month = (rawDate.getMonth() + 1).toString().padStart(2, '0');
    const year = rawDate.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!form.firstName.trim()) newErrors.firstName = 'Ingresá tu nombre';
    if (!form.lastName.trim()) newErrors.lastName = 'Ingresá tu apellido';
    if (!form.email.trim()) {
      newErrors.email = 'Ingresá tu email';
    } else if (!emailRegex.test(form.email)) {
      newErrors.email = 'El email no es válido';
    }
    if (!form.username.trim()) newErrors.username = 'Ingresá un nombre de usuario';
    if (!form.birthDate) {
      newErrors.birthDate = 'Seleccioná tu fecha de nacimiento';
    }
    if (!form.password) {
      newErrors.password = 'Ingresá una contraseña';
    } else if (!passwordRegex.test(form.password)) {
      newErrors.password = 'Mínimo 8 caracteres, una mayúscula, una minúscula y un número';
    }
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Confirmá tu contraseña';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    const phoneError = validatePhoneNumber(form.nroTelefono);
    if (phoneError) {
      newErrors.nroTelefono = phoneError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const parsedTelefono = form.nroTelefono.trim() ? parseInt(form.nroTelefono.trim(), 10) : undefined;
      const username = form.username.trim();

      console.log('SignUp submit', { username: form.username, email: form.email, foto: !!form.foto });

      const fotoValue = typeof form.foto === 'string' ? (form.foto.trim() ? form.foto.trim() : undefined) : form.foto ?? undefined;

      await signUp({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        username,
        birthDate: form.birthDate!.toISOString().split('T')[0], // YYYY-MM-DD
        password: form.password,
        nroTelefono: parsedTelefono,
        foto: fotoValue,
      });

      const successMessage = `Tu cuenta se creó correctamente. Ya podés iniciar sesión con tu nombre de usuario "${username}".`;
      router.replace({ pathname: '/', params: { successMessage } });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Ocurrió un error. Intentá de nuevo.';
      // Alert.alert('Error al registrarse', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateConfirm = (d: Date) => {
    updateField('birthDate', d);
    setShowDatePicker(false);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Image
          source={require('../../assets/images/safeli.png')} // TODO: adjust path to your logo
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Form */}
      <View style={styles.body}>
        {/* Nombre */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, errors.firstName && styles.inputError]}
            placeholder="Nombre"
            placeholderTextColor="#A0AEC0"
            value={form.firstName}
            onChangeText={(t) => updateField('firstName', t)}
            autoCapitalize="words"
            autoComplete="off"
          />
          {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
        </View>

        {/* Apellido */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, errors.lastName && styles.inputError]}
            placeholder="Apellido"
            placeholderTextColor="#A0AEC0"
            value={form.lastName}
            onChangeText={(t) => updateField('lastName', t)}
            autoCapitalize="words"
            autoComplete="off"
          />
          {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}
        </View>

        {/* Mail */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="Mail"
            placeholderTextColor="#A0AEC0"
            value={form.email}
            onChangeText={(t) => updateField('email', t)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
          />
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
        </View>

        {/* Nombre de usuario */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, errors.username && styles.inputError]}
            placeholder="Nombre de usuario"
            placeholderTextColor="#A0AEC0"
            value={form.username}
            onChangeText={(t) => updateField('username', t)}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            textContentType="none"
            importantForAutofill="no"
          />
          {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}
        </View>

        {/* Teléfono (Opcional) */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, errors.nroTelefono && styles.inputError]}
            placeholder="Teléfono (Opcional)"
            placeholderTextColor="#A0AEC0"
            value={form.nroTelefono}
            onChangeText={(t) => updateField('nroTelefono', t)}
            keyboardType="number-pad"
            autoComplete="off"
          />
          {errors.nroTelefono ? <Text style={styles.errorText}>{errors.nroTelefono}</Text> : null}
        </View>

        {/* Foto (Opcional) - web: file input, native: URL/text fallback */}
        <View style={styles.inputWrapper}>
          {Platform.OS === 'web' ? (
            <div>
              <input
                type="file"
                accept="image/*"
                autoComplete="off"
                onChange={(e: any) => {
                  const file = e?.target?.files?.[0];
                  if (file) {
                    updateField('foto', file as any);
                  }
                }}
              />
              {form.foto && typeof form.foto !== 'string' ? (
                <Image
                  source={{ uri: URL.createObjectURL(form.foto as any) }}
                  style={{ width: 80, height: 80, marginTop: 8, borderRadius: 8 }}
                />
              ) : null}
            </div>
          ) : (
            <TextInput
              style={styles.input}
              placeholder="Foto de Perfil (Opcional), url o archivo"
              placeholderTextColor="#A0AEC0"
              value={String(form.foto ?? '')}
              onChangeText={(t) => updateField('foto', t)}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
            />
          )}
        </View>

        {/* Fecha de nacimiento */}
        <View style={styles.inputWrapper}>
          {Platform.OS === 'web' ? (
            <View style={styles.dateInput}>
              <input
                type="date"
                autoComplete="off"
                value={form.birthDate ? form.birthDate.toISOString().split('T')[0] : ''}
                onChange={(e: any) => {
                  const val = e?.target?.value;
                  if (val) {
                    const d = new Date(val + 'T00:00:00');
                    updateField('birthDate', d);
                  } else {
                    updateField('birthDate', null);
                  }
                }}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  fontSize: 15,
                  color: '#1A202C',
                }}
              />
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.dateInput, errors.birthDate && styles.inputError]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={form.birthDate ? styles.dateText : styles.datePlaceholder}>
                {form.birthDate ? formatDate(form.birthDate) : 'Fecha de nacimiento'}
              </Text>
            </TouchableOpacity>
          )}
          {errors.birthDate ? <Text style={styles.errorText}>{errors.birthDate}</Text> : null}
        </View>

        {/* Date Picker Modal (react-native-date-picker) for native platforms */}
        {Platform.OS !== 'web' && showDatePicker && (
          <DatePicker
            modal
            open={showDatePicker}
            date={form.birthDate ?? new Date(2000, 0, 1)}
            mode="date"
            maximumDate={new Date()}
            onConfirm={handleDateConfirm}
            onCancel={() => setShowDatePicker(false)}
            locale="es-AR"
          />
        )}

        {/* Contraseña */}
        <View style={styles.inputWrapper}>
          <View style={[styles.passwordContainer, errors.password && styles.inputError]}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Contraseña"
              placeholderTextColor="#A0AEC0"
              value={form.password}
              onChangeText={(t) => updateField('password', t)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              importantForAutofill="no"
            />
            <TouchableOpacity
              onPress={() => setShowPassword((p) => !p)}
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

        {/* Confirmar contraseña */}
        <View style={styles.inputWrapper}>
          <View style={[styles.passwordContainer, errors.confirmPassword && styles.inputError]}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirmar Contraseña"
              placeholderTextColor="#A0AEC0"
              value={form.confirmPassword}
              onChangeText={(t) => updateField('confirmPassword', t)}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              importantForAutofill="no"
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword((p) => !p)}
              style={styles.eyeButton}
              accessibilityLabel={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showConfirmPassword ? (
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
          {errors.confirmPassword ? (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          ) : null}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
          onPress={handleSignUp}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Crear Cuenta</Text>
          )}
        </TouchableOpacity>
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
    paddingTop: 56,
    paddingBottom: 24,
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 56,
    padding: 8,
  },
  backIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
  logo: {
    width: 120,
    height: 60,
  },
  body: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 20,
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
  dateInput: {
    backgroundColor: SAFELI_LIGHT_BLUE,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dateText: {
    fontSize: 15,
    color: '#1A202C',
  },
  datePlaceholder: {
    fontSize: 15,
    color: '#A0AEC0',
  },
  calendarIcon: {
    fontSize: 18,
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
  eyeIcon: {
    fontSize: 18,
  },
  eyeText: {
    fontSize: 18,
    color: '#4A5568',
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  primaryButton: {
    backgroundColor: SAFELI_BLUE,
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
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
  footer: {
    backgroundColor: SAFELI_BLUE,
    height: 12,
  },
});