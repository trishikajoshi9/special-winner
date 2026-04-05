import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { useChatStore, useLeadStore } from '@store/index';
import apiService from '@services/api';

interface ChatScreenProps {
  route: any;
  navigation: any;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ route, navigation }) => {
  const { leadId } = route.params;
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [useAIReply, setUseAIReply] = useState(true);

  const { selectedConversation, setConversations, addMessage } = useChatStore();
  const { leads } = useLeadStore();
  const lead = leads.find((l) => l.id === leadId);

  useEffect(() => {
    fetchConversation();
  }, [leadId]);

  const fetchConversation = async () => {
    try {
      // Get all conversations for this lead
      const conversations = await apiService.getConversations(leadId);
      if (conversations.length > 0) {
        setConversations(conversations);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    const text = messageText;
    setMessageText('');
    setIsSending(true);

    try {
      if (selectedConversation) {
        // Send message via API
        const message = await apiService.sendMessage(selectedConversation.id, text);
        addMessage(selectedConversation.id, message);

        // If AI reply enabled, generate response
        if (useAIReply) {
          // Simulate AI thinking time
          setTimeout(() => {
            const aiResponse = generateAIResponse(text, lead?.name || 'Friend');
            addMessage(selectedConversation.id, {
              id: Math.random().toString(),
              content: aiResponse,
              senderType: 'ai',
              timestamp: new Date().toISOString(),
            });
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessageText(text); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  const generateAIResponse = (message: string, name: string): string => {
    const responses: Record<string, string[]> = {
      hi: ['Hello! How can I help you today?', 'Hi there! 👋'],
      price: ['Great question! Let me get you our pricing...', 'Our plans start at $29/month'],
      demo: ['I\'d love to show you a demo! When are you free?', 'Sure! Let me set that up for you'],
      thanks: ['You\'re welcome! 😊', 'Happy to help!'],
      help: ['Of course! What do you need help with?', 'I\'m here to help'],
    };

    const lowerMsg = message.toLowerCase();
    for (const [key, msgs] of Object.entries(responses)) {
      if (lowerMsg.includes(key)) {
        return msgs[Math.floor(Math.random() * msgs.length)];
      }
    }

    return `Thanks for reaching out ${name}! How can I assist you?`;
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const messages = selectedConversation?.messages || [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.contactName}>{lead?.name || 'Chat'}</Text>
          <Text style={styles.contactPhone}>{lead?.phone || lead?.whatsapp}</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isFromUser = item.senderType === 'user' || item.senderType === 'lead';

          return (
            <View
              style={[
                styles.messageBubbleContainer,
                isFromUser && styles.userBubbleContainer,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  isFromUser ? styles.userBubble : styles.aiBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    isFromUser && styles.userMessageText,
                  ]}
                >
                  {item.content}
                </Text>
                <Text style={styles.messageTime}>
                  {new Date(item.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          );
        }}
        inverted
        contentContainerStyle={styles.messagesList}
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={[styles.aiToggle, useAIReply && styles.aiToggleActive]}
            onPress={() => setUseAIReply(!useAIReply)}
          >
            <Text style={styles.aiToggleText}>🤖</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxHeight={100}
            editable={!isSending}
          />

          <TouchableOpacity
            style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>

        {useAIReply && (
          <Text style={styles.aiHint}>
            🤖 AI assist enabled - Replies will be auto-generated
          </Text>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
    width: 60,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  contactPhone: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  messageBubbleContainer: {
    marginVertical: 6,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  userBubbleContainer: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  aiBubble: {
    backgroundColor: '#e5e5ea',
  },
  userBubble: {
    backgroundColor: '#007AFF',
  },
  messageText: {
    fontSize: 14,
    color: '#000',
  },
  userMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  aiToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  aiToggleActive: {
    backgroundColor: '#fff3cd',
    borderColor: '#FF9500',
  },
  aiToggleText: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  aiHint: {
    fontSize: 11,
    color: '#FF9500',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ChatScreen;
