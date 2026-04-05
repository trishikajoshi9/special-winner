import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import SplashScreen from '@screens/SplashScreen';
import LoginScreen from '@screens/LoginScreen';
import DashboardScreen from '@screens/DashboardScreen';
import ChatListScreen from '@screens/ChatListScreen';
import ChatScreen from '@screens/ChatScreen';
import ConfigScreen from '@screens/ConfigScreen';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  MainApp: undefined;
};

export type BottomTabParamList = {
  Dashboard: undefined;
  ChatList: undefined;
  Config: undefined;
};

export type AppStackParamList = {
  ChatList: undefined;
  Chat: { leadId: string };
};

const RootStack = createStackNavigator<RootStackParamList>();
const BottomTab = createBottomTabNavigator<BottomTabParamList>();
const AppStack = createStackNavigator<AppStackParamList>();

const ChatListStackNavigator = () => {
  return (
    <AppStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AppStack.Screen name="ChatList" component={ChatListScreen} />
      <AppStack.Screen name="Chat" component={ChatScreen} />
    </AppStack.Navigator>
  );
};

const MainAppNavigator = () => {
  return (
    <BottomTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#eee',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: 4,
        },
      }}
    >
      <BottomTab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📊</Text>,
        }}
      />
      <BottomTab.Screen
        name="ChatList"
        component={ChatListStackNavigator}
        options={{
          title: 'Messages',
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💬</Text>,
        }}
      />
      <BottomTab.Screen
        name="Config"
        component={ConfigScreen}
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text>,
        }}
      />
    </BottomTab.Navigator>
  );
};

interface RootNavigatorProps {
  isLoggedIn: boolean;
  isLoading: boolean;
}

export const RootNavigator: React.FC<RootNavigatorProps> = ({ isLoggedIn, isLoading }) => {
  const [splashDone, setSplashDone] = React.useState(false);

  if (isLoading && !splashDone) {
    return (
      <NavigationContainer>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Splash">
            {(props) => (
              <SplashScreen
                {...props}
                onFinish={() => setSplashDone(true)}
              />
            )}
          </RootStack.Screen>
        </RootStack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <RootStack.Screen
            name="MainApp"
            component={MainAppNavigator}
            options={{
              animationEnabled: false,
            }}
          />
        ) : (
          <RootStack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              animationEnabled: false,
            }}
          />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
