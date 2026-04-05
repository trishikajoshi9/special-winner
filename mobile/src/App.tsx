import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { useAuthStore } from '@store/index';
import { RootNavigator } from '@navigation/RootNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '@services/api';

const App: React.FC = () => {
  const { user, token, isLoading, setUser, setToken, setLoading } = useAuthStore();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Check if user is already logged in
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }

      setLoading(false);
    } catch (error) {
      console.error('Error initializing app:', error);
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <RootNavigator
        isLoggedIn={!!token && !!user}
        isLoading={isLoading}
      />
    </>
  );
};

export default App;
