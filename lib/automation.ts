import { PrismaClient } from '@prisma/client';
import { createAisensySDK } from './aisensy';
import { predictNextAction } from './ai-scoring';
import ActivityLogger from './activity-logger';

const prisma = new PrismaClient();

/**
 * Automation Orchestrator
 * Handles all lead automation workflows:
 * - Triggering hot lead engagement
 * - Handling customer replies
 * - Sending follow-up messages
 * - Generating AI responses
 */
export class AutomationOrchestrator {
  private aisensy: ReturnType<typeof createAisensySDK> | null = null;

  constructor() {
    const apiKey = process.env.AISENSY_API_KEY;
    const apiUrl = process.env.AISENSY_API_URL;
    const webhookSecret = process.env.AISENSY_WEBHOOK_SECRET || '';

    if (apiKey && apiUrl) {
      this.aisensy = createAisensySDK(apiKey, apiUrl, webhookSecret);
    }
  }

  /**
   * Trigger hot lead engagement (score >= 70)
   * Called automatically when lead is created/scored
   */
  async triggerHotLeadEngagement(leadId: string, forceResend: boolean = false): Promise<{
    conversationId?: string;
    messageId?: string;
    error?: string;
  }> {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
      });

      if (!lead) {
        return { error: 'Lead not found' };
      }

      // Check if should send (score >= threshold)
      const minScore = parseInt(process.env.AUTO_ENGAGE_MIN_SCORE || '70', 10);
      if (lead.score < minScore) {
        return { error: `Lead score ${lead.score} is below threshold ${minScore}` };
      }

      // Check if already engaged (unless forcing resend)
      if (!forceResend && lead.lastAutoEngagedAt) {
        return { error: 'Lead already engaged' };
      }

      // Get phone number for WhatsApp
      const phoneNumber = lead.whatsapp || lead.phone;
      if (!phoneNumber) {
        await ActivityLogger.logAutomationAction('auto_engaged', leadId, 'failed', {
          error: 'No phone number available',
        });
        return { error: 'No phone number available for WhatsApp' };
      }

      if (!this.aisensy) {
        return { error: 'Aisensy not configured' };
      }

      // Generate personalized message
      const message = await this.generateEngagementMessage(lead);

      // Send via Aisensy
      const result = await this.aisensy.sendWhatsAppMessage(phoneNumber, message);

      if (!result.messageId || result.status === 'failed') {
        await ActivityLogger.logAutomationAction('auto_engaged', leadId, 'failed', {
          error: result.error,
          phone: phoneNumber,
        });
        return { error: result.error || 'Failed to send message' };
      }

      // Create conversation
      const conversation = await prisma.conversation.create({
        data: {
          leadId,
          platform: 'whatsapp',
          externalId: result.messageId,
          status: 'active',
        },
      });

      // Create message record
      await prisma.message.create({
        data: {
          content: message,
          senderType: 'system',
          conversationId: conversation.id,
          metadata: JSON.stringify({
            aisensy_message_id: result.messageId,
            auto_sent: true,
            hot_lead: true,
          }),
        },
      });

      // Update lead
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          status: 'contacted',
          lastAutoEngagedAt: new Date(),
          autoEngagementCount: { increment: 1 },
        },
      });

      // Log activity
      await ActivityLogger.logActivity({
        action: 'auto_contacted',
        entity: 'Lead',
        entityId: leadId,
        userId: lead.userId,
        leadId,
        newValue: JSON.stringify({ score: lead.score, method: 'whatsapp' }),
      });

      // Log automation action
      await ActivityLogger.logAutomationAction('auto_engaged', leadId, 'success', {
        messageId: result.messageId,
        score: lead.score,
        engagementCount: lead.autoEngagementCount + 1,
      });

      return {
        conversationId: conversation.id,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('Error triggering hot lead engagement:', error);
      await ActivityLogger.logAutomationAction('auto_engaged', leadId, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return { error: 'Internal error' };
    }
  }

  /**
   * Handle incoming customer reply
   * Called from webhook when customer sends WhatsApp message
   */
  async handleCustomerReply(phoneNumber: string, message: string): Promise<{
    processed: boolean;
    leadId?: string;
    requiresHumanReview: boolean;
  }> {
    try {
      // Find lead by phone
      const lead = await prisma.lead.findFirst({
        where: {
          OR: [
            { phone: phoneNumber },
            { whatsapp: phoneNumber },
          ],
        },
      });

      if (!lead) {
        return { processed: false, requiresHumanReview: false };
      }

      // Get conversation
      const conversation = await prisma.conversation.findFirst({
        where: {
          leadId: lead.id,
          platform: 'whatsapp',
        },
      });

      if (!conversation) {
        return { processed: false, leadId: lead.id, requiresHumanReview: true };
      }

      // Store message
      await prisma.message.create({
        data: {
          content: message,
          senderType: 'lead',
          conversationId: conversation.id,
        },
      });

      // Update lead to qualified
      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: 'qualified' },
      });

      // Generate AI response if enabled
      const shouldRespond = process.env.AI_RESPONSE_ENABLED === 'true';
      if (shouldRespond) {
        const response = await this.generateAutomatedResponse(lead, message);
        if (response && response.shouldSend && this.aisensy) {
          const result = await this.aisensy.replyToCustomer(phoneNumber, response.response);
          if (result.messageId && result.status !== 'failed') {
            // Message sent successfully
            await ActivityLogger.logAutomationAction('auto_response_sent', lead.id, 'success', {
              messageId: result.messageId,
              confidence: response.confidence,
            });
          }
        }
      }

      // Log automation action
      await ActivityLogger.logAutomationAction('reply_received', lead.id, 'success', {
        message: message.substring(0, 100),
        requiresReview: !shouldRespond,
      });

      return {
        processed: true,
        leadId: lead.id,
        requiresHumanReview: !shouldRespond,
      };
    } catch (error) {
      console.error('Error handling customer reply:', error);
      return { processed: false, requiresHumanReview: true };
    }
  }

  /**
   * Send follow-up message to non-responsive hot leads
   * Called by cron job every 4 hours
   */
  async sendFollowupMessage(
    leadId: string,
    followupType: 'reminder' | 'nurture' | 'urgency' = 'reminder'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
      });

      if (!lead) {
        return { success: false, error: 'Lead not found' };
      }

      // Check if should send follow-up (contacted but no response)
      if (lead.status !== 'contacted') {
        return { success: false, error: 'Lead not in contacted status' };
      }

      // Check last message time
      const lastMessage = await prisma.message.findFirst({
        where: {
          conversation: {
            leadId,
            platform: 'whatsapp',
          },
          senderType: 'lead',
        },
        orderBy: { createdAt: 'desc' },
      });

      const thresholdHours = parseInt(process.env.AUTO_FOLLOWUP_HOURS_THRESHOLD || '24', 10);
      if (lastMessage) {
        const hoursSinceReply = (Date.now() - lastMessage.createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceReply < thresholdHours) {
          return { success: false, error: 'Last reply too recent' };
        }
      }

      const phoneNumber = lead.whatsapp || lead.phone;
      if (!phoneNumber || !this.aisensy) {
        return { success: false, error: 'Phone or Aisensy not available' };
      }

      // Generate follow-up message
      const message = this.generateFollowupMessage(lead, followupType);

      // Send
      const result = await this.aisensy.sendWhatsAppMessage(phoneNumber, message);

      if (!result.messageId || result.status === 'failed') {
        await ActivityLogger.logAutomationAction('follow_up', leadId, 'failed', {
          error: result.error,
          type: followupType,
        });
        return { success: false, error: result.error };
      }

      // Update lead
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          lastAutoFollowupAt: new Date(),
        },
      });

      // Log automation action
      await ActivityLogger.logAutomationAction('follow_up', leadId, 'success', {
        messageId: result.messageId,
        type: followupType,
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending follow-up message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Internal error',
      };
    }
  }

  /**
   * Generate personalized engagement message for hot lead
   */
  private async generateEngagementMessage(lead: any): Promise<string> {
    const { action, suggestedMessage } = predictNextAction(lead, lead.score);

    if (suggestedMessage) {
      return suggestedMessage;
    }

    // Fallback messages
    const messages = [
      `Hi ${lead.name}! 👋 Thanks for reaching out. I'd love to help you with ${lead.company || 'your business'}. How can I assist?`,
      `Hi ${lead.name}! Thanks for getting in touch. I have some great options for you. Let's chat? 💬`,
      `Hello ${lead.name}! 🎯 Perfect timing - we have something that could really help. When are you free to connect?`,
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Generate AI-powered follow-up message
   */
  private generateFollowupMessage(lead: any, type: string): string {
    const followupMessages: Record<string, string[]> = {
      reminder: [
        `${lead.name}, just checking in 👋 Still interested in exploring options for ${lead.company || 'your business'}?`,
        `Hi ${lead.name}! Did you get a chance to think about it? Let me know how I can help! 😊`,
      ],
      nurture: [
        `${lead.name}, I think you'd benefit from knowing about... (let me share some valuable insights 💡)`,
        `${lead.name}, before you decide, let me show you how others like you have benefited 📈`,
      ],
      urgency: [
        `${lead.name}! Just wanted to let you know - this offer is time-sensitive ⏰ 50% off for the next 24hrs!`,
        `${lead.name}, slots are filling up fast! Would love to reserve one for you 🔥`,
      ],
    };

    const messages = followupMessages[type] || followupMessages.reminder;
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Generate AI response to customer message
   * Only sends if confidence is above threshold
   */
  private async generateAutomatedResponse(
    lead: any,
    customerMessage: string
  ): Promise<{ response: string; confidence: number; shouldSend: boolean } | null> {
    try {
      // Simple keyword-based response generator
      // In production, would call a real AI service

      const lowerMessage = customerMessage.toLowerCase();
      const responses: Record<string, { text: string; confidence: number }> = {
        price: {
          text: `Great question! Our pricing is flexible based on your needs. Let's set up a quick call to find the perfect plan for you. Available today?`,
          confidence: 0.9,
        },
        features: {
          text: `Our platform includes lead management, AI scoring, WhatsApp integration, analytics, and more! Would you like me to show you a quick demo?`,
          confidence: 0.88,
        },
        demo: {
          text: `Absolutely! I can walk you through the platform in just 10 minutes. How's your schedule looking?`,
          confidence: 0.95,
        },
        trial: {
          text: `Perfect! We offer a 14-day free trial - no credit card needed. Want me to send you the signup link?`,
          confidence: 0.92,
        },
      };

      const threshold = parseFloat(process.env.AI_RESPONSE_CONFIDENCE_THRESHOLD || '0.85');

      for (const [keyword, { text, confidence }] of Object.entries(responses)) {
        if (lowerMessage.includes(keyword) && confidence >= threshold) {
          return { response: text, confidence, shouldSend: true };
        }
      }

      // No confident response found
      return null;
    } catch (error) {
      console.error('Error generating automated response:', error);
      return null;
    }
  }
}

export const createAutomationOrchestrator = () => {
  return new AutomationOrchestrator();
};

export default AutomationOrchestrator;
