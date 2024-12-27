// src/types/supabase.ts

// Payment notification data from Supabase table
export interface PaymentNotification {
    id: string;
    created_at: string;
    name: string;
    message: string;
    amount: number;
  }
  
  // SQL schema for Supabase
  /*
  create table public.payment_notifications (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('cst'::text, now()) not null,
    name text not null,
    message text not null,
    amount numeric(10,2) not null
  );
  
  -- Enable Row Level Security
  alter table public.payment_notifications enable row level security;
  
  -- Create policy to allow public read access
  create policy "Allow public read access"
    on public.payment_notifications
    for select
    to public
    using (true);
  
  -- Create policy to allow authenticated insert
  create policy "Allow authenticated insert"
    on public.payment_notifications
    for insert
    to authenticated
    with check (true);
  
  -- Set up realtime
  alter publication supabase_realtime add table payment_notifications;
  */


// iOS sales data from Supabase table


// Base sales data from Supabase table
export interface SalesData {
  id: string
  created_at: string
  date: string
  product: string
  revenue: number
}

// Product revenue data for a specific date
export interface DailyProductRevenue {
  date: string
  [key: string]: string | number // Allow dynamic product names
}

// Configuration for each product
export interface ProductConfig {
  id: string
  name: string
  color: string
  link?: string
}

// Cached data structure
export interface CachedSalesData {
  lastUpdated: number
  data: DailyProductRevenue[]
}

// Product configuration
export const PRODUCTS: ProductConfig[] = [
  {
    id: 'rtc',
    name: 'Race Time Calculator',
    color: 'hsl(var(--chart-1))',
    link: 'https://apps.apple.com/app/race-time-calculator/id6478423515'
  },
  // Add new products here as needed
];