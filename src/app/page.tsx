// src/app/page.tsx
import { PaymentForm } from '@/components/sections/PaymentForm';
import { NotificationList } from '@/components/sections/NotificationList';

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <NotificationList />
        </div>
        <div>
          <PaymentForm />
        </div>
      </div>
    </main>
  );
}