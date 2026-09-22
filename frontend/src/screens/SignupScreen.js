import React, { useState } from 'react';
import { Pressable as TouchableOpacity, View } from 'react-native';
import { AuthLayout, FormField, authStyles } from '../components/AuthLayout';
import PrimaryButton from '../components/PrimaryButton';
import { useApp } from '../context/AppContext';
import Text from '../components/AppText';

export default function SignupScreen({ navigation }) {
  const { signup } = useApp();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const update = (key) => (value) => { setForm((current) => ({ ...current, [key]: value })); setError(''); };

  async function submit() {
    if (!form.fullName.trim()) return setError('Full name is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError('Enter a valid email address');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    setLoading(true);
    try {
      await signup(form.fullName.trim(), form.email.trim(), form.password);
      navigation.replace('Login', { successMessage: 'Your account is ready. Sign in with the email and password you just created.' });
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }

  return (
    <AuthLayout title="Create account" subtitle="Build and save personalized journeys">
      <FormField label="Full name" value={form.fullName} onChangeText={update('fullName')} placeholder="Your name" error={error} />
      <FormField label="Email" value={form.email} onChangeText={update('email')} keyboardType="email-address" autoCapitalize="none" placeholder="name@example.com" />
      <FormField label="Password" value={form.password} onChangeText={update('password')} secureTextEntry placeholder="At least 6 characters" />
      <FormField label="Confirm password" value={form.confirm} onChangeText={update('confirm')} secureTextEntry placeholder="Repeat password" />
      <PrimaryButton title="CREATE ACCOUNT" onPress={submit} loading={loading} />
      <View style={authStyles.switchRow}>
        <Text style={authStyles.switchText}>Already registered? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}><Text style={authStyles.switchLink}>Sign in</Text></TouchableOpacity>
      </View>
    </AuthLayout>
  );
}
