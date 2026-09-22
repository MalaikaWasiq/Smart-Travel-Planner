import React, { useState } from 'react';
import { Pressable as TouchableOpacity, View } from 'react-native';
import { AuthLayout, FormField, authStyles } from '../components/AuthLayout';
import PrimaryButton from '../components/PrimaryButton';
import { useApp } from '../context/AppContext';
import Text from '../components/AppText';

const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function LoginScreen({ navigation, route }) {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!validEmail(email.trim())) return setError('Enter a valid email address');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true); setError('');
    try {
      await login(email.trim(), password);
      navigation.replace('MainApp');
    } catch (requestError) {
      setError(requestError.message);
    } finally { setLoading(false); }
  }

  return (
    <AuthLayout title="Sign in" subtitle="Continue planning your next journey">
      {route?.params?.successMessage ? (
        <View style={authStyles.banner}>
          <Text style={authStyles.bannerTitle}>Account created</Text>
          <Text style={authStyles.bannerText}>{route.params.successMessage}</Text>
        </View>
      ) : null}
      <FormField label="Email" value={email} onChangeText={(value) => { setEmail(value); setError(''); }} keyboardType="email-address" autoCapitalize="none" placeholder="name@example.com" error={error} />
      <FormField label="Password" value={password} onChangeText={(value) => { setPassword(value); setError(''); }} secureTextEntry placeholder="At least 6 characters" />
      <PrimaryButton title="SIGN IN" onPress={submit} loading={loading} />
      <View style={authStyles.switchRow}>
        <Text style={authStyles.switchText}>New here? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Signup')}><Text style={authStyles.switchLink}>Create account</Text></TouchableOpacity>
      </View>
    </AuthLayout>
  );
}
