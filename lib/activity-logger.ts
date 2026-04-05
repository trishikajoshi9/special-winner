import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ActivityLogEntry {
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  leadId?: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, any>;
}

/**
 * Centralized Activity Logger
 * Handles all audit trail logging for the application
 */
export class ActivityLogger {
  /**
   * Log an activity/action
   */
  static async logActivity(entry: ActivityLogEntry): Promise<void> {
    try {
      await prisma.activity.create({
        data: {
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId,
          oldValue: entry.oldValue,
          newValue: entry.newValue,
          userId: entry.userId,
          leadId: entry.leadId,
        },
      });
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw - logging failure shouldn't break main flow
    }
  }

  /**
   * Get full timeline of activities for a lead
   */
  static async getLeadTimeline(leadId: string): Promise<any[]> {
    try {
      const activities = await prisma.activity.findMany({
        where: { leadId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
      });

      return activities;
    } catch (error) {
      console.error('Error getting lead timeline:', error);
      return [];
    }
  }

  /**
   * Get conversion metrics for a user
   */
  static async getConversionMetrics(userId: string, days: number = 30): Promise<{
    totalLeads: number;
    contacted: number;
    qualified: number;
    converted: number;
    lost: number;
    avgTimeToConversion: number;
    conversionRate: number;
  }> {
    try {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);

      // Get all leads for the user in the period
      const leads = await prisma.lead.findMany({
        where: {
          userId,
          createdAt: { gte: dateThreshold },
        },
        include: {
          activities: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      const statusCounts = {
        new: 0,
        contacted: 0,
        qualified: 0,
        converted: 0,
        lost: 0,
      };

      let totalTimeToConversion = 0;
      let convertedLeads = 0;

      leads.forEach((lead) => {
        const status = lead.status as keyof typeof statusCounts;
        if (status in statusCounts) {
          statusCounts[status]++;
        }

        // Calculate time to conversion
        if (status === 'converted' && lead.createdAt && lead.conversionDate) {
          const timeMs = lead.conversionDate.getTime() - lead.createdAt.getTime();
          totalTimeToConversion += timeMs;
          convertedLeads++;
        }
      });

      const avgTimeToConversion = convertedLeads > 0 ? totalTimeToConversion / convertedLeads / (1000 * 60 * 60) : 0; // hours
      const conversionRate = leads.length > 0 ? (statusCounts.converted / leads.length) * 100 : 0;

      return {
        totalLeads: leads.length,
        contacted: statusCounts.contacted,
        qualified: statusCounts.qualified,
        converted: statusCounts.converted,
        lost: statusCounts.lost,
        avgTimeToConversion: Math.round(avgTimeToConversion),
        conversionRate: Math.round(conversionRate * 100) / 100,
      };
    } catch (error) {
      console.error('Error getting conversion metrics:', error);
      return {
        totalLeads: 0,
        contacted: 0,
        qualified: 0,
        converted: 0,
        lost: 0,
        avgTimeToConversion: 0,
        conversionRate: 0,
      };
    }
  }

  /**
   * Get revenue metrics for a user
   */
  static async getRevenueMetrics(userId: string, days: number = 30): Promise<{
    totalRevenue: number;
    convertedLeads: number;
    avgDealValue: number;
    roiMultiplier: number;
  }> {
    try {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);

      const convertedLeads = await prisma.lead.findMany({
        where: {
          userId,
          status: 'converted',
          conversionDate: { gte: dateThreshold },
        },
      });

      const totalRevenue = convertedLeads.reduce((sum, lead) => sum + (lead.dealValue || 0), 0);
      const avgDealValue = convertedLeads.length > 0 ? totalRevenue / convertedLeads.length : 0;

      // Rough ROI estimate: $1 daily cost per automation
      const automationCost = Math.ceil(days / 30); // simplified
      const roiMultiplier = automationCost > 0 ? totalRevenue / automationCost : totalRevenue;

      return {
        totalRevenue,
        convertedLeads: convertedLeads.length,
        avgDealValue: Math.round(avgDealValue * 100) / 100,
        roiMultiplier: Math.round(roiMultiplier * 100) / 100,
      };
    } catch (error) {
      console.error('Error getting revenue metrics:', error);
      return {
        totalRevenue: 0,
        convertedLeads: 0,
        avgDealValue: 0,
        roiMultiplier: 0,
      };
    }
  }

  /**
   * Log automation action
   */
  static async logAutomationAction(
    action: string,
    leadId: string,
    status: 'success' | 'failed' | 'pending',
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await prisma.automationLog.create({
        data: {
          action,
          leadId,
          status,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });
    } catch (error) {
      console.error('Error logging automation action:', error);
    }
  }

  /**
   * Get automation logs for a lead
   */
  static async getAutomationLogs(
    leadId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const logs = await prisma.automationLog.findMany({
        where: { leadId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return logs.map((log) => ({
        ...log,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
      }));
    } catch (error) {
      console.error('Error getting automation logs:', error);
      return [];
    }
  }

  /**
   * Get recent automation logs (for dashboard)
   */
  static async getRecentAutomationLogs(
    userId: string,
    limit: number = 20
  ): Promise<any[]> {
    try {
      const logs = await prisma.automationLog.findMany({
        where: {
          lead: {
            userId,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          lead: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      });

      return logs.map((log) => ({
        ...log,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
      }));
    } catch (error) {
      console.error('Error getting recent automation logs:', error);
      return [];
    }
  }

  /**
   * Get daily automation stats
   */
  static async getDailyAutomationStats(userId: string, days: number = 7): Promise<{
    date: string;
    autoEngaged: number;
    followupsSent: number;
    errors: number;
    repliesReceived: number;
  }[]> {
    try {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);

      const logs = await prisma.automationLog.findMany({
        where: {
          createdAt: { gte: dateThreshold },
          lead: {
            userId,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Group by date
      const statsByDate: {
        [key: string]: { autoEngaged: number; followupsSent: number; errors: number; repliesReceived: number };
      } = {};

      logs.forEach((log) => {
        const date = log.createdAt.toISOString().split('T')[0];
        if (!statsByDate[date]) {
          statsByDate[date] = { autoEngaged: 0, followupsSent: 0, errors: 0, repliesReceived: 0 };
        }

        if (log.action === 'auto_engaged') statsByDate[date].autoEngaged++;
        if (log.action === 'follow_up') statsByDate[date].followupsSent++;
        if (log.status === 'failed') statsByDate[date].errors++;
        if (log.action === 'reply_received') statsByDate[date].repliesReceived++;
      });

      return Object.entries(statsByDate)
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([date, stats]) => ({
          date,
          ...stats,
        }));
    } catch (error) {
      console.error('Error getting daily automation stats:', error);
      return [];
    }
  }
}

export default ActivityLogger;
