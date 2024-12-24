// src/components/PaymentForm.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Confetti } from '@/components/ui/confetti';
import { supabase } from '@/lib/supabase';

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  message: z.string().min(1, { message: 'Message is required.' }),
  amount: z.number().min(1, { message: 'Amount must be at least $1.' }).default(1),
});

interface PaymentFormProps {
  onSuccess?: (notification: { name: string; message: string; amount: number }) => void;
}

export function PaymentForm({ onSuccess }: PaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 1,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      
      // TODO: Add Stripe payment integration here
      
      // Save to Supabase
      const { error } = await supabase
        .from('1kby2025_payments')
        .insert([values]);

      if (error) throw error;

      // Show success effects
      setShowConfetti(true);
      onSuccess?.(values);
      form.reset();

      setTimeout(() => setShowConfetti(false), 5000);
    } catch (error) {
      console.error('Payment error:', error);
      // TODO: Add error handling
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>1/1000</CardTitle>
        <CardDescription>
          Write a message for the board and see your dollar become 1/1000. Nothing else.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Input placeholder="Your message" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={loading} className="w-full">
              Pay ${form.watch('amount')}
            </Button>
          </form>
        </Form>
      </CardContent>
      {showConfetti && <Confetti />}
    </Card>
  );
}