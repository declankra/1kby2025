"use client";

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Product configuration
const PRODUCTS = [
  { 
    id: 'rtc',
    name: 'Race Time Calculator',
    color: 'hsl(var(--chart-1))',
    link: 'https://apps.apple.com/app/race-time-calculator/id6478423515'
  },
  { 
    id: '1kby2025',
    name: '1000by2025.quest',
    color: 'hsl(var(--chart-2))',
    link: 'https://1000by2025.quest'
  }
];

// Custom tooltip component (simplified)
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border bg-background p-3 shadow-sm">
        <p className="font-medium">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          ${data.value.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

export default function DonutChart() {
  const [data, setData] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch data from both revenue sources
        const [iosResponse, stripeResponse] = await Promise.all([
          fetch('/api/sales/ios'),
          fetch('/api/sales/stripe')
        ]);

        if (!iosResponse.ok || !stripeResponse.ok) {
          throw new Error('Failed to fetch revenue data');
        }

        const iosData = await iosResponse.json();
        const stripeData = await stripeResponse.json();

        // Calculate total revenue for each product
        const rtcRevenue = iosData.reduce((sum: number, day: any) => sum + day.amount, 0);
        const questRevenue = stripeData.reduce((sum: number, day: any) => sum + day.amount, 0);

        // Format data for the pie chart
        const chartData = [
          { ...PRODUCTS[0], value: rtcRevenue },
          { ...PRODUCTS[1], value: questRevenue }
        ];

        setData(chartData);
        setTotalRevenue(rtcRevenue + questRevenue);
      } catch (err) {
        console.error('Error fetching revenue data:', err);
        setError('Failed to load revenue data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Revenue by Product</CardTitle>
        <CardDescription>All time revenue by product</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="mb-6 flex justify-center gap-6">
          {data.map((entry) => (
            <a
              key={entry.id}
              href={entry.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 transition-colors hover:text-primary"
            >
              <div 
                className="h-3 w-3 rounded-sm" 
                style={{ backgroundColor: entry.color }} 
              />
              <span className="text-sm font-medium">
                {entry.name}
              </span>
            </a>
          ))}
        </div>
        
        <div className="h-[400px] w-full relative">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-muted-foreground">Loading revenue data...</div>
            </div>
          ) : (
            <>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-bold">
                  ${totalRevenue.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Revenue
                </p>
              </div>
              
              {/* Donut chart */}
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="80%"
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={entry.color}
                        className="stroke-background hover:opacity-80"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}