import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
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

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid lead ID' });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email || '' },
  });

  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  // Verify lead belongs to user
  const lead = await prisma.lead.findUnique({
    where: { id },
  });

  if (!lead || lead.userId !== user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'GET') {
    return res.status(200).json(lead);
  }

  if (req.method === 'PUT') {
    try {
      const { name, email, phone, whatsapp, company, status, source, notes } =
        req.body;

      const updatedLead = await prisma.lead.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(phone && { phone }),
          ...(whatsapp && { whatsapp }),
          ...(company && { company }),
          ...(status && { status }),
          ...(source && { source }),
          ...(notes && { notes }),
        },
      });

      // Log activity
      await prisma.activity.create({
        data: {
          action: 'updated',
          entity: 'Lead',
          entityId: lead.id,
          userId: user.id,
          leadId: lead.id,
        },
      });

      return res.status(200).json(updatedLead);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.lead.delete({
        where: { id },
      });

      // Log activity
      await prisma.activity.create({
        data: {
          action: 'deleted',
          entity: 'Lead',
          entityId: lead.id,
          userId: user.id,
          leadId: lead.id,
        },
      });

      return res.status(200).json({ message: 'Lead deleted' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
