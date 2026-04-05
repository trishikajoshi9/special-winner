import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  Switch,
  FlatList,
  Alert,
} from 'react-native';
import { useConfigStore, useAuthStore } from '@store/index';
import justDialService from '@services/justdial';

interface ConfigScreenProps {
  navigation: any;
}

const ConfigScreen: React.FC<ConfigScreenProps> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [installedApps, setInstalledApps] = useState<any[]>([]);
  const [autoReply, setAutoReply] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const { logout, user } = useAuthStore();
  const { config, updateConfig, setConfig } = useConfigStore();

  useEffect(() => {
    initializeConfig();
  }, []);

  const initializeConfig = async () => {
    try {
      const apps = await justDialService.getInstalledApps();
      setInstalledApps(apps);
      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing config:', error);
      setIsLoading(false);
    }
  };

  const handleLinkJustDial = async () => {
    try {
      const isInstalled = await justDialService.isJustDialInstalled();

      if (!isInstalled) {
        Alert.alert('JustDial Not Installed', 'Please install JustDial app first');
        return;
      }

      // Request permissions
      const granted = await justDialService.requestJustDialPermissions();

      if (granted) {
        // Start monitoring
        const started = await justDialService.startMonitoring();

        if (started) {
          updateConfig({ isJustDialLinked: true });
          Alert.alert('Success', 'JustDial linked successfully!\nMonitoring started.');
        }
      } else {
        Alert.alert('Permission Denied', 'Required permissions were not granted');
      }
    } catch (error) {
      console.error('Error linking JustDial:', error);
      Alert.alert('Error', 'Failed to link JustDial');
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel' },
      {
        text: 'Logout',
        onPress: () => {
          logout();
          navigation.navigate('Login');
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* User Profile */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text style={styles.avatarText}>
                {user?.name?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* JustDial Integration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔗 JustDial Integration</Text>

          <View style={styles.configCard}>
            <View style={styles.configHeader}>
              <Text style={styles.configTitle}>Link JustDial App</Text>
              <View
                style={[
                  styles.statusBadge,
                  config?.isJustDialLinked && styles.statusBadgeActive,
                ]}
              >
                <Text style={styles.statusBadgeText}>
                  {config?.isJustDialLinked ? '✓ Linked' : '○ Not Linked'}
                </Text>
              </View>
            </View>
            <Text style={styles.configDescription}>
              Get leads in real-time from JustDial notifications
            </Text>
            <TouchableOpacity
              style={[styles.button, config?.isJustDialLinked && styles.buttonDisabled]}
              onPress={handleLinkJustDial}
              disabled={config?.isJustDialLinked}
            >
              <Text style={styles.buttonText}>
                {config?.isJustDialLinked ? 'Linked ✓' : 'Link Now'}
              </Text>
            </TouchableOpacity>

            {config?.isJustDialLinked && (
              <View style={styles.permissionsContainer}>
                <Text style={styles.permissionsTitle}>Permissions Granted:</Text>
                {['READ_INSTALLED_PACKAGES', 'QUERY_ALL_PACKAGES', 'POST_NOTIFICATIONS'].map((perm) => (
                  <View key={perm} style={styles.permissionItem}>
                    <Text style={styles.permissionCheck}>✓</Text>
                    <Text style={styles.permissionText}>{perm}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Installed Apps */}
          <View style={styles.configCard}>
            <Text style={styles.configTitle}>Installed Apps</Text>
            <Text style={styles.configDescription}>
              {installedApps.length} apps found
            </Text>
            <View style={styles.appsList}>
              {installedApps.slice(0, 5).map((app, idx) => (
                <View key={idx} style={styles.appItem}>
                  <Text style={styles.appIcon}>📱</Text>
                  <View style={styles.appInfo}>
                    <Text style={styles.appName}>{app.appName}</Text>
                    <Text style={styles.appPackage}>{app.packageName}</Text>
                  </View>
                  {app.packageName === 'com.justdial.app' && (
                    <Text style={styles.appBadge}>JustDial</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Automation Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Automation</Text>

          <View style={styles.configCard}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>AI Auto-Reply</Text>
              <Switch
                value={autoReply}
                onValueChange={setAutoReply}
                trackColor={{ false: '#ddd', true: '#ddd' }}
                thumbColor={autoReply ? '#007AFF' : '#999'}
              />
            </View>
            <Text style={styles.settingDescription}>
              AI will automatically respond to messages
            </Text>
          </View>

          <View style={styles.configCard}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#ddd', true: '#ddd' }}
                thumbColor={notifications ? '#007AFF' : '#999'}
              />
            </View>
            <Text style={styles.settingDescription}>
              Receive real-time lead notifications
            </Text>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ About</Text>
          <View style={styles.configCard}>
            <View style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>App Version</Text>
              <Text style={styles.aboutValue}>1.0.0</Text>
            </View>
            <View style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>API Version</Text>
              <Text style={styles.aboutValue}>v1</Text>
            </View>
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>🚪 Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  profileEmail: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  configCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  configHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  configDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  statusBadgeActive: {
    backgroundColor: '#d4edda',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  permissionsContainer: {
    marginTopTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  permissionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  permissionCheck: {
    color: '#34C759',
    fontWeight: '700',
    marginRight: 8,
  },
  permissionText: {
    fontSize: 12,
    color: '#666',
  },
  appsList: {
    marginTop: 12,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  appIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  appPackage: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  appBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    backgroundColor: '#e7f3ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  aboutLabel: {
    fontSize: 14,
    color: '#666',
  },
  aboutValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff3b30',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  logoutButtonText: {
    color: '#ff3b30',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ConfigScreen;
