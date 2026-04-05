const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      password: await bcrypt.hash('demo123', 10),
      name: 'Demo User',
      role: 'admin',
      status: 'active',
    },
  });

  console.log('✅ Demo user created:', demoUser.email);

  // Create demo leads
  const leads = [
    {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 (555) 123-4567',
      whatsapp: '+1 (555) 123-4567',
      company: 'Acme Inc.',
      status: 'new',
      source: 'manual',
      userId: demoUser.id,
    },
    {
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1 (555) 234-5678',
      whatsapp: '+1 (555) 234-5678',
      company: 'Tech Solutions',
      status: 'contacted',
      source: 'whatsapp',
      userId: demoUser.id,
    },
    {
      name: 'Bob Johnson',
      email: 'bob@example.com',
      phone: '+1 (555) 345-6789',
      company: 'Innovation Corp',
      status: 'qualified',
      source: 'email',
      userId: demoUser.id,
    },
    {
      name: 'Alice Williams',
      email: 'alice@example.com',
      phone: '+1 (555) 456-7890',
      company: 'Global Industries',
      status: 'converted',
      source: 'form',
      userId: demoUser.id,
    },
  ];

  for (const lead of leads) {
    const createdLead = await prisma.lead.create({
      data: lead,
    });
    console.log('✅ Lead created:', createdLead.name);
  }

  // Create integration configs
  const integrations = [
    {
      type: 'whatsapp',
      name: 'Twilio WhatsApp',
      status: 'active',
      config: JSON.stringify({
        accountSid: 'YOUR_ACCOUNT_SID',
        authToken: 'YOUR_AUTH_TOKEN',
        phoneNumber: '+1234567890',
      }),
    },
    {
      type: 'email',
      name: 'Gmail',
      status: 'active',
      config: JSON.stringify({
        clientId: 'YOUR_CLIENT_ID',
        clientSecret: 'YOUR_CLIENT_SECRET',
      }),
    },
    {
      type: 'n8n',
      name: 'n8n Workflows',
      status: 'active',
      config: JSON.stringify({
        baseUrl: 'http://localhost:5678',
        apiKey: 'YOUR_N8N_API_KEY',
      }),
    },
  ];

  for (const integration of integrations) {
    const created = await prisma.integration.upsert({
      where: { type: integration.type },
      update: integration,
      create: integration,
    });
    console.log('✅ Integration configured:', created.name);
  }

  console.log('✨ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
