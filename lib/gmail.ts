import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

let oauth2Client: OAuth2Client | null = null;

export function getGmailClient() {
  if (!oauth2Client) {
    oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );
  }
  return oauth2Client;
}

export function getGmailAuthUrl() {
  const client = getGmailClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/contacts.readonly',
    ],
  });
}

export async function setGmailTokens(userId: string, tokens: any) {
  const client = getGmailClient();
  client.setCredentials(tokens);

  // Store tokens in DB
  await prisma.user.update({
    where: { id: userId },
    data: {
      gmailAccessToken: tokens.access_token,
      gmailRefreshToken: tokens.refresh_token,
    },
  });
}

export async function syncGmailLeads(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user?.gmailAccessToken) {
    throw new Error('Gmail not configured');
  }

  const client = getGmailClient();
  client.setCredentials({
    access_token: user.gmailAccessToken,
    refresh_token: user.gmailRefreshToken,
  });

  const gmail = google.gmail({ version: 'v1', auth: client });
  const contacts = google.people({ version: 'v1', auth: client });

  try {
    // Fetch messages from Gmail inbox
    const messagesRes = await gmail.users.messages.list({
      userId: 'me',
      q: 'from:* to:*',
      maxResults: 50,
    });

    const messageIds = messagesRes.data.messages || [];

    for (const msg of messageIds) {
      const message = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
      });

      const headers = message.data.payload?.headers || [];
      const from = headers.find((h) => h.name === 'From')?.value || '';
      const subject = headers.find((h) => h.name === 'Subject')?.value || '';

      // Extract email from "Name <email>" format
      const emailMatch = from.match(/<([^>]+)>/);
      const email = emailMatch ? emailMatch[1] : from;
      const name = from.replace(/<[^>]+>/, '').trim() || email;

      // Check if lead already exists
      const existingLead = await prisma.lead.findFirst({
        where: {
          email,
          userId,
        },
      });

      if (!existingLead) {
        await prisma.lead.create({
          data: {
            name,
            email,
            source: 'email',
            userId,
            notes: `Synced from Gmail: ${subject}`,
          },
        });
      }
    }

    // Fetch from Contacts API
    const contactsRes = await contacts.people.connections.list({
      resourceName: 'people/me',
      pageSize: 100,
      personFields: 'names,emailAddresses,phoneNumbers',
    });

    const connections = contactsRes.data.connections || [];

    for (const contact of connections) {
      const contactName = contact.names?.[0]?.displayName || '';
      const contactEmail = contact.emailAddresses?.[0]?.value || '';

      if (contactEmail) {
        const existingLead = await prisma.lead.findFirst({
          where: {
            email: contactEmail,
            userId,
          },
        });

        if (!existingLead) {
          await prisma.lead.create({
            data: {
              name: contactName,
              email: contactEmail,
              phone: contact.phoneNumbers?.[0]?.value,
              source: 'email',
              userId,
            },
          });
        }
      }
    }

    return { success: true, message: 'Synced Gmail leads' };
  } catch (error) {
    console.error('Gmail sync error:', error);
    throw error;
  }
}
