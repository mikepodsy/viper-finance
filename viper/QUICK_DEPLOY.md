# Quick Deploy to https://viper-finance.vercel.app/

## Option 1: Update via Vercel Dashboard (Recommended)

1. **Push to GitHub:**
   ```bash
   cd /Users/michaelpodolioukh/Viperfinance
   git push origin master
   ```

2. **Update Vercel Project Settings:**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Open your `viper-finance` project
   - Go to **Settings** → **General**
   - Find **Root Directory** setting
   - Set it to: `viper`
   - Click **Save**

3. **Redeploy:**
   - Go to **Deployments** tab
   - Click **...** on the latest deployment
   - Click **Redeploy**
   - OR trigger a new deployment by making a small change and pushing

## Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Navigate to the viper directory
cd /Users/michaelpodolioukh/Viperfinance/viper

# Link to existing project (if not linked)
vercel link

# When prompted:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? Yes
# - What's the name of your existing project? viper-finance
# - In which directory is your code located? ./

# Deploy
vercel --prod
```

## Important: Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables, ensure you have:

- `DATABASE_URL` - Your Supabase PostgreSQL connection string
- `FINNHUB_API_KEY` - Your Finnhub API key

## After Deployment

1. **Run Database Migrations:**
   ```bash
   # Option 1: Run locally and push to Supabase
   cd viper
   npx prisma migrate deploy
   
   # Option 2: Use Vercel CLI
   vercel env pull .env.local
   npx prisma migrate deploy
   ```

2. **Verify:**
   - Visit https://viper-finance.vercel.app/
   - Check that dashboard loads (not default Next.js page)
   - Test all pages: watchlist, portfolio, alerts

## Troubleshooting

**If you still see the default Next.js page:**

1. Check that Root Directory is set to `viper` in Vercel settings
2. Check build logs in Vercel dashboard
3. Ensure all files are committed and pushed to GitHub
4. Try redeploying after setting the root directory

**If build fails:**
- Check that `package.json` has all dependencies
- Verify Node.js version (18+) in Vercel settings
- Check build logs for specific errors

