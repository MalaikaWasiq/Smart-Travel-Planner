import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen({ navigation }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    // TODO: replace with real API call to your Node.js backend
    setTimeout(() => {
      setLoading(false);
      navigation.replace('MainApp'); // goes to bottom tabs
    }, 1500);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Green header area */}
        <LinearGradient colors={['#0d5c2e', '#1a7a4a', '#25a865']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.headerContent}>
            <Text style={styles.planeIcon}>✈</Text>
            <Text style={styles.headerTitle}>PakExplorer</Text>
            <Text style={styles.headerSub}>Welcome back!</Text>
          </View>
          {/* Pakistan skyline silhouette */}
          <View style={styles.skylineRow}>
            <View style={[styles.skylineBlock, { height: 30, width: 18 }]} />
            <View style={[styles.skylineBlock, { height: 50, width: 14 }]} />
            <View style={[styles.skylineDome]} />
            <View style={[styles.skylineMinaret]} />
            <View style={[styles.skylineDome]} />
            <View style={[styles.skylineBlock, { height: 50, width: 14 }]} />
            <View style={[styles.skylineBlock, { height: 35, width: 20 }]} />
            <View style={[styles.skylineBlock, { height: 55, width: 12 }]} />
            <View style={[styles.skylineBlock, { height: 28, width: 22 }]} />
          </View>
        </LinearGradient>

        {/* White form card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>

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
              placeholder="Enter your password"
              placeholderTextColor="#aaa"
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Text style={styles.showBtn}>{showPass ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          {/* Forgot password */}
          <TouchableOpacity style={styles.forgotWrap}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login button */}
          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            <LinearGradient colors={['#1a7a4a', '#25a865']} style={styles.loginGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.loginBtnText}>LOGIN</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Signup link */}
          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:      { flexGrow: 1, backgroundColor: '#f5f5f5' },
  header:         { paddingTop: 60, paddingBottom: 0, alignItems: 'center' },
  headerContent:  { alignItems: 'center', paddingBottom: 20 },
  planeIcon:      { fontSize: 36, marginBottom: 6 },
  headerTitle:    { fontSize: 30, color: '#fff', fontWeight: '800', letterSpacing: 1 },
  headerSub:      { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  skylineRow:     { flexDirection: 'row', alignItems: 'flex-end', opacity: 0.25, gap: 3, paddingHorizontal: 20 },
  skylineBlock:   { backgroundColor: '#ffffff', borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  skylineDome:    { width: 28, height: 28, borderRadius: 14, backgroundColor: '#ffffff', marginBottom: 0 },
  skylineMinaret: { width: 8, height: 60, backgroundColor: '#ffffff', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  card:           { backgroundColor: '#ffffff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 28, marginTop: -2, flex: 1, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 5 },
  cardTitle:      { fontSize: 24, fontWeight: '700', color: '#1a7a4a', marginBottom: 24, textAlign: 'center' },
  label:          { fontSize: 13, color: '#555', fontWeight: '600', marginBottom: 6, marginTop: 12 },
  inputWrap:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f8f8', borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0', paddingHorizontal: 12, height: 50 },
  inputIcon:      { fontSize: 16, marginRight: 8 },
  input:          { flex: 1, fontSize: 15, color: '#333' },
  showBtn:        { fontSize: 13, color: '#1a7a4a', fontWeight: '600' },
  forgotWrap:     { alignItems: 'flex-end', marginTop: 8 },
  forgotText:     { fontSize: 13, color: '#1a7a4a', fontWeight: '500' },
  loginBtn:       { marginTop: 24, borderRadius: 12, overflow: 'hidden' },
  loginGrad:      { height: 52, alignItems: 'center', justifyContent: 'center' },
  loginBtnText:   { color: '#ffffff', fontSize: 16, fontWeight: '700', letterSpacing: 2 },
  dividerRow:     { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine:    { flex: 1, height: 1, backgroundColor: '#e0e0e0' },
  dividerText:    { marginHorizontal: 12, color: '#aaa', fontSize: 13 },
  signupRow:      { flexDirection: 'row', justifyContent: 'center', marginBottom: 10 },
  signupText:     { fontSize: 14, color: '#666' },
  signupLink:     { fontSize: 14, color: '#1a7a4a', fontWeight: '700' },
});
