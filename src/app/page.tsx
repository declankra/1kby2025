// src/app/page.tsx
import { PaymentForm } from '@/components/sections/PaymentForm';
import { NotificationList } from '@/components/sections/NotificationList';
import RevenueChart from '@/components/sections/RevAreaChart';
import DonutChart from '@/components/sections/DonutChart';
import Hero from '@/components/sections/Hero';
import About from '@/components/sections/About';
import { ProductsList } from '@/components/sections/ProductsList';
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <Hero />

      {/* Revenue Overview Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Revenue Overview</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <DonutChart />
            <RevenueChart />
          </div>
          <div className="mt-12">
            <ProductsList />
          </div>
        </div>
      </section>

      {/* About Section */}
      <About />

      {/* Stripe POC Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Stripe POC</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <NotificationList />
            <PaymentForm />
          </div>
        </div>
      </section>
    </div>
  );
}