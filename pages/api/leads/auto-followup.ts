import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { createAutomationOrchestrator } from '@/lib/automation';

const prisma = new PrismaClient();

interface AutoFollowupRequest {
  leadIds?: string[];
  hoursWithoutResponse?: number;
  followupType?: 'reminder' | 'nurture' | 'urgency';
}

interface AutoFollowupResponse {
  success: boolean;
  sent: number;
  failed: number;
  skipped: number;
  error?: string;
}

/**
 * POST /api/leads/auto-followup
 * Send follow-up messages to non-responsive contacted leads
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AutoFollowupResponse>
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

    const {
      leadIds,
      hoursWithoutResponse = 24,
      followupType = 'reminder',
    } = req.body as AutoFollowupRequest;

    const minScore = parseInt(process.env.AUTO_ENGAGE_MIN_SCORE || '70', 10);
    const threshold = new Date(Date.now() - hoursWithoutResponse * 60 * 60 * 1000);

    let leads;

    if (leadIds && leadIds.length > 0) {
      // Follow-up specific leads
      leads = await prisma.lead.findMany({
        where: {
          userId: user.id,
          id: { in: leadIds },
        },
      });
    } else {
      // Find leads that need follow-ups
      leads = await prisma.lead.findMany({
        where: {
          userId: user.id,
          status: 'contacted', // Was contacted but not yet qualified
          score: { gte: minScore },
          lastAutoEngagedAt: { lt: threshold }, // Was engaged > threshold hours ago
          OR: [{ phone: { not: null } }, { whatsapp: { not: null } }], // Has phone
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
        // Check if should send follow-up
        if (!leadIds) {
          // Auto-detect type based on engagement count
          const type = lead.autoEngagementCount >= 2 ? 'urgency' : lead.autoEngagementCount === 1 ? 'nurture' : 'reminder';

          // Check if already followed up recently
          if (lead.lastAutoFollowupAt) {
            const hoursSinceFollowup = (Date.now() - lead.lastAutoFollowupAt.getTime()) / (1000 * 60 * 60);
            if (hoursSinceFollowup < 12) {
              // Don't follow-up more than twice every 24h
              skipped++;
              continue;
            }
          }

          const result = await automation.sendFollowupMessage(lead.id, type);
          if (result.success) {
            sent++;
          } else {
            failed++;
          }
        }
      } catch (error) {
        console.error(`Error sending follow-up for lead ${lead.id}:`, error);
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
    console.error('Error in auto-followup endpoint:', error);
    return res.status(500).json({
      success: false,
      sent: 0,
      failed: 0,
      skipped: 0,
      error: 'Internal server error',
    });
  }
}
