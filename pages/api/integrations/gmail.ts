import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { syncGmailLeads, getGmailAuthUrl } from '@/lib/gmail';
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

  if (req.method === 'GET') {
    try {
      // Check if Gmail is already connected
      if (!user.gmailAccessToken) {
        const authUrl = getGmailAuthUrl();
        return res.status(200).json({ connected: false, authUrl });
      }

      return res.status(200).json({ connected: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const result = await syncGmailLeads(user.id);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
