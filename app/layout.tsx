import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import ConvexClerkProvider from "../providers/ConvexClerkProvider";
import AudioProvider from "@/providers/AudioProvider";
import { Toaster } from "@/components/ui/toaster";
import IsFetchingProvider  from "@/providers/IsFetchingProvider";

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
        <IsFetchingProvider>
        <AudioProvider>
          <body className={`${manrope.className}`}>
              <Toaster />
            {children}
          </body>
          {/* <Script async src="https://js.stripe.com/v3/pricing-table.js"></Script> */}
          </AudioProvider>
        </IsFetchingProvider>
      </html>
    </ConvexClerkProvider>
  );
}
