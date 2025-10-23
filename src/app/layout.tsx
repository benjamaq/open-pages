import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import PWARegister from "./components/PWARegister";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import PWAInstallFab from "./components/PWAInstallFab";
import PWAHeaderInstall from "./components/PWAHeaderInstall";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "BioStackr – Understand Your Chronic Pain in 20 Seconds a Day",
  description: "Track pain, mood and sleep, log what you’re trying, and finally see patterns that help you manage chronic pain. Private by default; share with your doctor when ready.",
  keywords: ["chronic pain", "fibromyalgia", "autoimmune", "pain tracking", "sleep", "mood", "doctor", "shareable link"],
  authors: [{ name: "Open Pages" }],
  openGraph: {
    title: "BioStackr – Understand Your Chronic Pain",
    description: "Track pain, mood and sleep against what you’re trying. See patterns and share a timeline with your doctor.",
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
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <link rel="preconnect" href="https://connect.facebook.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.facebook.com" />
        <link rel="preconnect" href="https://www.facebook.com" crossOrigin="anonymous" />
        <link rel="manifest" href="/manifest-v2.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-title" content="BioStackr" />
        {/* Removed deprecated apple-mobile-web-app-capable to silence Chrome warning */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/apple-touch-icon-v2.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192-v2.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512-v2.png" />
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
        {/* Meta Pixel shim (define fbq queue BEFORE loader to avoid race) */}
        <Script id="meta-pixel-shim" strategy="beforeInteractive">
          {`
            (function(f){
              if (f.fbq) return;
              var n = function(){ n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) };
              n.queue = []; n.loaded = true; n.version = '2.0';
              f.fbq = n; f._fbq = n;
            })(window);
          `}
        </Script>
        {/* Meta Pixel loader and init */}
        <Script src="https://connect.facebook.net/en_US/fbevents.js" strategy="beforeInteractive" />
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            // Ensure fbq is defined even if the loader hasn't finished
            window.fbq = window.fbq || function(){(window.fbq.q = window.fbq.q || []).push(arguments)};
            window.fbq.loaded = true; window.fbq.version = '2.0';
            fbq('init', '704287959370274');
            fbq('track', 'PageView');
          `}
        </Script>
      </head>
      <body className="font-sans antialiased text-gray-900 min-h-screen leading-relaxed" style={{ backgroundColor: '#FFFFFF' }}>
        <noscript>
          <img height="1" width="1" style={{ display: 'none' }} src="https://www.facebook.com/tr?id=704287959370274&ev=PageView&noscript=1" />
        </noscript>
        <PWARegister />
        {/* Hide PWA header on shared link pages and desktop by default via CSS hook */}
        {!globalThis?.document?.body?.classList?.contains('public-link') && (
          <PWAHeaderInstall />
        )}
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
