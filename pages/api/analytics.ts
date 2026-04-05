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
    const { range = 'week' } = req.query;

    const now = new Date();
    let startDate = new Date();

    if (range === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (range === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (range === 'year') {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    const leads = await prisma.lead.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: startDate },
      },
      include: { activities: true },
    });

    // Calculate status distribution
    const statusNew = leads.filter((l) => l.status === 'new').length;
    const statusContacted = leads.filter((l) => l.status === 'contacted').length;
    const statusQualified = leads.filter((l) => l.status === 'qualified').length;
    const statusConverted = leads.filter((l) => l.status === 'converted').length;
    const statusLost = leads.filter((l) => l.status === 'lost').length;

    // Calculate source distribution
    const bySource: Record<string, number> = {};
    leads.forEach((lead) => {
      bySource[lead.source] = (bySource[lead.source] || 0) + 1;
    });

    // Calculate score trend (daily if week, weekly if month, monthly if year)
    const labels: string[] = [];
    const scoreTrend: number[] = [];

    if (range === 'week') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
        labels.push(dateStr);

        const dayLeads = leads.filter(
          (l) =>
            l.createdAt.toDateString() === date.toDateString() ||
            l.updatedAt.toDateString() === date.toDateString()
        );
        const avgScore =
          dayLeads.length > 0
            ? dayLeads.reduce((acc, l) => acc + l.score, 0) / dayLeads.length
            : 0;
        scoreTrend.push(avgScore);
      }
    } else if (range === 'month' || range === 'year') {
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
        labels.push(dateStr);

        const dayLeads = leads.filter(
          (l) =>
            l.createdAt.toDateString() === date.toDateString() ||
            l.updatedAt.toDateString() === date.toDateString()
        );
        const avgScore =
          dayLeads.length > 0
            ? dayLeads.reduce((acc, l) => acc + l.score, 0) / dayLeads.length
            : 0;
        scoreTrend.push(avgScore);
      }
    }

    return res.status(200).json({
      statusNew,
      statusContacted,
      statusQualified,
      statusConverted,
      statusLost,
      sourceLabels: Object.keys(bySource),
      sourceData: Object.values(bySource),
      labels,
      scoreTrend,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
