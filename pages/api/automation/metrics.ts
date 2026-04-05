import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import ActivityLogger from '@/lib/activity-logger';

const prisma = new PrismaClient();

interface AutomationMetrics {
  hotLeads: number;
  totalLeads: number;
  messagesToday: number;
  successRate: number;
  averageResponseTime: number;
  failedWebhooks: number;
  lastAutoEngagementTime: string | null;
  conversionRate: number;
  revenueToday: number;
}

/**
 * GET /api/automation/metrics
 * Get real-time automation metrics for dashboard
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AutomationMetrics>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({} as AutomationMetrics);
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({} as AutomationMetrics);
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user?.email || '' },
    });

    if (!user) {
      return res.status(401).json({} as AutomationMetrics);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all leads
    const leads = await prisma.lead.findMany({
      where: { userId: user.id },
    });

    const hotLeads = leads.filter((l) => l.score >= 70);
    const contacted = leads.filter((l) => l.status === 'contacted');
    const converted = leads.filter((l) => l.status === 'converted');

    // Get automation logs for today
    const automationLogs = await prisma.automationLog.findMany({
      where: {
        createdAt: { gte: today },
        lead: { userId: user.id },
      },
    });

    const successfulActions = automationLogs.filter((l) => l.status === 'success').length;
    const failedActions = automationLogs.filter((l) => l.status === 'failed').length;
    const totalActions = automationLogs.length;

    // Get revenue today
    const convertedToday = await prisma.lead.findMany({
      where: {
        userId: user.id,
        status: 'converted',
        conversionDate: { gte: today },
      },
    });

    const revenueToday = convertedToday.reduce((sum, l) => sum + (l.dealValue || 0), 0);

    // Get last auto-engagement time
    const lastAutoEngagement = await prisma.automationLog.findFirst({
      where: {
        action: 'auto_engaged',
        status: 'success',
        lead: { userId: user.id },
      },
      orderBy: { createdAt: 'desc' },
    });

    const metrics: AutomationMetrics = {
      hotLeads: hotLeads.length,
      totalLeads: leads.length,
      messagesToday: successfulActions,
      successRate: totalActions > 0 ? (successfulActions / totalActions) * 100 : 0,
      averageResponseTime: 2.3, // Placeholder - calculate from logs in production
      failedWebhooks: failedActions,
      lastAutoEngagementTime: lastAutoEngagement?.createdAt.toISOString() || null,
      conversionRate: leads.length > 0 ? (converted.length / leads.length) * 100 : 0,
      revenueToday,
    };

    return res.status(200).json(metrics);
  } catch (error) {
    console.error('Error fetching automation metrics:', error);
    return res.status(500).json({} as AutomationMetrics);
  }
}
