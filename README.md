# 1000by2025 | dkBuilds Goal Tracker

A minimalist web application to track progress towards generating $1000 in net revenue by the end of 2025, while also serving as a POC for Stripe web app payments. Each dollar contributed (through Stripe) is a fun way to become a part of the journey, with real-time notifications and interactive visualizations showing the path to the goal.

## About

This project tracks dkBuilds' north star metric for 2025: to create $1000 in revenue. Why? Because the biggest indicator of product value is if people are willing to pay for it. This builds on last year's goal of reaching 1000 users, which proved we can build and release products that people use. Now, we're focused on creating genuine value that people find worth paying for.

## Features

- 💰 Real-time payment notifications with animated list
- 💳 Streamlined Stripe payment integration
- 📊 Interactive revenue tracking charts
- ✨ Clean, minimalist design with smooth animations
- 🌐 Live-updating user contribution board

## Tech Stack

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) with TypeScript and App Router
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Animations**: [MagicUI](https://magicui.design/) + Framer Motion

### Backend & Infrastructure
- **Database**: [Supabase](https://supabase.com/) (Serverless PostgreSQL)
- **Payments**: [Stripe](https://stripe.com/)
- **Analytics**: [OpenPanel](https://openpanel.dev/)
- **Hosting**: [Vercel](https://vercel.com/)

## To make a similar project

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Create a `.env.local` file with your environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


## License

Copyright © 2024 dkBuilds. All rights reserved.