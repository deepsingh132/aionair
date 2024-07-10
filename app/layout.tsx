import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import ConvexClerkProvider from "../providers/ConvexClerkProvider";
import AudioProvider from "@/providers/AudioProvider";
import { Toaster } from "@/components/ui/toaster";
import IsFetchingProvider from "@/providers/IsFetchingProvider";
import { ErrorBoundary } from "react-error-boundary";
const manrope = Manrope({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OnAirAI",
  description: "Generate podcasts in your language on the fly using AI",
  icons: {
    icon: '/icons/miclogo.svg'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <IsFetchingProvider>
        <AudioProvider>
          <body className={`${manrope.className}`}>
              <Toaster />
            {children}
          </body>
          {/* <Script async src="https://js.stripe.com/v3/pricing-table.js"></Script> */}
          </AudioProvider>
          </IsFetchingProvider>
          </ErrorBoundary>
      </html>
    </ConvexClerkProvider>
  );
}
