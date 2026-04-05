import React, { useEffect } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@store/index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '@services/api';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { setUser, setToken, setLoading } = useAuthStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if user is logged in
        const storedToken = await AsyncStorage.getItem('auth_token');
        const storedUser = await AsyncStorage.getItem('user');

        if (storedToken) {
          setToken(storedToken);

          if (storedUser) {
            setUser(JSON.parse(storedUser));
          } else {
            // Fetch user profile
            try {
              const profile = await apiService.getProfile();
              setUser(profile);
              await AsyncStorage.setItem('user', JSON.stringify(profile));
            } catch (error) {
              console.error('Error fetching profile:', error);
              await AsyncStorage.removeItem('auth_token');
            }
          }
        }

        // Simulate splash duration
        setTimeout(() => {
          setLoading(false);
          onFinish();
        }, 2000);
      } catch (error) {
        console.error('Error initializing app:', error);
        setLoading(false);
        onFinish();
      }
    };

    initializeApp();
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require('@/../assets/splash-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.textContainer}>
        <View style={styles.tagline} />
      </View>
      <ActivityIndicator
        size="large"
        color="#007AFF"
        style={styles.loader}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  tagline: {
    height: 4,
    width: 100,
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  loader: {
    marginTop: 40,
  },
});

export default SplashScreen;
