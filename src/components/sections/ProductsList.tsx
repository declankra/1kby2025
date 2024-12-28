"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Smartphone, Globe, Lightbulb } from "lucide-react";
import Link from "next/link";

// Define a type for products
type Product = {
  name: string;
  link: string;
  type: "ios" | "web" | "other";
  description: string;
};

// Updated product data with type and separate description
const PRODUCTS: Product[] = [
  {
    name: "Race Time Calculator",
    description: "Predict your race time using your running data",
    link: "https://apps.apple.com/app/race-time-calculator/id6478423515",
    type: "ios",
  },
  {
    name: "1000by2025.quest",
    description: "Track progress towards revenue goal and POC for web app Stripe payments",
    link: "https://1000by2025.quest",
    type: "web",
  },
  {
    name: "Coming soon...",
    description: "Stay tuned. Ship-uary starts Jan 1st 2025.",
    link: "https://dkbuilds.co",
    type: "other",
  },
] as const;

export function ProductsList() {
  return (
    <div className="mx-auto max-w-md w-full">
      <Accordion type="single" collapsible>
        <AccordionItem value="products" className="border-none">
          <AccordionTrigger className="text-sm hover:no-underline">
            Revenue Generating Products
          </AccordionTrigger>
          <AccordionContent className="rounded-lg p-4">
            <ul className="space-y-3 text-sm text-muted-foreground">
              {PRODUCTS.map((product) => (
                <li key={product.name} className="flex items-start gap-2">
                  {product.type === "ios" ? (
                    <Smartphone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  ) : product.type === "web" ? (
                    <Globe className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <Link
                      href={product.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline font-medium text-foreground"
                    >
                      {product.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {product.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}