// src/components/NotificationList.tsx
'use client';

import { useEffect, useState } from 'react';
import { AnimatedList } from '@/components/ui/animated-list';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PaymentNotification } from '@/types/supabase';
import { supabase } from '@/lib/supabase';
import { DollarSign } from 'lucide-react';

function NotificationItem({ notification }: { notification: PaymentNotification }) {
  const [formattedDate, setFormattedDate] = useState<string>('');

  useEffect(() => {
    setFormattedDate(new Date(notification.created_at).toLocaleString());
  }, [notification.created_at]);

  return (
    <div className="flex items-center justify-between space-x-4 rounded-lg border p-4 bg-gray-50/50 dark:bg-gray-950/40">
      <div className="flex items-center space-x-4">
        <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
          <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold">{notification.name}</p>
          <p className="text-sm text-muted-foreground font-medium">{notification.message}</p>
          <p className="text-xs text-muted-foreground">{formattedDate}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-green-600 dark:text-green-400">
          ${notification.amount.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

export function NotificationList() {
  const [notifications, setNotifications] = useState<PaymentNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial notifications
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('1kby2025_payments')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      setNotifications(data);
      setLoading(false);
    };

    fetchNotifications();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('1kby2025_payments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: '1kby2025_payments',
        },
        (payload) => {
          const newNotification = payload.new as PaymentNotification;
          setNotifications((prev) => [newNotification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Recent Contributions</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex items-center justify-center p-4">
            <p className="text-muted-foreground">No contributions yet. Be the first!</p>
          </div>
        ) : (
          <AnimatedList className="space-y-4">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))}
          </AnimatedList>
        )}
      </CardContent>
    </Card>
  );
}