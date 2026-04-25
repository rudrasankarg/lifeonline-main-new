// lifeOnLine – Root App Component with Navigation
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import SymptomsScreen from './src/screens/SymptomsScreen';
import DoctorScreen from './src/screens/DoctorScreen';
import VideoCallScreen from './src/screens/VideoCallScreen';
import FinanceScreen from './src/screens/FinanceScreen'; // Finance Guard [additive]

import { COLORS } from './src/theme';
import './src/services/tracker';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" backgroundColor={COLORS.background} />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.surface },
          headerTintColor: COLORS.textPrimary,
          headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{ title: 'AI Chat' }}
        />
        <Stack.Screen
          name="Symptoms"
          component={SymptomsScreen}
          options={{ title: 'Symptom Checker' }}
        />
        <Stack.Screen
          name="Doctor"
          component={DoctorScreen}
          options={{ title: 'Doctor Match' }}
        />
        <Stack.Screen
          name="VideoCall"
          component={VideoCallScreen}
          options={{
            title: 'Consultation',
            headerStyle: { backgroundColor: '#0A0A14' },
            headerTintColor: '#fff',
          }}
        />
        {/* Finance Guard [additive] */}
        <Stack.Screen
          name="Finance"
          component={FinanceScreen}
          options={{ title: 'Finance Guard', headerTintColor: COLORS.primary }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
