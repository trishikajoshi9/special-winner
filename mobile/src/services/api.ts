import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Lead, Conversation, WhatsAppContact } from '@types/index';

class ApiService {
  private api: AxiosInstance;
  private baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
    });

    // Add token to requests
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Handle responses
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await AsyncStorage.removeItem('auth_token');
          // Emit logout event
        }
        return Promise.reject(error);
      }
    );
  }

  // ===== Authentication =====
  async loginWithEmail(email: string, password: string) {
    const { data } = await this.api.post('/api/auth/signin', { email, password });
    if (data.token) {
      await AsyncStorage.setItem('auth_token', data.token);
    }
    return data;
  }

  async loginWithGmail(gmailCode: string) {
    const { data } = await this.api.post('/api/auth/gmail/mobile', { code: gmailCode });
    if (data.token) {
      await AsyncStorage.setItem('auth_token', data.token);
    }
    return data;
  }

  async getProfile(): Promise<User> {
    const { data } = await this.api.get('/api/user/profile');
    return data;
  }

  // ===== Leads =====
  async getLeads(status?: string, source?: string): Promise<Lead[]> {
    const { data } = await this.api.get('/api/leads', {
      params: { status, source, take: 50 },
    });
    return data;
  }

  async getLead(id: string): Promise<Lead> {
    const { data } = await this.api.get(`/api/leads/${id}`);
    return data;
  }

  async createLead(lead: Partial<Lead>): Promise<Lead> {
    const { data } = await this.api.post('/api/leads', lead);
    return data;
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    const { data } = await this.api.put(`/api/leads/${id}`, updates);
    return data;
  }

  async scoreLead(id: string) {
    const { data } = await this.api.post(`/api/leads/score`, { leadId: id });
    return data;
  }

  // ===== Chats & Messages =====
  async getConversations(leadId?: string): Promise<Conversation[]> {
    const { data } = await this.api.get('/api/conversations', {
      params: { leadId },
    });
    return data;
  }

  async getConversation(id: string): Promise<Conversation> {
    const { data } = await this.api.get(`/api/conversations/${id}`);
    return data;
  }

  async sendMessage(conversationId: string, content: string) {
    const { data } = await this.api.post('/api/messages', {
      conversationId,
      content,
    });
    return data;
  }

  // ===== WhatsApp Integration =====
  async getWhatsAppContacts(): Promise<WhatsAppContact[]> {
    const { data } = await this.api.get('/api/integrations/whatsapp/contacts');
    return data;
  }

  async sendWhatsAppMessage(phoneNumber: string, message: string) {
    const { data } = await this.api.post('/api/integrations/whatsapp/send', {
      phoneNumber,
      message,
    });
    return data;
  }

  async getAisensyContacts(): Promise<WhatsAppContact[]> {
    const { data } = await this.api.get('/api/integrations/aisensy/contacts');
    return data;
  }

  // ===== Auto-Engagement =====
  async triggerAutoEngagement(leadId: string) {
    const { data } = await this.api.post(`/api/leads/send-auto-engagement`, {
      leadIds: [leadId],
    });
    return data;
  }

  // ===== JustDial Integration =====
  async getJustDialLeads(): Promise<any[]> {
    const { data } = await this.api.get('/api/integrations/justdial/leads');
    return data;
  }

  async linkJustDialLead(leadId: string, justDialId: string) {
    const { data } = await this.api.post('/api/integrations/justdial/link', {
      leadId,
      justDialId,
    });
    return data;
  }

  // ===== Analytics =====
  async getDashboardStats() {
    const { data } = await this.api.get('/api/dashboard/stats');
    return data;
  }

  async getConversionMetrics() {
    const { data } = await this.api.get('/api/analytics');
    return data;
  }

  // ===== Config =====
  async getConfig() {
    const { data } = await this.api.get('/api/config');
    return data;
  }

  async updateConfig(config: any) {
    const { data } = await this.api.put('/api/config', config);
    return data;
  }
}

export default new ApiService();
