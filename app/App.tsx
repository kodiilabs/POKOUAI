import 'react-native-gesture-handler';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, type NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { initI18n } from '@/i18n';
import { initDb } from '@/services/db';
import type { RootStackParamList } from '@/types';

import OnboardingScreen from '@/screens/OnboardingScreen';
import HomeScreen from '@/screens/HomeScreen';
import DiagnosisScreen from '@/screens/DiagnosisScreen';
import ResultScreen from '@/screens/ResultScreen';
import FarmLogScreen from '@/screens/FarmLogScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import HubSettingsScreen from '@/screens/HubSettingsScreen';
import LearnScreen from '@/screens/LearnScreen';
import PreventionCalendarScreen from '@/screens/PreventionCalendarScreen';
import QuizScreen from '@/screens/QuizScreen';
import GroupModeScreen from '@/screens/GroupModeScreen';
import FollowUpScreen from '@/screens/FollowUpScreen';
import FarmIntelligenceLogScreen from '@/screens/FarmIntelligenceLogScreen';
import LiteRTSmokeScreen from '@/screens/LiteRTSmokeScreen';
import SkillDemoScreen from '@/screens/SkillDemoScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const ONBOARDING_KEY = 'pokouai.onboarded';

export default function App() {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const navRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  useEffect(() => {
    (async () => {
      await initI18n();
      await initDb();
      const flag = await AsyncStorage.getItem(ONBOARDING_KEY);
      setOnboarded(flag === '1');
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const data = res.notification.request.content.data as { kind?: string; loopId?: number };
      if (data.kind === 'followup' && typeof data.loopId === 'number') {
        navRef.current?.navigate('FollowUp', { loopId: data.loopId });
      }
    });
    return () => sub.remove();
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
      <NavigationContainer ref={navRef}>
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
          <Stack.Screen name="HubSettings" component={HubSettingsScreen} options={{ title: 'Hub' }} />
          <Stack.Screen name="Learn" component={LearnScreen} />
          <Stack.Screen
            name="PreventionCalendar"
            component={PreventionCalendarScreen}
            options={{ title: 'Calendrier' }}
          />
          <Stack.Screen name="Quiz" component={QuizScreen} />
          <Stack.Screen
            name="GroupMode"
            component={GroupModeScreen}
            options={{
              title: 'Group mode',
              headerStyle: { backgroundColor: '#00838f' },
            }}
          />
          <Stack.Screen name="FollowUp" component={FollowUpScreen} options={{ title: 'Day 7' }} />
          <Stack.Screen
            name="IntelligenceLog"
            component={FarmIntelligenceLogScreen}
            options={{ title: 'Farm intelligence' }}
          />
          <Stack.Screen
            name="LiteRTSmoke"
            component={LiteRTSmokeScreen}
            options={{ title: 'LiteRT smoke' }}
          />
          <Stack.Screen
            name="SkillDemo"
            component={SkillDemoScreen}
            options={{ title: 'Farmer Agent' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
