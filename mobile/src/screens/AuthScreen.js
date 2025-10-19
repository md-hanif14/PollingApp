import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api'; // Ensure this path is correct

// Regular Expression for basic email format validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

const AuthScreen = () => { // Note: 'navigation' is passed as a prop, but we handle the switch via state
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const authHandler = async () => {

    // 💡 FRONTEND VALIDATION

    // 1. Email Format Check
    if (!emailRegex.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email format (e.g., user@domain.com).');
      return; // Stop execution
    }

    // 2. Password Length Check
    if (password.length < MIN_PASSWORD_LENGTH) {
      Alert.alert('Validation Error', `Password must be a minimum of ${MIN_PASSWORD_LENGTH} characters.`);
      return; // Stop execution
    }

    // 3. Backend Call Logic
    try {
      const endpoint = isLogin ? 'auth/login' : 'auth/signup';
      const res = await api.post(endpoint, { email, password });

      // Save the JWT token to trigger the screen switch in App.js
      await AsyncStorage.setItem('token', res.data.token);

      // We no longer call navigation.replace('Home') here. 
      // The change in AsyncStorage state will cause App.js to re-render 
      // and display the HomeScreen automatically.

    } catch (err) {
      // Handle errors returned from the backend (like "User already exists")
      const msg = err.response?.data?.msg || 'A network or server error occurred.';
      Alert.alert(isLogin ? 'Login Failed' : 'Signup Failed', msg);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder={`Password (min ${MIN_PASSWORD_LENGTH} chars)`}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button title={isLogin ? 'Log In' : 'Sign Up'} onPress={authHandler} />

      <Button
        title={`Go to ${isLogin ? 'Sign Up' : 'Sign In'}`}
        onPress={() => setIsLogin(!isLogin)}
        color="gray"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 },
});

export default AuthScreen;