import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const leadsCount = await prisma.lead.count();
      const usersCount = await prisma.user.count();
      const conversationsCount = await prisma.conversation.count();
      const messagesCount = await prisma.message.count();

      return res.status(200).json({
        status: 'healthy',
        database: 'connected',
        timestamp: new Date(),
        stats: {
          totalLeads: leadsCount,
          totalUsers: usersCount,
          totalConversations: conversationsCount,
          totalMessages: messagesCount,
        },
      });
    } catch (error: any) {
      return res.status(503).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
