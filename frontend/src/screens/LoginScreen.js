import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable as TouchableOpacity,
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import { AuthLayout, FormField, authStyles } from '../components/AuthLayout';
import { useApp } from '../context/AppContext';
import Text from '../components/AppText';
import AppIcon from '../components/AppIcon';
import { colors, fonts } from '../theme';

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(trimmed)) return false;
  if (trimmed.includes('..') || trimmed.includes('@.') || trimmed.endsWith('.')) return false;
  return true;
}

const NAME_REGEX = /^[a-zA-Z\s]+$/;

export default function LoginScreen({ navigation, route, initialMode = 'login' }) {
  const { login, signup, socialLogin } = useApp();

  // Active form mode: 'login' or 'signup' (Toggle on the same page)
  const [mode, setMode] = useState(route?.params?.mode || initialMode || 'login');

  // Role: 'user' (Traveler) or 'admin' (Admin)
  const [role, setRole] = useState(route?.params?.defaultRole || 'user');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Signup form state
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');

  // UI status
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [infoMessage, setInfoMessage] = useState(route?.params?.successMessage || '');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null); // 'google' | 'apple' | 'facebook'

  // Input refs for smooth keyboard navigation
  const loginPassRef = useRef(null);
  const signupEmailRef = useRef(null);
  const signupPhoneRef = useRef(null);
  const signupPassRef = useRef(null);
  const signupConfirmRef = useRef(null);
  const adminCodeRef = useRef(null);

  // Switch between Log In and Sign Up forms
  function handleModeChange(newMode) {
    setMode(newMode);
    setErrors({});
    setServerError('');
    setInfoMessage('');
  }

  // Switch role between Traveler and Admin
  function handleRoleChange(newRole) {
    setRole(newRole);
    setErrors({});
    setServerError('');
  }

  // -----------------------
  // LOGIN VALIDATION & SUBMIT
  // -----------------------
  function validateLogin() {
    const errs = {};
    const trimmed = loginEmail.trim();
    if (!trimmed) {
      errs.loginEmail = 'Email address is required';
    } else if (!isValidEmail(trimmed)) {
      errs.loginEmail = 'Please enter a valid email address (e.g. name@gmail.com)';
    }

    if (!loginPassword) {
      errs.loginPassword = 'Password is required';
    } else if (loginPassword.length < 6) {
      errs.loginPassword = 'Password must be at least 6 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleLoginSubmit() {
    setServerError('');
    setInfoMessage('');
    if (!validateLogin()) return;

    setLoading(true);
    try {
      const loggedUser = await login(loginEmail.trim().toLowerCase(), loginPassword, role);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('stp_user_email', loginEmail.trim().toLowerCase());
        if (loggedUser?.fullName) {
          window.localStorage.setItem('stp_user_fullname', loggedUser.fullName);
        }
      }
      if (loggedUser?.role === 'admin') {
        navigation.replace('AdminDashboard');
      } else {
        navigation.replace('MainApp');
      }
    } catch (requestError) {
      const msg = requestError.message || 'Unable to sign in. Please check your connection.';
      if (
        msg.toLowerCase().includes('incorrect') ||
        msg.toLowerCase().includes('unauthorized') ||
        msg.toLowerCase().includes('401')
      ) {
        setServerError('Incorrect email or password. Please try again.');
      } else {
        setServerError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  // -----------------------
  // SIGNUP VALIDATION & SUBMIT
  // -----------------------
  function validateSignup() {
    const errs = {};
    const trimmedName = fullName.trim();
    const trimmedEmail = signupEmail.trim();

    if (!trimmedName) {
      errs.fullName = 'Full name is required';
    } else if (trimmedName.length < 2) {
      errs.fullName = 'Name must be at least 2 characters';
    } else if (trimmedName.length > 80) {
      errs.fullName = 'Name cannot exceed 80 characters';
    } else if (!NAME_REGEX.test(trimmedName)) {
      errs.fullName = 'Name should only contain letters and spaces';
    }

    if (!trimmedEmail) {
      errs.signupEmail = 'Email address is required';
    } else if (!isValidEmail(trimmedEmail)) {
      errs.signupEmail = 'Please enter a valid email address (e.g. name@gmail.com)';
    }

    if (!signupPassword) {
      errs.signupPassword = 'Password is required';
    } else if (signupPassword.length < 6) {
      errs.signupPassword = 'Password must be at least 6 characters';
    } else if (signupPassword.length > 128) {
      errs.signupPassword = 'Password is too long (max 128 characters)';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Please repeat your password';
    } else if (signupPassword !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    if (role === 'admin') {
      if (!adminCode || !adminCode.trim()) {
        errs.adminCode = 'Admin Authorization Key is required';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSignupSubmit() {
    setServerError('');
    setInfoMessage('');
    if (!validateSignup()) return;

    setLoading(true);
    try {
      await signup(fullName.trim(), signupEmail.trim().toLowerCase(), signupPassword, role, adminCode.trim(), phone.trim());
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('stp_user_fullname', fullName.trim());
        window.localStorage.setItem('stp_user_email', signupEmail.trim().toLowerCase());
      }
      // Log in immediately so user/admin enters the app directly
      const loggedUser = await login(signupEmail.trim().toLowerCase(), signupPassword, role);
      if (loggedUser?.role === 'admin') {
        navigation.replace('AdminDashboard');
      } else {
        navigation.replace('MainApp');
      }
    } catch (requestError) {
      const msg = requestError.message || 'Unable to create account. Please try again.';
      if (msg.toLowerCase().includes('already registered')) {
        setErrors((prev) => ({ ...prev, signupEmail: 'This email is already registered. Please log in.' }));
      } else {
        setServerError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  // -----------------------
  // SOCIAL AUTHENTICATION (Google, Apple, Facebook)
  // -----------------------
  async function handleSocialAuth(provider) {
    if (socialLoading || loading) return;
    setSocialLoading(provider);
    setServerError('');
    setInfoMessage('');

    try {
      const loggedUser = await socialLogin(provider, role);
      if (loggedUser?.role === 'admin') {
        navigation.replace('AdminDashboard');
      } else {
        navigation.replace('MainApp');
      }
    } catch (err) {
      setServerError(err.message || `Unable to authenticate with ${provider}. Please try again.`);
    } finally {
      setSocialLoading(null);
    }
  }

  const isLogin = mode === 'login';

  return (
    <AuthLayout
      title={isLogin ? 'Welcome Back' : 'Create Account'}
      subtitle={
        isLogin
          ? role === 'admin'
            ? 'Log in to Admin Console'
            : 'Log in to continue your journey'
          : role === 'admin'
          ? 'Admin provisioning and management access'
          : 'Join us and start exploring Pakistan'
      }
      serverError={serverError}
      onBack={() => {
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.navigate('Welcome');
      }}
    >
      {/* 1. Pill Form Switcher: [ Log In ]  [ Sign Up ] matching reference design */}
      <View style={styles.formSwitcherContainer}>
        <TouchableOpacity
          style={[styles.switcherBtn, isLogin && styles.switcherBtnActive]}
          onPress={() => handleModeChange('login')}
          accessibilityRole="tab"
          accessibilityState={{ selected: isLogin }}
        >
          <Text style={[styles.switcherText, isLogin && styles.switcherTextActive]}>
            Log In
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.switcherBtn, !isLogin && styles.switcherBtnActive]}
          onPress={() => handleModeChange('signup')}
          accessibilityRole="tab"
          accessibilityState={{ selected: !isLogin }}
        >
          <Text style={[styles.switcherText, !isLogin && styles.switcherTextActive]}>
            Sign Up
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2. Role Switcher: [ 👤 Traveler ]  [ 🛡️ Admin ] */}
      <View style={styles.roleSwitcherContainer}>
        <TouchableOpacity
          style={[styles.roleBtn, role === 'user' && styles.roleBtnActive]}
          onPress={() => handleRoleChange('user')}
        >
          <Text style={[styles.roleBtnText, role === 'user' && styles.roleBtnTextActive]}>
            👤 Traveler
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleBtn, role === 'admin' && styles.roleBtnActive]}
          onPress={() => handleRoleChange('admin')}
        >
          <Text style={[styles.roleBtnText, role === 'admin' && styles.roleBtnTextActive]}>
            🛡️ Admin
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info/Success message banner */}
      {infoMessage ? (
        <View style={authStyles.banner}>
          <Text style={authStyles.bannerTitle}>Notification</Text>
          <Text style={authStyles.bannerText}>{infoMessage}</Text>
        </View>
      ) : null}

      {/* 3. Dynamic Form Fields */}
      {isLogin ? (
        /* ================= LOGIN FORM ================= */
        <View style={styles.formFieldsWrap}>
          <FormField
            iconName="mail-outline"
            label="Email Address"
            value={loginEmail}
            onChangeText={(val) => {
              setLoginEmail(val);
              if (errors.loginEmail) setErrors((prev) => ({ ...prev, loginEmail: undefined }));
              if (serverError) setServerError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            placeholder="Email Address"
            returnKeyType="next"
            onSubmitEditing={() => loginPassRef.current?.focus()}
            error={errors.loginEmail}
          />

          <FormField
            ref={loginPassRef}
            iconName="lock-closed-outline"
            label="Password"
            value={loginPassword}
            onChangeText={(val) => {
              setLoginPassword(val);
              if (errors.loginPassword) setErrors((prev) => ({ ...prev, loginPassword: undefined }));
              if (serverError) setServerError('');
            }}
            isPassword
            placeholder="Password"
            returnKeyType="done"
            onSubmitEditing={handleLoginSubmit}
            error={errors.loginPassword}
          />

          {/* Remember me & Forgot Password Row */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberMe}
              onPress={() => setRememberMe(!rememberMe)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: rememberMe }}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <AppIcon name="checkmark" size={11} color="#ffffff" />}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                setInfoMessage('Password reset link has been dispatched to your registered Gmail address.')
              }
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Primary Action Button */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.85 }]}
            onPress={handleLoginSubmit}
            disabled={loading || Boolean(socialLoading)}
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.btnContent}>
                <Text style={styles.btnText}>
                  {role === 'admin' ? 'Log In as Admin' : 'Log In'}
                </Text>
                <AppIcon name="arrow-forward" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        /* ================= SIGNUP FORM ================= */
        <View style={styles.formFieldsWrap}>
          <FormField
            iconName="person-outline"
            label="Full Name"
            value={fullName}
            onChangeText={(val) => {
              setFullName(val);
              if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
              if (serverError) setServerError('');
            }}
            placeholder="Full Name"
            autoCapitalize="words"
            autoComplete="name"
            returnKeyType="next"
            onSubmitEditing={() => signupEmailRef.current?.focus()}
            error={errors.fullName}
          />

          <FormField
            ref={signupEmailRef}
            iconName="mail-outline"
            label="Email Address"
            value={signupEmail}
            onChangeText={(val) => {
              setSignupEmail(val);
              if (errors.signupEmail) setErrors((prev) => ({ ...prev, signupEmail: undefined }));
              if (serverError) setServerError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            placeholder="Email Address"
            returnKeyType="next"
            onSubmitEditing={() => signupPhoneRef.current?.focus()}
            error={errors.signupEmail}
          />

          <FormField
            ref={signupPhoneRef}
            iconName="call-outline"
            label="Phone Number"
            value={phone}
            onChangeText={(val) => {
              setPhone(val);
              if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
              if (serverError) setServerError('');
            }}
            keyboardType="phone-pad"
            placeholder="Phone Number"
            returnKeyType="next"
            onSubmitEditing={() => signupPassRef.current?.focus()}
            error={errors.phone}
          />

          <FormField
            ref={signupPassRef}
            iconName="lock-closed-outline"
            label="Password"
            value={signupPassword}
            onChangeText={(val) => {
              setSignupPassword(val);
              if (errors.signupPassword) setErrors((prev) => ({ ...prev, signupPassword: undefined }));
              if (serverError) setServerError('');
            }}
            isPassword
            placeholder="Password"
            returnKeyType="next"
            onSubmitEditing={() => signupConfirmRef.current?.focus()}
            error={errors.signupPassword}
          />

          <FormField
            ref={signupConfirmRef}
            iconName="lock-closed-outline"
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={(val) => {
              setConfirmPassword(val);
              if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              if (serverError) setServerError('');
            }}
            isPassword
            placeholder="Confirm Password"
            returnKeyType={role === 'admin' ? 'next' : 'done'}
            onSubmitEditing={() => {
              if (role === 'admin') adminCodeRef.current?.focus();
              else handleSignupSubmit();
            }}
            error={errors.confirmPassword}
          />

          {role === 'admin' && (
            <FormField
              ref={adminCodeRef}
              iconName="key-outline"
              label="Admin Authorization Key *"
              value={adminCode}
              onChangeText={(val) => {
                setAdminCode(val);
                if (errors.adminCode) setErrors((prev) => ({ ...prev, adminCode: undefined }));
                if (serverError) setServerError('');
              }}
              placeholder="Admin Authorization Key *"
              returnKeyType="done"
              onSubmitEditing={handleSignupSubmit}
              error={errors.adminCode}
            />
          )}

          {/* Primary Action Button */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.85 }]}
            onPress={handleSignupSubmit}
            disabled={loading || Boolean(socialLoading)}
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.btnContent}>
                <Text style={styles.btnText}>
                  {role === 'admin' ? 'Create Admin Account' : 'Sign Up'}
                </Text>
                <AppIcon name="arrow-forward" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
              </View>
            )}
          </TouchableOpacity>

          {/* Terms & Conditions Notice */}
          <View style={styles.termsWrapper}>
            <Text style={styles.termsText}>
              By signing up, you agree to our{' '}
              <Text style={styles.termsLink}>Terms & Conditions</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>
        </View>
      )}

      {/* 4. Social Login Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* 5. Clickable & Functional Social Buttons */}
      <View style={styles.socialRow}>
        {/* Google Login Button */}
        <TouchableOpacity
          style={styles.socialBtn}
          onPress={() => handleSocialAuth('google')}
          disabled={Boolean(socialLoading || loading)}
          accessibilityRole="button"
          accessibilityLabel="Sign in with Google"
        >
          {socialLoading === 'google' ? (
            <ActivityIndicator size="small" color="#EA4335" />
          ) : (
            <AppIcon name="logo-google" size={18} color="#EA4335" />
          )}
        </TouchableOpacity>

        {/* Apple Login Button */}
        <TouchableOpacity
          style={styles.socialBtn}
          onPress={() => handleSocialAuth('apple')}
          disabled={Boolean(socialLoading || loading)}
          accessibilityRole="button"
          accessibilityLabel="Sign in with Apple"
        >
          {socialLoading === 'apple' ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <AppIcon name="logo-apple" size={20} color="#000000" />
          )}
        </TouchableOpacity>

        {/* Facebook Login Button */}
        <TouchableOpacity
          style={styles.socialBtn}
          onPress={() => handleSocialAuth('facebook')}
          disabled={Boolean(socialLoading || loading)}
          accessibilityRole="button"
          accessibilityLabel="Sign in with Facebook"
        >
          {socialLoading === 'facebook' ? (
            <ActivityIndicator size="small" color="#1877F2" />
          ) : (
            <AppIcon name="logo-facebook" size={20} color="#1877F2" />
          )}
        </TouchableOpacity>
      </View>

      {/* 6. Bottom Switch Link */}
      <View style={authStyles.switchRow}>
        <Text style={authStyles.switchText}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
        </Text>
        <TouchableOpacity
          onPress={() => handleModeChange(isLogin ? 'signup' : 'login')}
          accessibilityRole="button"
        >
          <Text style={authStyles.switchLink}>
            {isLogin ? 'Sign Up  →' : 'Log In  →'}
          </Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  formSwitcherContainer: {
    flexDirection: 'row',
    backgroundColor: '#edf3ef',
    borderRadius: 24,
    padding: 3,
    marginBottom: 10,
    width: '100%',
  },
  switcherBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
  },
  switcherBtnActive: {
    backgroundColor: '#145a38',
    shadowColor: '#145a38',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 3,
  },
  switcherText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#55685f',
  },
  switcherTextActive: {
    color: '#ffffff',
    fontFamily: fonts.bold,
  },
  roleSwitcherContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f7f4',
    borderRadius: 20,
    padding: 2,
    marginBottom: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5ece7',
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  roleBtnActive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c6dcce',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  roleBtnText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#65776d',
  },
  roleBtnTextActive: {
    color: '#145a38',
    fontFamily: fonts.bold,
  },
  formFieldsWrap: {
    width: '100%',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 17,
    height: 17,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#889b90',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  checkboxChecked: {
    backgroundColor: '#155d3b',
    borderColor: '#155d3b',
  },
  rememberText: {
    fontSize: 12,
    color: '#495a51',
    fontFamily: fonts.medium,
  },
  forgotText: {
    fontSize: 12,
    color: '#155d3b',
    fontFamily: fonts.bold,
  },
  submitBtn: {
    backgroundColor: '#145a38',
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#145a38',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 14,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: fonts.bold,
    letterSpacing: 0.2,
  },
  termsWrapper: {
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  termsText: {
    fontSize: 11,
    color: '#7b8c83',
    textAlign: 'center',
    lineHeight: 16,
    fontFamily: fonts.regular,
  },
  termsLink: {
    color: '#155d3b',
    fontFamily: fonts.bold,
    textDecorationLine: 'underline',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0eae3',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: '#7a8e83',
    fontFamily: fonts.regular,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 4,
    marginTop: 2,
  },
  socialBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: '#e0ece4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0e3a24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
});
