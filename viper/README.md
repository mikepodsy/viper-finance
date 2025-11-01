# Viper Finance

A modern, full-stack finance dashboard built with Next.js, TypeScript, Tailwind CSS, and Prisma.

## Features

- 📊 **Watchlists**: Track your favorite stocks and assets with real-time prices
- 💼 **Portfolio**: Manage holdings and track profit/loss
- 🔔 **Alerts**: Set price alerts that trigger automatically
- 📈 **Market Dashboard**: Overview of popular stocks and your portfolio
- 🎨 **Modern UI**: Clean, responsive design inspired by Yahoo Finance

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Supabase) with Prisma ORM
- **State Management**: TanStack Query
- **Forms**: React Hook Form + Zod
- **API**: Finnhub (stocks) + CoinGecko (crypto)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- PostgreSQL database (Supabase recommended)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Add your environment variables:
# DATABASE_URL=your_postgres_url
# FINNHUB_API_KEY=your_api_key

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Start dev server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed Vercel deployment instructions.

## Project Structure

```
viper/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── api/          # API routes
│   │   ├── watchlist/    # Watchlist page
│   │   ├── portfolio/    # Portfolio page
│   │   └── alerts/       # Alerts page
│   ├── components/       # React components
│   └── lib/              # Utilities and helpers
├── prisma/
│   └── schema.prisma     # Database schema
└── public/               # Static assets
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `FINNHUB_API_KEY` | Finnhub API key for stock quotes |

## License

MIT
