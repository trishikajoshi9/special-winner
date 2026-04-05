# AI-Powered Dashboard

A production-ready full-stack dashboard application with real-time chat, lead management, WhatsApp integration, Gmail API, and n8n workflow automation.

## 🚀 Features

- **Modern Dashboard UI** - Animated, responsive design with Tailwind CSS
- **Lead Management** - Create, update, delete leads with full CRUD operations
- **Real-time Chat** - Socket.io integration for live AI chat
- **WhatsApp Integration** - Twilio-powered WhatsApp messaging
- **Gmail API** - Email integration and automation
- **n8n Workflows** - Workflow automation integration
- **Analytics** - Charts, stats, and conversion tracking
- **User Authentication** - JWT + NextAuth
- **Mobile Responsive** - Native-like mobile experience
- **Activity Logging** - Audit trail for all actions

## 📋 Prerequisites

- Node.js 16+ or higher
- PostgreSQL 12+
- npm or yarn

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
cd /home/madhusudan/dashboard
npm install
# or
yarn install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your credentials:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dashboard_db

# JWT & Auth
JWT_SECRET=your-super-secret-key
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Twilio (WhatsApp)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# Gmail API
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret

# n8n
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=your_n8n_api_key
```

### 3. Set Up Database

```bash
# Run migrations
npx prisma migrate dev --name init

# Seed demo data
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
# or
yarn dev
```

Visit: **http://localhost:3000**

## 📝 Demo Credentials

- **Email**: demo@example.com
- **Password**: demo123

## 📂 Project Structure

```
dashboard/
├── pages/
│   ├── _app.tsx          # App wrapper
│   ├── index.tsx         # Dashboard home
│   ├── login.tsx         # Login page
│   ├── leads.tsx         # Leads management
│   ├── chat.tsx          # Chat page
│   ├── analytics.tsx     # Analytics page
│   └── api/
│       ├── auth/[...nextauth].ts
│       ├── leads/
│       ├── messages/
│       ├── dashboard/stats.ts
│       ├── integrations/
│       └── webhooks/
├── components/
│   ├── Layout.tsx
│   ├── Sidebar.tsx
│   ├── Navigation.tsx
│   ├── StatsCard.tsx
│   ├── LeadsTable.tsx
│   ├── ChatWidget.tsx
│   ├── DashboardHeader.tsx
│   └── ...
├── prisma/
│   └── schema.prisma
├── styles/
│   └── globals.css
├── scripts/
│   └── seed-db.js
└── public/
```

## 🔧 Configuration

### WhatsApp Integration (Twilio)

1. Sign up at [Twilio](https://www.twilio.com)
2. Get your Account SID and Auth Token
3. Set up WhatsApp Sandbox
4. Add phone number to `.env.local`

### Gmail API

1. Create OAuth 2.0 credentials in [Google Cloud Console](https://console.cloud.google.com)
2. Add redirect URIs
3. Download credentials and add to `.env.local`

### n8n Integration

1. Install n8n: `npm install -g n8n`
2. Run n8n: `n8n start`
3. Access at http://localhost:5678
4. Add your API key to `.env.local`

## 📊 Database Schema

- **User** - User accounts with roles
- **Lead** - Contact information and status
- **Conversation** - Chat threads
- **Message** - Chat messages
- **Activity** - Audit trail
- **Integration** - API configurations
- **Analytics** - Metrics and stats

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get session

### Leads
- `GET /api/leads` - List leads
- `POST /api/leads` - Create lead
- `GET /api/leads/[id]` - Get lead
- `PUT /api/leads/[id]` - Update lead
- `DELETE /api/leads/[id]` - Delete lead

### Messages
- `GET /api/messages` - List messages
- `POST /api/messages` - Send message

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard stats

### Integrations
- `POST /api/integrations/whatsapp/send` - Send WhatsApp
- `POST /api/integrations/email/send` - Send email
- `POST /api/integrations/n8n/trigger` - Trigger workflow

## 🚀 Deployment

### netlify(Recommended)

```bash
npm install -g netlify
netlify
```

### Docker

```bash
docker build -t dashboard .
docker run -p 3000:3000 dashboard
```

### Railway / Heroku

See deployment documentation in each platform.

## 🤝 Contributing

1. Create a feature branch
2. Commit changes
3. Push to branch
4. Create Pull Request

## 📄 License

MIT License - See LICENSE file

## 📞 Support

For issues and questions, please create an issue on GitHub.

## 🎯 Roadmap

- [ ] Advanced analytics with ML
- [ ] Bulk lead import (CSV)
- [ ] WhatsApp broadcast campaigns
- [ ] Email automation
- [ ] Custom workflows
- [ ] Team collaboration
- [ ] Mobile app (React Native)
- [ ] Dark mode

## ✨ Next Steps

1. Complete `.env.local` configuration
2. Set up WhatsApp & Gmail integrations
3. Run database migrations
4. Start the development server
5. Log in with demo credentials
6. Add your first lead!

---

Built with ❤️ by Your Team
