import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

export default function SignupScreen({ navigation }) {
  const [fullName,   setFullName]   = useState('');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [showPass,   setShowPass]   = useState(false);

  const handleSignup = async () => {
    if (!fullName || !email || !password || !confirmPwd) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (password !== confirmPwd) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    // TODO: replace with real API call to your Node.js backend
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'Account created! Please login.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    }, 1500);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Green header */}
        <LinearGradient colors={['#0d5c2e', '#1a7a4a', '#25a865']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.headerContent}>
            <Text style={styles.planeIcon}>✈</Text>
            <Text style={styles.headerTitle}>Smart Travel Planner</Text>
            <Text style={styles.headerSub}>Create your account</Text>
          </View>
        </LinearGradient>

        {/* White form card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign Up</Text>

          {/* Full Name */}
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>👤</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#aaa"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>✉</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#aaa"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Create a password"
              placeholderTextColor="#aaa"
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Text style={styles.showBtn}>{showPass ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              placeholderTextColor="#aaa"
              secureTextEntry={!showPass}
              value={confirmPwd}
              onChangeText={setConfirmPwd}
            />
          </View>

          {/* Signup button */}
          <TouchableOpacity style={styles.signupBtn} onPress={handleSignup} disabled={loading}>
            <LinearGradient colors={['#1a7a4a', '#25a865']} style={styles.signupGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.signupBtnText}>SIGN UP</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          {/* Login link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flexGrow: 1, backgroundColor: '#f5f5f5' },
  header:       { paddingTop: 60, paddingBottom: 24, alignItems: 'center' },
  headerContent:{ alignItems: 'center' },
  planeIcon:    { fontSize: 36, marginBottom: 6 },
  headerTitle:  { fontSize: 30, color: '#fff', fontWeight: '800', letterSpacing: 1 },
  headerSub:    { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  card:         { backgroundColor: '#ffffff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 28, flex: 1, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 5 },
  cardTitle:    { fontSize: 24, fontWeight: '700', color: '#1a7a4a', marginBottom: 20, textAlign: 'center' },
  label:        { fontSize: 13, color: '#555', fontWeight: '600', marginBottom: 6, marginTop: 12 },
  inputWrap:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f8f8', borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0', paddingHorizontal: 12, height: 50 },
  inputIcon:    { fontSize: 16, marginRight: 8 },
  input:        { flex: 1, fontSize: 15, color: '#333' },
  showBtn:      { fontSize: 13, color: '#1a7a4a', fontWeight: '600' },
  signupBtn:    { marginTop: 28, borderRadius: 12, overflow: 'hidden' },
  signupGrad:   { height: 52, alignItems: 'center', justifyContent: 'center' },
  signupBtnText:{ color: '#ffffff', fontSize: 16, fontWeight: '700', letterSpacing: 2 },
  loginRow:     { flexDirection: 'row', justifyContent: 'center', marginTop: 20, marginBottom: 10 },
  loginText:    { fontSize: 14, color: '#666' },
  loginLink:    { fontSize: 14, color: '#1a7a4a', fontWeight: '700' },
});
