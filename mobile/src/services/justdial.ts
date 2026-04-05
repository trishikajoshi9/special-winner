import { NativeModules, NativeEventEmitter } from 'react-native';
import RNDeviceInfo from 'react-native-device-info';
import { JustDialLead, InstalledApp } from '@types/index';

const { JustDialModule } = NativeModules;

class JustDialService {
  private eventEmitter: NativeEventEmitter | null = null;

  constructor() {
    if (JustDialModule) {
      this.eventEmitter = new NativeEventEmitter(JustDialModule);
      this.setupListeners();
    }
  }

  private setupListeners() {
    if (!this.eventEmitter) return;

    // Listen for JustDial notifications
    this.eventEmitter.addListener('notification_received', (notification) => {
      console.log('[JustDial] Notification received:', notification);
      // Emit to app or store
    });

    // Listen for notification actions (clicked, dismissed, etc.)
    this.eventEmitter.addListener('notification_action', (action) => {
      console.log('[JustDial] Notification action:', action);
    });

    // Listen for app open events
    this.eventEmitter.addListener('app_opened', (data) => {
      console.log('[JustDial] App opened:', data);
    });
  }

  /**
   * Check if JustDial app is installed
   */
  async isJustDialInstalled(): Promise<boolean> {
    try {
      if (!JustDialModule?.isJustDialInstalled) {
        return false;
      }
      return await JustDialModule.isJustDialInstalled();
    } catch (error) {
      console.error('[JustDial] Error checking if app is installed:', error);
      return false;
    }
  }

  /**
   * Get list of installed apps
   */
  async getInstalledApps(): Promise<InstalledApp[]> {
    try {
      if (!JustDialModule?.getInstalledApps) {
        return [];
      }
      const apps = await JustDialModule.getInstalledApps();
      return apps || [];
    } catch (error) {
      console.error('[JustDial] Error getting installed apps:', error);
      return [];
    }
  }

  /**
   * Request permissions for JustDial app tracking
   * Permissions needed:
   * - READ_INSTALLED_PACKAGES
   * - QUERY_ALL_PACKAGES
   * - RECEIVE notifications
   * - ACCESS_PACKAGE_USAGE_STATS
   */
  async requestJustDialPermissions(): Promise<boolean> {
    try {
      if (!JustDialModule?.requestJustDialPermissions) {
        console.warn('[JustDial] JustDialModule.requestJustDialPermissions not available');
        return false;
      }
      const granted = await JustDialModule.requestJustDialPermissions();
      return granted;
    } catch (error) {
      console.error('[JustDial] Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Start monitoring JustDial notifications
   * Must be called after permissions are granted
   */
  async startMonitoring(): Promise<boolean> {
    try {
      if (!JustDialModule?.startMonitoring) {
        console.warn('[JustDial] JustDialModule.startMonitoring not available');
        return false;
      }
      const result = await JustDialModule.startMonitoring();
      console.log('[JustDial] Monitoring started');
      return result;
    } catch (error) {
      console.error('[JustDial] Error starting monitoring:', error);
      return false;
    }
  }

  /**
   * Stop monitoring JustDial notifications
   */
  async stopMonitoring(): Promise<boolean> {
    try {
      if (!JustDialModule?.stopMonitoring) {
        return false;
      }
      const result = await JustDialModule.stopMonitoring();
      console.log('[JustDial] Monitoring stopped');
      return result;
    } catch (error) {
      console.error('[JustDial] Error stopping monitoring:', error);
      return false;
    }
  }

  /**
   * Get recent JustDial leads (notifications captured)
   */
  async getRecentLeads(limit: number = 20): Promise<JustDialLead[]> {
    try {
      if (!JustDialModule?.getRecentLeads) {
        return [];
      }
      const leads = await JustDialModule.getRecentLeads(limit);
      return leads || [];
    } catch (error) {
      console.error('[JustDial] Error getting recent leads:', error);
      return [];
    }
  }

  /**
   * Open JustDial app with specific lead
   */
  async openJustDialApp(leadId?: string): Promise<boolean> {
    try {
      if (!JustDialModule?.openApp) {
        return false;
      }
      const result = await JustDialModule.openApp(leadId);
      return result;
    } catch (error) {
      console.error('[JustDial] Error opening JustDial app:', error);
      return false;
    }
  }

  /**
   * Extract phone number from JustDial notification
   */
  async extractPhoneFromNotification(notificationId: string): Promise<string | null> {
    try {
      if (!JustDialModule?.extractPhoneNumber) {
        return null;
      }
      const phone = await JustDialModule.extractPhoneNumber(notificationId);
      return phone || null;
    } catch (error) {
      console.error('[JustDial] Error extracting phone:', error);
      return null;
    }
  }

  /**
   * Get accessibility logs from JustDial app
   * (Used for lead extraction and monitoring)
   */
  async getAccessibilityLogs(limit: number = 50): Promise<any[]> {
    try {
      if (!JustDialModule?.getAccessibilityLogs) {
        return [];
      }
      const logs = await JustDialModule.getAccessibilityLogs(limit);
      return logs || [];
    } catch (error) {
      console.error('[JustDial] Error getting accessibility logs:', error);
      return [];
    }
  }

  /**
   * Clean up listeners
   */
  cleanup() {
    if (this.eventEmitter) {
      this.eventEmitter.removeAllListeners();
    }
  }
}

export default new JustDialService();
