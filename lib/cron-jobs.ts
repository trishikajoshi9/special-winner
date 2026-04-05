import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { calculateLeadScore } from './ai-scoring';
import { createAutomationOrchestrator } from './automation';
import ActivityLogger from './activity-logger';

const prisma = new PrismaClient();
const automation = createAutomationOrchestrator();

/**
 * Cron Jobs for Lead Automation
 * Handles periodic tasks:
 * - Auto-scoring leads
 * - Sending follow-ups
 * - Aggregating analytics
 */

let jobsInitialized = false;
const jobs: cron.ScheduledTask[] = [];

/**
 * Stop all cron jobs
 */
export function stopAllJobs() {
  jobs.forEach((job) => {
    job.stop();
  });
  jobs.length = 0;
  jobsInitialized = false;
}

/**
 * Initialize all cron jobs
 */
export function initializeCronJobs() {
  if (jobsInitialized) {
    console.log('Cron jobs already initialized');
    return;
  }

  console.log('Initializing cron jobs...');

  // Job 1: Auto-score leads hourly
  if (process.env.AUTO_SCORE_ENABLED === 'true') {
    const scoreInterval = process.env.AUTO_SCORE_INTERVAL_MINUTES || '60';
    const cronExpression = `0 */${scoreInterval} * * *`; // e.g., every 60 minutes

    const scoreJob = cron.schedule(cronExpression, async () => {
      try {
        console.log('[Cron] Starting hourly lead re-scoring...');
        await autoScoreLeads();
        console.log('[Cron] Completed hourly lead re-scoring');
      } catch (error) {
        console.error('[Cron] Error in scoring job:', error);
      }
    });

    jobs.push(scoreJob);
    console.log(`✓ Cron job created: Auto-score leads (every ${scoreInterval} mins)`);
  }

  // Job 2: Send follow-ups every 4 hours
  if (process.env.AUTO_FOLLOWUP_ENABLED === 'true') {
    const followupInterval = process.env.AUTO_FOLLOWUP_INTERVAL_HOURS || '4';
    const cronExpression = `0 */${followupInterval} * * *`;

    const followupJob = cron.schedule(cronExpression, async () => {
      try {
        console.log('[Cron] Starting periodic follow-up sends...');
        await sendFollowups();
        console.log('[Cron] Completed periodic follow-up sends');
      } catch (error) {
        console.error('[Cron] Error in follow-up job:', error);
      }
    });

    jobs.push(followupJob);
    console.log(`✓ Cron job created: Send follow-ups (every ${followupInterval} hours)`);
  }

  // Job 3: Daily analytics aggregation (2 AM)
  const analyticsJob = cron.schedule('0 2 * * *', async () => {
    try {
      console.log('[Cron] Starting daily analytics aggregation...');
      await aggregateDailyAnalytics();
      console.log('[Cron] Completed daily analytics aggregation');
    } catch (error) {
      console.error('[Cron] Error in analytics job:', error);
    }
  });

  jobs.push(analyticsJob);
  console.log('✓ Cron job created: Daily analytics aggregation (2 AM)');

  jobsInitialized = true;
  console.log(`✓ All ${jobs.length} cron jobs initialized successfully`);
}

/**
 * Auto-score all leads that haven't been scored recently
 */
async function autoScoreLeads() {
  try {
    const scoreInterval = parseInt(process.env.AUTO_SCORE_INTERVAL_MINUTES || '60', 10);
    const threshold = new Date(Date.now() - scoreInterval * 60 * 1000);

    // Find leads that need re-scoring
    const leads = await prisma.lead.findMany({
      where: {
        OR: [
          { lastAutoScoredAt: null }, // Never scored
          { lastAutoScoredAt: { lt: threshold } }, // Score is stale
        ],
        status: { in: ['new', 'contacted'] }, // Only active leads
      },
      take: 100, // Process in batches
    });

    console.log(`[AutoScore] Found ${leads.length} leads to score`);

    let scored = 0;
    let hotLeads = 0;

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

        // Update lead
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            score,
            lastAutoScoredAt: new Date(),
          },
        });

        // If hot lead and not yet engaged, trigger engagement
        const minScore = parseInt(process.env.AUTO_ENGAGE_MIN_SCORE || '70', 10);
        if (score >= minScore && !lead.lastAutoEngagedAt) {
          hotLeads++;

          // Trigger engagement
          const result = await automation.triggerHotLeadEngagement(lead.id);
          if (result.messageId) {
            console.log(`[AutoScore] Hot lead ${lead.id} auto-engaged`);
          }
        }

        scored++;
      } catch (error) {
        console.error(`[AutoScore] Error scoring lead ${lead.id}:`, error);
      }
    }

    console.log(
      `[AutoScore] Scored ${scored} leads, auto-engaged ${hotLeads} hot leads`
    );
  } catch (error) {
    console.error('[AutoScore] Error in auto-score job:', error);
  }
}

/**
 * Send follow-up messages to non-responsive contacted leads
 */
async function sendFollowups() {
  try {
    const thresholdHours = parseInt(process.env.AUTO_FOLLOWUP_HOURS_THRESHOLD || '24', 10);
    const threshold = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);

    // Find leads that need follow-ups
    const leads = await prisma.lead.findMany({
      where: {
        status: 'contacted', // Was contacted but not yet qualified
        lastAutoEngagedAt: { lt: threshold }, // Was engaged > threshold hours ago
        OR: [
          { lastAutoFollowupAt: null }, // Never followed up
          { lastAutoFollowupAt: { lt: threshold } }, // Last follow-up was long ago
        ],
      },
      take: 50,
      include: {
        conversations: {
          where: { platform: 'whatsapp' },
          take: 1,
        },
      },
    });

    console.log(`[FollowUp] Found ${leads.length} leads needing follow-ups`);

    let sent = 0;
    for (const lead of leads) {
      try {
        // Determine follow-up type based on engagement count
        const type = lead.autoEngagementCount >= 2 ? 'urgency' : lead.autoEngagementCount === 1 ? 'nurture' : 'reminder';

        const result = await automation.sendFollowupMessage(lead.id, type);
        if (result.success) {
          sent++;
        }
      } catch (error) {
        console.error(`[FollowUp] Error sending follow-up for lead ${lead.id}:`, error);
      }
    }

    console.log(`[FollowUp] Sent ${sent} follow-up messages`);
  } catch (error) {
    console.error('[FollowUp] Error in follow-up job:', error);
  }
}

/**
 * Aggregate daily analytics
 */
async function aggregateDailyAnalytics() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get metrics for today
    const leads = await prisma.lead.findMany({
      where: {
        updatedAt: { gte: today },
      },
    });

    const contacted = leads.filter((l) => l.status === 'contacted').length;
    const converted = leads.filter((l) => l.status === 'converted').length;
    const qualified = leads.filter((l) => l.status === 'qualified').length;
    const hotLeads = leads.filter((l) => l.score >= 70).length;

    const totalRevenue = leads
      .filter((l) => l.status === 'converted' && l.dealValue)
      .reduce((sum, l) => sum + (l.dealValue || 0), 0);

    // Record metrics
    const metrics = [
      { metric: 'total_leads', value: leads.length },
      { metric: 'contacted', value: contacted },
      { metric: 'qualified', value: qualified },
      { metric: 'converted', value: converted },
      { metric: 'hot_leads', value: hotLeads },
      { metric: 'revenue', floatValue: totalRevenue },
    ];

    for (const m of metrics) {
      await prisma.analytics.create({
        data: {
          date: today,
          metric: m.metric,
          value: m.value || 0,
          floatValue: m.floatValue,
        },
      });
    }

    console.log(`[Analytics] Recorded ${metrics.length} metrics for ${today.toDateString()}`);
  } catch (error) {
    console.error('[Analytics] Error aggregating analytics:', error);
  }
}

export default { initializeCronJobs, stopAllJobs };
