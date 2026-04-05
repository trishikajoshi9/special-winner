import { create } from 'zustand';
import { User, Lead, Conversation, AppConfig } from '@types/index';

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, token: null }),
}));

interface LeadStore {
  leads: Lead[];
  selectedLead: Lead | null;
  isLoading: boolean;
  setLeads: (leads: Lead[]) => void;
  addLead: (lead: Lead) => void;
  updateLead: (lead: Lead) => void;
  selectLead: (lead: Lead | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useLeadStore = create<LeadStore>((set) => ({
  leads: [],
  selectedLead: null,
  isLoading: false,
  setLeads: (leads) => set({ leads }),
  addLead: (lead) => set((state) => ({ leads: [lead, ...state.leads] })),
  updateLead: (lead) => set((state) => ({
    leads: state.leads.map((l) => l.id === lead.id ? lead : l),
  })),
  selectLead: (lead) => set({ selectedLead: lead }),
  setLoading: (isLoading) => set({ isLoading }),
}));

interface ChatStore {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  isLoading: boolean;
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversation: Conversation) => void;
  selectConversation: (conversation: Conversation | null) => void;
  addMessage: (conversationId: string, message: Message) => void;
  setLoading: (loading: boolean) => void;
}

import { Message } from '@types/index';

export const useChatStore = create<ChatStore>((set) => ({
  conversations: [],
  selectedConversation: null,
  isLoading: false,
  setConversations: (conversations) => set({ conversations }),
  addConversation: (conversation) => set((state) => ({
    conversations: [conversation, ...state.conversations],
  })),
  updateConversation: (conversation) => set((state) => ({
    conversations: state.conversations.map((c) => c.id === conversation.id ? conversation : c),
  })),
  selectConversation: (conversation) => set({ selectedConversation: conversation }),
  addMessage: (conversationId, message) => set((state) => ({
    conversations: state.conversations.map((c) =>
      c.id === conversationId
        ? { ...c, messages: [...c.messages, message] }
        : c
    ),
  })),
  setLoading: (isLoading) => set({ isLoading }),
}));

interface ConfigStore {
  config: AppConfig | null;
  updateConfig: (config: Partial<AppConfig>) => void;
  setConfig: (config: AppConfig) => void;
}

export const useConfigStore = create<ConfigStore>((set) => ({
  config: null,
  setConfig: (config) => set({ config }),
  updateConfig: (update) => set((state) => ({
    config: state.config ? { ...state.config, ...update } : null,
  })),
}));
