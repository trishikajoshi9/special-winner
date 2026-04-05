import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { createAisensySDK } from '@/lib/aisensy';
import ActivityLogger from '@/lib/activity-logger';

const prisma = new PrismaClient();

interface SendMessageRequest {
  leadId: string;
  phoneNumber: string;
  message: string;
  templateId?: string;
  userId: string;
}

interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  conversationId?: string;
  error?: string;
}

/**
 * POST /api/services/aisensy/send-message
 * Internal service endpoint to send WhatsApp messages
 * Called by: automation system when hot lead is identified
 * Should only be called from internal services, not exposed to frontend
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SendMessageResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { leadId, phoneNumber, message, templateId, userId } = req.body as SendMessageRequest;

    // Validate required fields
    if (!leadId || !phoneNumber || !message || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: leadId, phoneNumber, message, userId',
      });
    }

    // Verify API keys are configured
    const apiKey = process.env.AISENSY_API_KEY;
    const apiUrl = process.env.AISENSY_API_URL;

    if (!apiKey || !apiUrl) {
      console.error('Aisensy API credentials not configured');
      return res.status(500).json({
        success: false,
        error: 'Aisensy integration not configured',
      });
    }

    // Get lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    // Verify user ownership
    if (lead.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    // Initialize Aisensy SDK
    const aisensy = createAisensySDK(apiKey, apiUrl, process.env.AISENSY_WEBHOOK_SECRET || '');

    // Send message
    const sendResult = await aisensy.sendWhatsAppMessage(phoneNumber, message, {
      templateId,
    });

    if (!sendResult.messageId || sendResult.status === 'failed') {
      await ActivityLogger.logAutomationAction('auto_engaged', leadId, 'failed', {
        error: sendResult.error,
        phone: phoneNumber,
      });

      return res.status(500).json({
        success: false,
        error: sendResult.error || 'Failed to send message',
      });
    }

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        leadId,
        platform: 'whatsapp',
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          leadId,
          platform: 'whatsapp',
          externalId: sendResult.messageId,
          status: 'active',
          autoResponseEnabled: process.env.AISENSY_ENABLE_AUTO_REPLY === 'true',
        },
      });
    }

    // Create message record (system message indicating auto-send)
    const systemMessage = await prisma.message.create({
      data: {
        content: message,
        senderType: 'system',
        conversationId: conversation.id,
        metadata: JSON.stringify({
          aisensy_message_id: sendResult.messageId,
          auto_sent: true,
          sent_at: sendResult.timestamp,
          phone: phoneNumber,
        }),
      },
    });

    // Update lead status to "contacted"
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
      userId,
      leadId,
      newValue: JSON.stringify({ method: 'whatsapp', messageId: sendResult.messageId }),
    });

    // Log automation action
    await ActivityLogger.logAutomationAction('auto_engaged', leadId, 'success', {
      messageId: sendResult.messageId,
      phone: phoneNumber,
      conversationId: conversation.id,
    });

    return res.status(200).json({
      success: true,
      messageId: sendResult.messageId,
      conversationId: conversation.id,
    });
  } catch (error) {
    console.error('Error sending Aisensy message:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
