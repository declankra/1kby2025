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
    <div className="flex items-center space-x-4 rounded-lg border p-4">
      <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
        <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium">{notification.name}</p>
        <p className="text-sm text-muted-foreground">{notification.message}</p>
        <p className="text-xs text-muted-foreground">
          ${notification.amount.toFixed(2)} • {formattedDate}
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
        .from('payment_notifications')
        .select('*')
        .order('created_at', { ascending: false })
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
      .channel('payment_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payment_notifications',
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