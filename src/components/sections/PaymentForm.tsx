"use client";
// app/components/sections/PaymentForm.tsx

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Confetti } from "@/components/ui/confetti";
import { supabase } from "@/lib/supabase";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import confetti from "canvas-confetti";

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Unless you're Elon's kid, your name is probably longer than 1 character.",
  }),
  message: z.string().min(1, { message: "Don't be shy!" }),
  amount: z.number().min(1, {
    message: "Sorry, Stripe fees are too high to be less than a $1.",
  }).default(1),
});

type FormData = z.infer<typeof formSchema>;

interface PaymentFormProps {
  onSuccess?: (notification: { name: string; message: string; amount: number }) => void;
}

// Inner Payment Form Component that uses Stripe hooks
function CheckoutForm({ onSuccess }: PaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [showPaymentElement, setShowPaymentElement] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const stripe = useStripe();
  const elements = useElements();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 1,
    },
  });

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate form before showing payment element
    const isValid = await form.trigger();
    if (isValid) {
      setShowPaymentElement(true);
    }
  };

  const resetForm = () => {
    form.reset({
      name: '',
      message: '',
      amount: 1
    });
    setShowPaymentElement(false);
  };

  const triggerConfettiEffect = () => {
    // Create money emoji shape
    const scalar = 2;
    const moneyEmoji = confetti.shapeFromText({ text: "🤑", scalar });

    // Emoji burst config
    const emojiDefaults = {
      spread: 360,
      ticks: 60,
      gravity: 0,
      decay: 0.96,
      startVelocity: 20,
      shapes: [moneyEmoji],
      scalar,
      colors: ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"],
    };

    // Side cannon animation
    const end = Date.now() + 5 * 1000; // 5 seconds duration

    const shootEmoji = () => {
      confetti({
        ...emojiDefaults,
        particleCount: 15,
      });

      confetti({
        ...emojiDefaults,
        particleCount: 5,
        shapes: ["circle"],
      });
    };

    const shootSideCannons = () => {
      if (Date.now() > end) return;

      // Left cannon
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors: ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"],
      });

      // Right cannon
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors: ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"],
      });

      requestAnimationFrame(shootSideCannons);
    };

    // Trigger both effects
    shootSideCannons();
    setTimeout(shootEmoji, 0);
    setTimeout(shootEmoji, 200);
    setTimeout(shootEmoji, 400);
  };

  const onSubmit = async (values: FormData) => {
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (result.error) {
        throw result.error;
      }

      if (result.paymentIntent?.status === "succeeded") {
        const { error: supabaseError } = await supabase
          .from("1kby2025_payments")
          .insert([values]);

        if (supabaseError) throw supabaseError;

        setShowConfetti(true);
        triggerConfettiEffect();
        onSuccess?.(values);
        resetForm();
        setTimeout(() => setShowConfetti(false), 5000);
      }
    } catch (error) {
      console.error("Payment error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>1/1000</CardTitle>
        <CardDescription>
          Write a message for the board and see your dollar become 1/1000.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form 
            onSubmit={showPaymentElement ? form.handleSubmit(onSubmit) : handleInitialSubmit} 
            className="space-y-4"
          >
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

            {showPaymentElement && <PaymentElement />}

            <Button 
              type="submit" 
              disabled={loading || (showPaymentElement && (!stripe || !elements))} 
              className="w-full"
            >
              {loading ? "Processing..." : 
               showPaymentElement ? `Complete Payment for $${form.watch("amount") || 1}` :
               `Pay $${form.watch("amount") || 1}`}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Main PaymentForm component stays the same
export function PaymentForm(props: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string>("");

  useEffect(() => {
    fetch("/api/stripe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 1 }),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret))
      .catch((error) => console.error("Error:", error));
  }, []);

  const appearance = {
    theme: 'stripe' as const,
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <>
      {clientSecret && (
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm {...props} />
        </Elements>
      )}
    </>
  );
}