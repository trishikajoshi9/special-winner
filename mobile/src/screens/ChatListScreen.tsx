import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  FlatList,
  Dimensions,
  Modal,
} from 'react-native';
import { useChatStore, useLeadStore } from '@store/index';
import apiService from '@services/api';

interface ChatListScreenProps {
  navigation: any;
}

const ChatListScreen: React.FC<ChatListScreenProps> = ({ navigation }) => {
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [whatsappContacts, setWhatsappContacts] = useState<any[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const { conversations, setConversations } = useChatStore();
  const { leads } = useLeadStore();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const data = await apiService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const loadWhatsAppContacts = async () => {
    setIsLoadingContacts(true);
    try {
      const contacts = await apiService.getAisensyContacts();
      setWhatsappContacts(contacts);
      setShowNewChatModal(true);
    } catch (error) {
      console.error('Error loading WhatsApp contacts:', error);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const startNewChat = async (contact: any) => {
    try {
      // Create new conversation for this contact
      const lead = leads.find((l) => l.phone === contact.phoneNumber || l.whatsapp === contact.phoneNumber);

      if (lead) {
        setShowNewChatModal(false);
        navigation.navigate('Chat', { leadId: lead.id });
      }
    } catch (error) {
      console.error('Error starting new chat:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={loadWhatsAppContacts}
        >
          <Text style={styles.addButtonText}>➕</Text>
        </TouchableOpacity>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySubtitle}>Start chatting with leads</Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={loadWhatsAppContacts}
          >
            <Text style={styles.startButtonText}>Start New Chat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const lastMessage = item.messages?.[item.messages.length - 1];
            const lead = leads.find((l) => l.id === item.leadId);

            return (
              <TouchableOpacity
                style={styles.conversationCard}
                onPress={() => navigation.navigate('Chat', { leadId: item.leadId })}
              >
                <View style={styles.conversationHeader}>
                  <Text style={styles.conversationName}>
                    {lead?.name || 'Unknown'}
                  </Text>
                  <Text style={styles.conversationTime}>
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.conversationPreview} numberOfLines={1}>
                  {lastMessage?.content || 'No messages yet'}
                </Text>
                <View style={styles.conversationFooter}>
                  <Text style={styles.conversationPlatform}>
                    {item.platform === 'whatsapp' ? '💬 WhatsApp' : item.platform}
                  </Text>
                  <View style={styles.conversationStatus}>
                    <View style={[
                      styles.statusDot,
                      item.status === 'active' && styles.statusActive,
                    ]} />
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* New Chat Modal */}
      <Modal
        visible={showNewChatModal}
        animationType="slide"
        onRequestClose={() => setShowNewChatModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNewChatModal(false)}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Contact</Text>
            <View style={{ width: 40 }} />
          </View>

          {isLoadingContacts ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : (
            <FlatList
              data={whatsappContacts}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.contactCard}
                  onPress={() => startNewChat(item)}
                >
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactAvatarText}>
                      {item.displayName?.[0]?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{item.displayName}</Text>
                    <Text style={styles.contactPhone}>{item.phoneNumber}</Text>
                  </View>
                  <Text style={styles.contactArrow}>→</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.contactsList}
            />
          )}
        </SafeAreaView>
      </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  startButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  startButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  conversationCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  conversationTime: {
    fontSize: 12,
    color: '#999',
  },
  conversationPreview: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationPlatform: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  conversationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginRight: 4,
  },
  statusActive: {
    backgroundColor: '#34C759',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalCloseText: {
    fontSize: 24,
    color: '#007AFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  contactsList: {
    padding: 12,
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactAvatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  contactPhone: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  contactArrow: {
    fontSize: 18,
    color: '#007AFF',
  },
});

export default ChatListScreen;
