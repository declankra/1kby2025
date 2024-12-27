// src/components/sections/DonutChart.tsx
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

// Revenue source configuration
const SOURCES = [
  { 
    id: 'ios',
    name: 'iOS Apps',
    color: 'hsl(var(--chart-1))',
  },
  { 
    id: 'web',
    name: 'Web Apps',
    color: 'hsl(var(--chart-2))',
  }
];

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
        const [iosResponse, webResponse] = await Promise.all([
          fetch('/api/sales/ios'),
          fetch('/api/sales/stripe')
        ]);

        if (!iosResponse.ok || !webResponse.ok) {
          throw new Error('Failed to fetch revenue data');
        }

        const iosData = await iosResponse.json();
        const webData = await webResponse.json();

        // Calculate total revenue for each source
        const iosTotal = iosData.reduce((sum: number, day: any) => sum + day.amount, 0);
        const webTotal = webData.reduce((sum: number, day: any) => sum + day.amount, 0);

        // Format data for the pie chart
        const chartData = [
          { ...SOURCES[0], value: iosTotal },
          { ...SOURCES[1], value: webTotal }
        ];

        setData(chartData);
        setTotalRevenue(iosTotal + webTotal);
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
        <CardTitle>Revenue by Source</CardTitle>
        <CardDescription>Distribution between iOS and Web application revenue</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="mb-6 flex justify-center gap-6">
          {SOURCES.map((source) => (
            <div
              key={source.id}
              className="flex items-center gap-2"
            >
              <div 
                className="h-3 w-3 rounded-sm" 
                style={{ backgroundColor: source.color }} 
              />
              <span className="text-sm font-medium">
                {source.name}
              </span>
            </div>
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
                  Total Revenue
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