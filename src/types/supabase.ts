// src/types/supabase.ts
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