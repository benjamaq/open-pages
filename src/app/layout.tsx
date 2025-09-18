import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
      <body className="font-sans antialiased text-gray-900 min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
