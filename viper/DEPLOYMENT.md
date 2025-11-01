# Vercel Deployment Guide

## Prerequisites

1. GitHub account
2. Vercel account (free tier is fine)
3. Supabase account with PostgreSQL database

## Deployment Steps

### 1. Push to GitHub

```bash
cd viper
git add .
git commit -m "Add MVP features with polished UI"
git push origin main
```

### 2. Deploy to Vercel

#### Option A: Via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `viper`
   - **Build Command**: `pnpm build` (or `npm run build`)
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd viper
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? (enter a name)
# - Directory? ./viper
# - Override settings? No
```

### 3. Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

```
DATABASE_URL=postgresql://postgres:password@host:5432/database?sslmode=require
FINNHUB_API_KEY=your_finnhub_api_key
```

**Important**: 
- Get your `DATABASE_URL` from Supabase dashboard → Settings → Database → Connection String
- Get your `FINNHUB_API_KEY` from [finnhub.io](https://finnhub.io) (free tier available)

### 4. Run Database Migrations

After first deployment, run migrations:

```bash
# Option 1: Run locally and push to Supabase
cd viper
npx prisma migrate deploy

# Option 2: Use Vercel CLI to run in production
vercel env pull .env.local
npx prisma migrate deploy
```

### 5. Configure Cron Jobs

The `vercel.json` file is already configured with:
- `/api/jobs/alerts-eval` running every minute

Vercel will automatically detect and enable this cron job on deployment.

### 6. Verify Deployment

1. Visit your deployment URL (e.g., `https://your-project.vercel.app`)
2. Check:
   - Dashboard loads with market data
   - Watchlist page works
   - Portfolio page works
   - Alerts page works

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string from Supabase | ✅ Yes |
| `FINNHUB_API_KEY` | API key from Finnhub | ✅ Yes |

## Post-Deployment Checklist

- [ ] Environment variables set in Vercel
- [ ] Database migrations run successfully
- [ ] Cron job is active (check Vercel Dashboard → Cron Jobs)
- [ ] All pages load correctly
- [ ] API endpoints respond correctly
- [ ] Real-time price updates work
- [ ] Alerts evaluation runs (check logs)

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify Node.js version (should be 18+)
- Check build logs in Vercel dashboard

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check Supabase allows connections from Vercel IPs
- Ensure SSL mode is enabled (`sslmode=require`)

### API Errors
- Verify `FINNHUB_API_KEY` is set correctly
- Check rate limits (free tier has limits)
- Review API logs in Vercel dashboard

### Cron Job Not Running
- Wait a few minutes after deployment
- Check Vercel Dashboard → Cron Jobs
- Verify `vercel.json` is in the root of your project

## Monitoring

- **Vercel Dashboard**: Monitor deployments, logs, and performance
- **Supabase Dashboard**: Monitor database usage and connections
- **Vercel Analytics**: Track page views and performance (enable in settings)

