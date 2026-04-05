import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
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

  try {
    const totalLeads = await prisma.lead.count({
      where: { userId: user.id },
    });

    const newLeads = await prisma.lead.count({
      where: { userId: user.id, status: 'new' },
    });

    const qualifiedLeads = await prisma.lead.count({
      where: { userId: user.id, status: 'qualified' },
    });

    const convertedLeads = await prisma.lead.count({
      where: { userId: user.id, status: 'converted' },
    });

    const conversionRate =
      totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    // Calculate average score
    const leads = await prisma.lead.findMany({
      where: { userId: user.id },
      select: { score: true },
    });

    const avgScore =
      leads.length > 0
        ? leads.reduce((acc, l) => acc + l.score, 0) / leads.length
        : 0;

    // Get top 10 leads by score
    const topLeads = await prisma.lead.findMany({
      where: { userId: user.id },
      orderBy: { score: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        score: true,
        status: true,
        source: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      stats: {
        totalLeads,
        newLeads,
        qualifiedLeads,
        conversionRate,
        avgScore,
      },
      topLeads,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
