# 🚀 Vercel Auto-Deployment Guide

Your dashboard is now configured for **automatic deployment to Vercel**!

## Step 1: Connect to Vercel

### Option A: Via Vercel Dashboard (Easiest)

1. Go to [vercel.com](https://vercel.com)
2. Sign up / Log in with GitHub
3. Click "Add New..." → "Project"
4. Select your GitHub repository: `trishikajoshi9/special-winner`
5. Click "Import"
6. Configure environment variables (see Step 2)
7. Click "Deploy"

### Option B: Via Vercel CLI

```bash
npm install -g vercel
cd /home/madhusudan/dashboard
vercel
# Follow the prompts
```

---

## Step 2: Set Environment Variables in Vercel

In Vercel Dashboard → Project Settings → Environment Variables, add:

```
DATABASE_URL = postgresql://user:password@your-db-host:5432/dashboard_db
NEXTAUTH_SECRET = your-secret-key-here
NEXTAUTH_URL = https://your-dashboard.vercel.app
GMAIL_CLIENT_ID = your-gmail-client-id-here
GMAIL_CLIENT_SECRET = your-gmail-client-secret-here
GMAIL_REDIRECT_URI = https://your-dashboard.vercel.app/api/auth/gmail/callback
```

---

## Step 3: GitHub Secrets (Optional - for CI/CD)

If you want automatic deployment via GitHub Actions:

In your GitHub repo → Settings → Secrets and variables → Actions, add:

```
VERCEL_TOKEN = [your-vercel-token]
VERCEL_ORG_ID = [your-vercel-org-id]
VERCEL_PROJECT_ID = [your-vercel-project-id]
```

Get these values from Vercel:
- **VERCEL_TOKEN**: [Account Settings → Tokens](https://vercel.com/account/tokens)
- **VERCEL_ORG_ID**: [Team Settings](https://vercel.com/team/settings)
- **VERCEL_PROJECT_ID**: In project settings → General

---

## Step 4: Update Gmail OAuth Redirect URI

After deployment:

1. Get your Vercel URL: `https://your-dashboard.vercel.app`

2. Update Gmail OAuth settings:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Project: `automation-492408`
   - Credentials → OAuth 2.0 Client IDs
   - Update **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/gmail/callback` (development)
     - `https://your-dashboard.vercel.app/api/auth/gmail/callback` (production)

3. Update `.env` files:
   ```
   GMAIL_REDIRECT_URI=https://your-dashboard.vercel.app/api/auth/gmail/callback
   ```

---

## Step 5: Configure PostgreSQL for Production

You need a production PostgreSQL database. Options:

### Option A: Use Vercel Postgres (Easiest)
```bash
# Install Vercel Postgres
vercel env pull
```

Then in Vercel Dashboard:
1. Project → Storage
2. Connect Database → Create PostgreSQL

### Option B: Use External Database
- **Railway.app**: Free PostgreSQL
- **AWS RDS**: Managed PostgreSQL
- **Heroku Postgres**: PaaS PostgreSQL
- **Neon**: Serverless PostgreSQL

Get the connection URL and set as `DATABASE_URL` in Vercel.

---

## Automatic Deployment Flow

Once connected, **every push to main branch** triggers:

```
GitHub Push
    ↓
GitHub Actions (CI/CD)
    ↓
Lint & Build
    ↓
Deploy to Vercel
    ↓
Live at https://your-dashboard.vercel.app
```

---

## Deployment Status

Check deployment status:
- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **GitHub Actions**: Repository → Actions tab
- **Commands**:
  ```bash
  vercel status
  vercel logs
  ```

---

## Rollback & Management

```bash
# View deployments
vercel list

# Rollback to previous version
vercel rollback

# View logs
vercel logs [deployment-url]

# Set as production
vercel promote [deployment-id]
```

---

## Production Checklist

- [ ] Database URL set in Vercel
- [ ] NextAuth secrets configured
- [ ] Gmail OAuth redirect URI updated
- [ ] NEXTAUTH_URL set correctly
- [ ] Database migrations run (see below)
- [ ] Environment variables all set

---

## Database Migrations on Vercel

After first deployment, run migrations:

```bash
# Using Vercel CLI
vercel edge-config create

# Or manually via SSH
vercel ssh [app-name] /bin/bash
npx prisma migrate deploy
```

---

## Monitoring & Logs

After deployment:

1. **Real-time logs**: Vercel Dashboard → Deployments → Logs
2. **Function logs**: Vercel Dashboard → Functions
3. **Database**: Check via your database provider dashboard
4. **Analytics**: Vercel Dashboard → Analytics

---

## Troubleshooting

### Build fails
```bash
vercel build --prod
# Check error logs in Vercel Dashboard
```

### Environment variables not loading
```bash
vercel env pull
# Ensure keys match exactly (case-sensitive)
```

### Database connection error
```bash
# Verify DATABASE_URL in Vercel
# Format: postgresql://user:password@host:5432/database
vercel logs
```

### Gmail OAuth not working
- Verify redirect URI in Google Cloud Console
- Check GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET
- Ensure NEXTAUTH_URL is set correctly

---

## Quick Commands

```bash
# Deploy locally
npm run build

# Preview locally before deploying
npm run dev

# Check Vercel status
vercel status

# View live app
open $(vercel list | head -2 | tail -1 | awk '{print $1}')

# Force redeploy
vercel --prod --force
```

---

## Links

- 🔗 **GitHub Repo**: https://github.com/trishikajoshi9/special-winner
- 🚀 **Vercel Dashboard**: https://vercel.com/dashboard
- 📚 **Vercel Docs**: https://vercel.com/docs
- 🔐 **Google Cloud**: https://console.cloud.google.com
- 💾 **Your Database Provider**: [Vercel Postgres, Railway, Neon, etc.]

---

## Next Steps

1. **Now**: Go to [vercel.com](https://vercel.com) and import your GitHub repo
2. **Set environment variables** in Vercel Dashboard
3. **Configure PostgreSQL** database
4. **Update Gmail OAuth** redirect URIs
5. **Deploy and test** your live dashboard!

---

## Auto-Deploy Badge

Add this to your README to show deployment status:

```markdown
[![Vercel Status](https://img.shields.io/badge/Vercel-Live-green?logo=vercel)](https://your-dashboard.vercel.app)
```

---

**Your dashboard is now production-ready and will auto-deploy with every git push!** 🎉

For questions: Check [Vercel docs](https://vercel.com/docs) or update your `.env` files.
