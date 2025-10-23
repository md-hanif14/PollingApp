import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, AuthContext } from './src/navigation/AuthProvider';

import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import HomeScreen from './src/screens/HomeScreen';
import PollScreen from './src/screens/PollScreen';
import ResultScreen from './src/screens/ResultScreen';
import CommentScreen from './src/screens/CommentScreen';
import CreatePollScreen from './src/screens/CreatePollScreen';


const Stack = createNativeStackNavigator();

function AppNav() {
  const { user, loading } = useContext(AuthContext);
  if (loading) return null;
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="CreatePoll" component={CreatePollScreen} options={{ title: 'Create Poll' }} />
            <Stack.Screen name="Poll" component={PollScreen} />
            <Stack.Screen name="Results" component={ResultScreen} />
            <Stack.Screen name="Comments" component={CommentScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNav />
    </AuthProvider>
  );
}
