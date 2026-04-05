import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { WebhookValidator } from '@/lib/webhook-validator';
import ActivityLogger from '@/lib/activity-logger';

const prisma = new PrismaClient();
const webhookValidator = new WebhookValidator();

interface AisensyMessagePayload {
  phoneNumber: string;
  message: string;
  messageId: string;
  timestamp: string;
}

interface WebhookResponse {
  status: string;
  message?: string;
  leadId?: string;
}

/**
 * POST /api/webhooks/aisensy/message
 * Receives customer WhatsApp replies from Aisensy
 * Validates signature, stores message, updates lead status
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WebhookResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  try {
    // Validate webhook signature
    const signature = req.headers['x-webhook-signature'] as string;
    const secret = process.env.AISENSY_WEBHOOK_SECRET;

    if (!signature || !secret) {
      console.warn('Missing webhook signature or secret');
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const isValid = webhookValidator.verifyAisensyWebhook(rawBody, signature, secret);

    if (!isValid) {
      console.warn('Invalid webhook signature');
      return res.status(401).json({ status: 'error', message: 'Invalid signature' });
    }

    const payload = req.body as AisensyMessagePayload;
    const { phoneNumber, message, messageId, timestamp } = payload;

    // Extract phone number (normalize)
    const normalizedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    // Find lead by phone number
    const lead = await prisma.lead.findFirst({
      where: {
        OR: [
          { phone: normalizedPhone },
          { phone: phoneNumber },
          { whatsapp: normalizedPhone },
          { whatsapp: phoneNumber },
        ],
      },
    });

    if (!lead) {
      console.warn(`No lead found for phone: ${phoneNumber}`);
      return res.status(200).json({
        status: 'processed',
        message: 'Message received but no matching lead found',
      });
    }

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        leadId: lead.id,
        platform: 'whatsapp',
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          leadId: lead.id,
          platform: 'whatsapp',
          externalId: messageId,
          status: 'active',
        },
      });
    }

    // Create message record
    await prisma.message.create({
      data: {
        content: message,
        senderType: 'lead',
        conversationId: conversation.id,
        metadata: JSON.stringify({
          aisensy_message_id: messageId,
          received_at: timestamp,
          phone: phoneNumber,
        }),
      },
    });

    // Update lead status to "qualified" (customer responded)
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: 'qualified',
        updatedAt: new Date(),
      },
    });

    // Log activity
    await ActivityLogger.logActivity({
      action: 'replied',
      entity: 'Lead',
      entityId: lead.id,
      userId: lead.userId,
      leadId: lead.id,
      newValue: JSON.stringify({ message, senderType: 'lead' }),
    });

    // Log automation action
    await ActivityLogger.logAutomationAction('reply_received', lead.id, 'success', {
      messageId,
      phone: phoneNumber,
      message: message.substring(0, 100),
    });

    // Log webhook event
    await webhookValidator.logWebhookEvent('aisensy', payload, true, {
      leadId: lead.id,
      conversationId: conversation.id,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Message processed successfully',
      leadId: lead.id,
    });
  } catch (error) {
    console.error('Error processing Aisensy webhook:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}
