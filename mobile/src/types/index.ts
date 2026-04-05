// Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
}

// Lead Types
export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  company?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  source: 'manual' | 'whatsapp' | 'email' | 'justdial' | 'form' | 'api';
  score: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Chat Types
export interface Message {
  id: string;
  content: string;
  senderType: 'user' | 'ai' | 'system' | 'lead';
  senderName?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: string;
  leadId: string;
  platform: 'whatsapp' | 'email' | 'chat' | 'n8n';
  title?: string;
  messages: Message[];
  status: 'active' | 'closed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// WhatsApp/Aisensy Types
export interface WhatsAppContact {
  phoneNumber: string;
  displayName: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

export interface WhatsAppMessage {
  id: string;
  phoneNumber: string;
  message: string;
  senderType: 'incoming' | 'outgoing';
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
}

// JustDial Types
export interface JustDialLead {
  id: string;
  name: string;
  phone: string;
  company?: string;
  category?: string;
  notificationTime: string;
  source: 'justdial_notification' | 'justdial_sync';
}

export interface InstalledApp {
  packageName: string;
  appName: string;
  icon: string;
  isSystemApp: boolean;
  installTime: number;
}

// Config Types
export interface AppConfig {
  isJustDialLinked: boolean;
  justDialPermissions: string[];
  autoReplyEnabled: boolean;
  aiResponseEnabled: boolean;
  whatsappProvider: 'aisensy' | 'meta';
  notificationEnabled: boolean;
  syncIntervalMinutes: number;
}

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  webhookUrl: string;
}

// Navigation Types
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Dashboard: undefined;
  Chat: { leadId: string; contactName: string };
  ChatList: undefined;
  Config: undefined;
  JustDialConfig: undefined;
};

export type BottomTabParamList = {
  Dashboard: undefined;
  ChatList: undefined;
  Config: undefined;
};
