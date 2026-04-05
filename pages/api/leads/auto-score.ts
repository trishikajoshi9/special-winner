import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { calculateLeadScore } from '@/lib/ai-scoring';
import ActivityLogger from '@/lib/activity-logger';

const prisma = new PrismaClient();

interface AutoScoreRequest {
  leadIds?: string[];
  scoreAll?: boolean;
}

interface AutoScoreResponse {
  success: boolean;
  scored: number;
  updated: number;
  skipped: number;
  error?: string;
}

/**
 * POST /api/leads/auto-score
 * Batch re-score leads (triggered by cron or manual request)
 * Can score specific leads or all leads
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AutoScoreResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      scored: 0,
      updated: 0,
      skipped: 0,
      error: 'Method not allowed',
    });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({
        success: false,
        scored: 0,
        updated: 0,
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
        scored: 0,
        updated: 0,
        skipped: 0,
        error: 'User not found',
      });
    }

    const { leadIds, scoreAll } = req.body as AutoScoreRequest;

    let leads;

    if (scoreAll) {
      // Score all active leads
      leads = await prisma.lead.findMany({
        where: {
          userId: user.id,
          status: { in: ['new', 'contacted'] },
        },
        take: 100, // Batch limit
      });
    } else if (leadIds && leadIds.length > 0) {
      // Score specific leads
      leads = await prisma.lead.findMany({
        where: {
          userId: user.id,
          id: { in: leadIds },
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        scored: 0,
        updated: 0,
        skipped: 0,
        error: 'Must provide leadIds or scoreAll=true',
      });
    }

    let scored = 0;
    let updated = 0;
    let skipped = 0;

    for (const lead of leads) {
      try {
        const leadData = {
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          source: lead.source,
          notes: lead.notes,
        };

        const { score } = calculateLeadScore(leadData);

        // Check if score changed
        if (score !== lead.score) {
          const oldScore = lead.score;

          // Update lead
          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              score,
              lastAutoScoredAt: new Date(),
            },
          });

          updated++;

          // Log activity
          await ActivityLogger.logActivity({
            action: 'updated',
            entity: 'Lead',
            entityId: lead.id,
            userId: user.id,
            leadId: lead.id,
            oldValue: JSON.stringify({ score: oldScore }),
            newValue: JSON.stringify({ score }),
          });
        }

        scored++;
      } catch (error) {
        console.error(`Error scoring lead ${lead.id}:`, error);
        skipped++;
      }
    }

    return res.status(200).json({
      success: true,
      scored,
      updated,
      skipped,
    });
  } catch (error) {
    console.error('Error in auto-score endpoint:', error);
    return res.status(500).json({
      success: false,
      scored: 0,
      updated: 0,
      skipped: 0,
      error: 'Internal server error',
    });
  }
}
