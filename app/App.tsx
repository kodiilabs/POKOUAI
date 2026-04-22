import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { initI18n } from '@/i18n';
import { initDb } from '@/services/db';
import type { RootStackParamList } from '@/types';

import OnboardingScreen from '@/screens/OnboardingScreen';
import HomeScreen from '@/screens/HomeScreen';
import DiagnosisScreen from '@/screens/DiagnosisScreen';
import ResultScreen from '@/screens/ResultScreen';
import FarmLogScreen from '@/screens/FarmLogScreen';
import SettingsScreen from '@/screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const ONBOARDING_KEY = 'pokouai.onboarded';

export default function App() {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    (async () => {
      await initI18n();
      await initDb();
      const flag = await AsyncStorage.getItem(ONBOARDING_KEY);
      setOnboarded(flag === '1');
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={onboarded ? 'Home' : 'Onboarding'}
          screenOptions={{
            headerStyle: { backgroundColor: '#1b5e20' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '600' },
          }}
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'PokouAI' }} />
          <Stack.Screen name="Diagnosis" component={DiagnosisScreen} />
          <Stack.Screen name="Result" component={ResultScreen} />
          <Stack.Screen name="FarmLog" component={FarmLogScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
