import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email || '' },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const [totalLeads, newLeads, contacted, converted] = await Promise.all([
      prisma.lead.count({ where: { userId: user.id } }),
      prisma.lead.count({ where: { userId: user.id, status: 'new' } }),
      prisma.lead.count({ where: { userId: user.id, status: 'contacted' } }),
      prisma.lead.count({ where: { userId: user.id, status: 'converted' } }),
    ]);

    return res.status(200).json({
      totalLeads,
      newLeads,
      contacted,
      converted,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
