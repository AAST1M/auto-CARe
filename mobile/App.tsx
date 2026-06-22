import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { RootStackParamList } from './src/types/navigation';

import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import HomeScreen from './src/screens/HomeScreen';
import WinchMapScreen from './src/screens/WinchMapScreen';
import AIDiagnosticsScreen from './src/screens/AIDiagnosticsScreen';
import FindWorkshopScreen from './src/screens/FindWorkshopScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { token, loading } = useAuth();

  if (loading) {
    return null; // Or a splash screen
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!token ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="WinchMap" component={WinchMapScreen} options={{ headerShown: true, title: 'Request Winch' }} />
          <Stack.Screen name="AIDiagnostics" component={AIDiagnosticsScreen} options={{ headerShown: true, title: 'AI Diagnostics' }} />
          <Stack.Screen name="FindWorkshop" component={FindWorkshopScreen} options={{ headerShown: true, title: 'Find Workshop' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
