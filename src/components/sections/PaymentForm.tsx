"use client";

import { useState } from "react";
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

// Main PaymentForm component
export function PaymentForm(props: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const resetForm = () => {
    setClientSecret("");
    setFormData(null);
    setError(null);
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

  const handleInitialSubmit = async (values: FormData) => {
    console.log("Starting payment submission with values:", values);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }
      
      if (!data.clientSecret) {
        throw new Error("No clientSecret received from server");
      }
      
      setFormData(values);
      setClientSecret(data.clientSecret);
    } catch (error) {
      console.error("Error creating payment:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
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
        {error && (
          <div className="mb-4 p-4 text-red-500 bg-red-50 rounded-md">
            {error}
          </div>
        )}
        
        {!clientSecret ? (
          <InitialForm onSubmit={handleInitialSubmit} loading={loading} />
        ) : (
          <Elements 
            stripe={stripePromise} 
            options={{
              clientSecret,
              appearance: { theme: 'stripe' },
            }}
          >
            <CheckoutForm 
              {...props} 
              clientSecret={clientSecret} 
              formData={formData}
              onReset={resetForm}
              onSuccess={triggerConfettiEffect}
            />
          </Elements>
        )}
      </CardContent>
    </Card>
  );
}

// InitialForm component
function InitialForm({ onSubmit, loading }: { onSubmit: (data: FormData) => void, loading: boolean }) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 1,
    },
  });

  return (
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

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full"
        >
          {loading ? "Processing..." : "Continue to Payment"}
        </Button>
      </form>
    </Form>
  );
}

// CheckoutForm component
function CheckoutForm({ 
  onSuccess, 
  onReset,
  clientSecret,
  formData 
}: PaymentFormProps & { 
  clientSecret: string;
  formData: FormData | null;
  onReset: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stripe = useStripe();
  const elements = useElements();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || !formData) {
      console.error("Missing required data:", { stripe, elements, formData });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Confirming payment with values:", formData);
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: "if_required",
      });

      console.log("Payment confirmation result:", result);

      if (result.error) {
        throw result.error;
      }

      if (result.paymentIntent?.status === "succeeded") {
        console.log("Payment succeeded, saving to Supabase");
        const { error: supabaseError } = await supabase
          .from("1kby2025_payments")
          .insert([formData]);

        if (supabaseError) throw supabaseError;

        onSuccess?.(formData);
        onSuccess(); // Trigger confetti
        onReset(); // Reset form to initial state
      }
    } catch (error) {
      console.error("Payment error:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!stripe || !elements) {
    return <div>Loading payment form...</div>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="p-4 text-red-500 bg-red-50 rounded-md">
          {error}
        </div>
      )}
      
      <PaymentElement />
      
      <div className="flex gap-4">
        <Button 
          type="button" 
          variant="outline"
          onClick={onReset}
          className="flex-1"
        >
          Back
        </Button>
        <Button 
          type="submit" 
          disabled={loading || !stripe || !elements} 
          className="flex-1"
        >
          {loading ? "Processing..." : `Pay $${formData?.amount || 0}`}
        </Button>
      </div>
    </form>
  );
}