import React from 'react';
import LoginScreen from './LoginScreen';

/**
 * Unified Responsive Auth Page (Sign Up entry point)
 * Hosts both Log In and Sign Up with dynamic toggle on the same page.
 */
export default function SignupScreen(props) {
  return <LoginScreen {...props} initialMode="signup" />;
}
