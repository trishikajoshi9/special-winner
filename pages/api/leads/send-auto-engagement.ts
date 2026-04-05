import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { createAutomationOrchestrator } from '@/lib/automation';

const prisma = new PrismaClient();

interface AutoEngageRequest {
  leadIds?: string[];
  forceResend?: boolean;
}

interface AutoEngageResponse {
  success: boolean;
  sent: number;
  failed: number;
  skipped: number;
  error?: string;
}

/**
 * POST /api/leads/send-auto-engagement
 * Batch trigger hot lead engagement (score >= threshold)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AutoEngageResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      sent: 0,
      failed: 0,
      skipped: 0,
      error: 'Method not allowed',
    });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({
        success: false,
        sent: 0,
        failed: 0,
        skipped: 0,
        error: 'Unauthorized',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user?.email || '' },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        sent: 0,
        failed: 0,
        skipped: 0,
        error: 'User not found',
      });
    }

    const { leadIds, forceResend = false } = req.body as AutoEngageRequest;

    const minScore = parseInt(process.env.AUTO_ENGAGE_MIN_SCORE || '70', 10);

    let leads;

    if (leadIds && leadIds.length > 0) {
      // Engage specific leads
      leads = await prisma.lead.findMany({
        where: {
          userId: user.id,
          id: { in: leadIds },
        },
      });
    } else {
      // Find hot leads not yet engaged
      leads = await prisma.lead.findMany({
        where: {
          userId: user.id,
          score: { gte: minScore },
          ...(forceResend ? {} : { lastAutoEngagedAt: null }), // Only if not already engaged
          OR: [{ phone: { not: null } }, { whatsapp: { not: null } }], // Has phone number
        },
        take: 50,
      });
    }

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    const automation = createAutomationOrchestrator();

    for (const lead of leads) {
      try {
        // Check if should send
        if (!forceResend && lead.lastAutoEngagedAt) {
          skipped++;
          continue;
        }

        if (lead.score < minScore && !forceResend) {
          skipped++;
          continue;
        }

        // Trigger engagement
        const result = await automation.triggerHotLeadEngagement(lead.id, forceResend);

        if (result.messageId) {
          sent++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Error engaging lead ${lead.id}:`, error);
        failed++;
      }
    }

    return res.status(200).json({
      success: true,
      sent,
      failed,
      skipped,
    });
  } catch (error) {
    console.error('Error in auto-engagement endpoint:', error);
    return res.status(500).json({
      success: false,
      sent: 0,
      failed: 0,
      skipped: 0,
      error: 'Internal server error',
    });
  }
}
