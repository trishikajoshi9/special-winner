import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { calculateLeadScore } from '@/lib/ai-scoring';
import ActivityLogger from '@/lib/activity-logger';

const prisma = new PrismaClient();

interface ImportLeadPayload {
  name: string;
  email?: string;
  phone?: string;
  subject?: string;
  source?: string;
  userId: string;
}

interface ImportResponse {
  success: boolean;
  leadId?: string;
  score?: number;
  message: string;
}

/**
 * POST /api/webhooks/leads/import
 * Entry point for n8n Gmail polling workflow
 * Receives: { name, email, phone, subject, source, userId }
 * Creates lead + auto-scores + returns score
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ImportResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { name, email, phone, subject, source = 'email', userId } = req.body as ImportLeadPayload;

    // Validate required fields
    if (!name || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, userId',
      });
    }

    // Check if lead already exists (deduplication)
    if (email) {
      const existingLead = await prisma.lead.findFirst({
        where: {
          email: email.toLowerCase(),
          userId,
        },
      });

      if (existingLead) {
        return res.status(200).json({
          success: true,
          leadId: existingLead.id,
          score: existingLead.score,
          message: 'Lead already exists',
        });
      }
    }

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        name,
        email: email ? email.toLowerCase() : undefined,
        phone: phone || undefined,
        source,
        notes: subject || undefined,
        userId,
        status: 'new',
      },
    });

    // Log activity
    await ActivityLogger.logActivity({
      action: 'created',
      entity: 'Lead',
      entityId: lead.id,
      userId,
      leadId: lead.id,
      newValue: JSON.stringify({ name, email, phone, source }),
    });

    // Auto-score the lead
    const leadData = {
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      company: lead.company,
      notes: lead.notes,
    };

    const { score } = calculateLeadScore(leadData);

    // Update lead with score
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        score,
        lastAutoScoredAt: new Date(),
      },
    });

    // Log automation action
    await ActivityLogger.logAutomationAction('auto_scored', lead.id, 'success', {
      score,
      factors: { email, phone, source },
    });

    return res.status(200).json({
      success: true,
      leadId: lead.id,
      score,
      message: 'Lead imported and scored successfully',
    });
  } catch (error) {
    console.error('Error importing lead:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
