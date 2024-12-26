// src/components/sections/Hero.tsx
"use client";

import { useEffect, useState } from 'react';
import NumberTicker from '@/components/ui/number-ticker';

export default function Hero() {
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    const fetchTotalRevenue = async () => {
      try {
        const [iosResponse, stripeResponse] = await Promise.all([
          fetch('/api/sales/ios'),
          fetch('/api/sales/stripe')
        ]);

        const iosData = await iosResponse.json();
        const stripeData = await stripeResponse.json();

        const iosTotal = iosData.reduce((sum: number, day: any) => sum + day.amount, 0);
        const stripeTotal = stripeData.reduce((sum: number, day: any) => sum + day.amount, 0);

        setTotalRevenue(iosTotal + stripeTotal);
      } catch (error) {
        console.error('Error fetching total revenue:', error);
      }
    };

    fetchTotalRevenue();
  }, []);

  return (
    <section className="py-16 text-center">
        <div className="text-sm text-muted-foreground">
            <p>
            dkBuilds
            </p>
        </div>
      <h1 className="text-5xl font-bold mb-6">Journey to $1000 in Revenue</h1>
      <div className="text-3xl font-bold">
        $<NumberTicker value={totalRevenue} className="mr-1 text-green-500 text-9xl font-bold"/> / 1000
      </div>
    </section>
  );
}