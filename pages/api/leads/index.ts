import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { calculateLeadScore } from '@/lib/ai-scoring';
import { createAutomationOrchestrator } from '@/lib/automation';
import ActivityLogger from '@/lib/activity-logger';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email || '' },
  });

  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  if (req.method === 'GET') {
    try {
      const { status, source, take = 50, skip = 0 } = req.query;

      const where: any = { userId: user.id };
      if (status && status !== 'all') where.status = status;
      if (source && source !== 'all') where.source = source;

      const leads = await prisma.lead.findMany({
        where,
        take: Number(take),
        skip: Number(skip),
        orderBy: { createdAt: 'desc' },
        include: {
          conversations: { take: 1 },
          activities: { take: 3 },
        },
      });

      return res.status(200).json(leads);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, email, phone, whatsapp, company, status, source, notes } =
        req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      // Create lead
      const lead = await prisma.lead.create({
        data: {
          name,
          email: email ? email.toLowerCase() : undefined,
          phone,
          whatsapp,
          company,
          status: status || 'new',
          source: source || 'manual',
          notes,
          userId: user.id,
        },
      });

      // Auto-score the lead
      const leadData = {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        source: lead.source,
        notes: lead.notes,
      };

      const { score } = calculateLeadScore(leadData);

      // Update lead with score
      const scoredLead = await prisma.lead.update({
        where: { id: lead.id },
        data: {
          score,
          lastAutoScoredAt: new Date(),
        },
      });

      // Log activity
      await ActivityLogger.logActivity({
        action: 'created',
        entity: 'Lead',
        entityId: lead.id,
        userId: user.id,
        leadId: lead.id,
        newValue: JSON.stringify({ name, email, phone, score }),
      });

      // Log automation - scoring action
      await ActivityLogger.logAutomationAction('auto_scored', lead.id, 'success', {
        score,
        source,
      });

      // Trigger hot lead engagement if score >= threshold (and phone available)
      const minScore = parseInt(process.env.AUTO_ENGAGE_MIN_SCORE || '70', 10);
      if (
        score >= minScore &&
        (scoredLead.whatsapp || scoredLead.phone) &&
        process.env.AUTO_ENGAGE_ENABLED === 'true'
      ) {
        try {
          const automation = createAutomationOrchestrator();
          const engagementResult = await automation.triggerHotLeadEngagement(lead.id);

          if (engagementResult.messageId) {
            console.log(`[Post Handler] Hot lead ${lead.id} auto-engaged via WhatsApp`);
          } else if (engagementResult.error) {
            console.warn(`[Post Handler] Failed to engage lead ${lead.id}:`, engagementResult.error);
          }
        } catch (engagementError) {
          console.error(`[Post Handler] Error triggering hot lead engagement:`, engagementError);
          // Don't fail the request - lead is already created and scored
        }
      }

      return res.status(201).json(scoredLead);
    } catch (error: any) {
      console.error('Error creating lead:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
