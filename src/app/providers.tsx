'use client';

import { GoogleAnalyticsProvider } from "@/lib/analytics/google/GoogleAnalyticsProvider";
import { OpenPanelProvider } from "@/lib/analytics/openpanel/OpenPanelProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GoogleAnalyticsProvider />
      <OpenPanelProvider />
      {children}
    </>
  );
}