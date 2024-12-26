"use client";

import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Type definitions
interface RevenueData {
  date: string;
  'Race Time Calculator': number;
  '1000by2025.quest': number;
}

interface Product {
  name: string;
  color: string;
}

const DEFAULT_START_DATE = '2024-02-02';

// Constants
const products: Product[] = [
  { name: 'Race Time Calculator', color: 'hsl(var(--chart-1))' },
  { name: '1000by2025.quest', color: 'hsl(var(--chart-2))' },
];

const timeRanges = [
  { value: 'all', label: 'All Time' },
  { value: '2024', label: '2024' },
  { value: '2025', label: '2025' },
  { value: '90', label: 'Last 90 Days' },
  { value: '30', label: 'Last 30 Days' },
];

export default function RevAreaChart() {
  const [timeRange, setTimeRange] = useState('all');
  const [data, setData] = useState<RevenueData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to filter data based on time range
  const filterDataByTimeRange = (data: RevenueData[], range: string) => {
    if (range === 'all') return data;
    
    const days = parseInt(range);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return data.filter(item => new Date(item.date) >= cutoffDate);
  };

  // Fetch data from both APIs
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch data from both endpoints
        const [iosResponse, stripeResponse] = await Promise.all([
          fetch('/api/sales/ios'),
          fetch('/api/sales/stripe')
        ]);

        if (!iosResponse.ok || !stripeResponse.ok) {
          throw new Error('Failed to fetch revenue data');
        }

        const iosData = await iosResponse.json();
        const stripeData = await stripeResponse.json();

        // Helper function to generate all dates in range
        const generateDateRange = (startDate: string, endDate: string) => {
          const dates: string[] = [];
          let currentDate = new Date(startDate);
          const lastDate = new Date(endDate);
          
          while (currentDate <= lastDate) {
            dates.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
          }
          
          return dates;
        };

        const minDate = (() => {
          switch (timeRange) {
            case '2024':
              return '2024-01-02';
            case '2025':
              return '2025-01-02';
            case 'all':
              return DEFAULT_START_DATE;
            default:
              const date = new Date();
              date.setDate(date.getDate() - parseInt(timeRange));
              return date.toISOString().split('T')[0];
          }
        })();
        
        const maxDate = (() => {
          switch (timeRange) {
            case '2024':
              return '2024-12-31';
            case '2025':
              return '2025-12-31';
            default:
              return new Date().toISOString().split('T')[0];
          }
        })();

        // Generate continuous date range
        const dateRange = generateDateRange(minDate, maxDate);

        // Combine the data with filled gaps
        const combinedData = dateRange.map(date => ({
          date,
          'Race Time Calculator': iosData.find((d: any) => d.date === date)?.amount || 0,
          '1000by2025.quest': stripeData.find((d: any) => d.date === date)?.amount || 0,
        }));

        // Sort by date
        combinedData.sort((a, b) => a.date.localeCompare(b.date));

        // Filter based on selected time range
        const filteredData = filterDataByTimeRange(combinedData, timeRange);
        setData(filteredData);
      } catch (err) {
        console.error('Error fetching revenue data:', err);
        setError('Failed to load revenue data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  // Format date for tooltip and axis
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <p className="font-medium">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p
              key={`revenue-${index}`}
              className="text-sm"
              style={{ color: entry.color }}
            >
              {entry.name}: ${entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Revenue Over Time</CardTitle>
            <CardDescription>Live revenue across all products since inception</CardDescription>
          </div>
          <Select
            value={timeRange}
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-muted-foreground">Loading revenue data...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  fontSize={12}
                  tickMargin={10}
                  interval="preserveStartEnd"
                  minTickGap={50}
                  />
                
                <YAxis
                  tickFormatter={(value) => `$${value}`}
                  fontSize={12}
                  tickMargin={10}
                />
                <Tooltip content={<CustomTooltip />} />
                {products.map((product) => (
                  <Area
                    key={product.name}
                    type="monotone"
                    dataKey={product.name}
                    stackId="1"
                    stroke={product.color}
                    fill={product.color}
                    fillOpacity={0.3}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}