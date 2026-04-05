import type { NextApiRequest, NextApiResponse } from 'next';
import { getGmailClient, setGmailTokens } from '@/lib/gmail';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { code, error } = req.query;

  if (error) {
    return res.status(400).json({ error: `Gmail auth error: ${error}` });
  }

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  try {
    const client = getGmailClient();
    const { tokens } = await client.getToken(code as string);

    await setGmailTokens(session.user!.id!, tokens);

    // Redirect to dashboard with success
    res.redirect('/dashboard?gmail=connected');
  } catch (error: any) {
    console.error('Gmail callback error:', error);
    res.status(500).json({ error: error.message });
  }
}
