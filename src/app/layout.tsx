import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import PWARegister from "./components/PWARegister";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import PWAInstallFab from "./components/PWAInstallFab";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Open Pages - Share Your Health Journey",
  description: "Create and share your public health and biohacking profile. Showcase your stack, protocols, and wellness journey with a clean, professional profile page.",
  keywords: ["health", "biohacking", "wellness", "profile", "stack", "protocols"],
  authors: [{ name: "Open Pages" }],
  openGraph: {
    title: "Open Pages - Share Your Health Journey",
    description: "Create and share your public health and biohacking profile.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="manifest" href="/manifest.json?v=2" />
        <meta name="theme-color" content="#111827" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-BQJWCVNJH0"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-BQJWCVNJH0', {
              page_title: document.title,
              page_location: window.location.href
            });
            
            // Send initial page view
            gtag('event', 'page_view', {
              page_title: document.title,
              page_location: window.location.href,
              page_path: window.location.pathname
            });
            
            console.log('Google Analytics initialized with ID: G-BQJWCVNJH0');
            console.log('GA Debug - Page loaded:', window.location.href);
            console.log('GA Debug - DataLayer:', window.dataLayer);
          `}
        </Script>
      </head>
      <body className="font-sans antialiased text-gray-900 min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
        <PWARegister />
        <PWAInstallPrompt />
        <PWAInstallFab />
        <div className="flex flex-col min-h-screen">
          {children}
        </div>
        <Script id="pwa-marker" strategy="afterInteractive">
          {`
            console.log('🔎 PWA marker: data-pwa-client =', document.body?.getAttribute('data-pwa-client'));
          `}
        </Script>
      </body>
    </html>
  );
}
