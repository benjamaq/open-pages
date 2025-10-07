import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";

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
          `}
        </Script>
      </head>
      <body className="font-sans antialiased text-gray-900 min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
