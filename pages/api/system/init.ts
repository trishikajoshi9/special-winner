import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeCronJobs } from '@/lib/cron-jobs';

let cronJobsInitialized = false;

interface InitResponse {
  status: string;
  message: string;
  cronJobsEnabled: boolean;
}

/**
 * POST /api/system/init
 * Initialize automation system and cron jobs
 * Called once on app startup
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InitResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      status: 'error',
      message: 'Method not allowed',
      cronJobsEnabled: false,
    });
  }

  try {
    if (!cronJobsInitialized && process.env.AUTO_SCORE_ENABLED === 'true') {
      console.log('[Init] Initializing automation system...');
      initializeCronJobs();
      cronJobsInitialized = true;
      console.log('[Init] ✓ Automation system initialized');
    }

    return res.status(200).json({
      status: 'success',
      message: 'Automation system initialized',
      cronJobsEnabled: cronJobsInitialized,
    });
  } catch (error) {
    console.error('[Init] Error initializing automation:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to initialize automation system',
      cronJobsEnabled: false,
    });
  }
}
