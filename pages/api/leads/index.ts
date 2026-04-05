import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email || '' },
  });

  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  if (req.method === 'GET') {
    try {
      const { status, source, take = 50, skip = 0 } = req.query;

      const where: any = { userId: user.id };
      if (status && status !== 'all') where.status = status;
      if (source && source !== 'all') where.source = source;

      const leads = await prisma.lead.findMany({
        where,
        take: Number(take),
        skip: Number(skip),
        orderBy: { createdAt: 'desc' },
        include: {
          conversations: { take: 1 },
          activities: { take: 3 },
        },
      });

      return res.status(200).json(leads);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, email, phone, whatsapp, company, status, source, notes } =
        req.body;

      const lead = await prisma.lead.create({
        data: {
          name,
          email,
          phone,
          whatsapp,
          company,
          status: status || 'new',
          source: source || 'manual',
          notes,
          userId: user.id,
        },
      });

      // Log activity
      await prisma.activity.create({
        data: {
          action: 'created',
          entity: 'Lead',
          entityId: lead.id,
          userId: user.id,
          leadId: lead.id,
        },
      });

      return res.status(201).json(lead);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
