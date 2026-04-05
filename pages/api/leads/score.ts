import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { calculateLeadScore, predictNextAction } from '@/lib/ai-scoring';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  if (req.method === 'POST') {
    try {
      const { leadId } = req.body;

      // Get lead with related data
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          conversations: true,
          activities: true,
        },
      });

      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      // Calculate score
      const lastActivityDays = lead.updatedAt
        ? Math.floor(
            (Date.now() - lead.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
          )
        : 999;

      const { score, factors, recommendation } = calculateLeadScore({
        email: lead.email || '',
        name: lead.name,
        phone: lead.phone || '',
        company: lead.company || '',
        source: lead.source,
        conversationCount: lead.conversations.length,
        lastActivityDays,
      });

      const { action, urgency, suggestedMessage } = predictNextAction(
        {
          name: lead.name,
          email: lead.email || '',
        },
        score
      );

      // Update lead score in DB
      await prisma.lead.update({
        where: { id: leadId },
        data: { score },
      });

      return res.status(200).json({
        score,
        factors,
        recommendation,
        action,
        urgency,
        suggestedMessage,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
