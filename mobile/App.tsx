import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import * as SecureStore from 'expo-secure-store'

// Screens
import HomeScreen from './src/screens/HomeScreen'
import ToolsScreen from './src/screens/ToolsScreen'
import ToolDetailScreen from './src/screens/ToolDetailScreen'
import HistoryScreen from './src/screens/HistoryScreen'
import ProfileScreen from './src/screens/ProfileScreen'
import LoginScreen from './src/screens/LoginScreen'
import ExpenseCaptureScreen from './src/screens/ExpenseCaptureScreen'

// Context
import { AuthProvider, useAuth } from './src/context/AuthContext'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function ToolsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ToolsList" component={ToolsScreen} options={{ title: 'Tools' }} />
      <Stack.Screen name="ToolDetail" component={ToolDetailScreen} options={{ title: 'Run Tool' }} />
    </Stack.Navigator>
  )
}

function ExpenseStack() {
  const { currentOrganization } = useAuth()
  
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ExpenseCapture" 
        options={{ title: 'Capture Expense' }}
      >
        {() => <ExpenseCaptureScreen organizationId={currentOrganization?.id || ''} />}
      </Stack.Screen>
    </Stack.Navigator>
  )
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home'
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline'
          else if (route.name === 'Tools') iconName = focused ? 'construct' : 'construct-outline'
          else if (route.name === 'Expenses') iconName = focused ? 'receipt' : 'receipt-outline'
          else if (route.name === 'History') iconName = focused ? 'time' : 'time-outline'
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline'
          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Tools" component={ToolsStack} options={{ headerShown: false }} />
      <Tab.Screen name="Expenses" component={ExpenseStack} options={{ headerShown: false }} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return null // Or a loading screen
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  )
}
