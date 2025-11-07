"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tomorrow } from "next/font/google";

const tomorrow = Tomorrow({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-tomorrow" });

export default function UniversalHeader() {
  const pathname = usePathname() || "/";
  const isActive = (p: string) => pathname === p;
  // Solid header everywhere for clarity
  const transparentLanding = false;

  const headerClass = "border-b border-gray-100 bg-white";
  const logoTitleClass = `${tomorrow.className} text-lg sm:text-xl md:text-2xl font-medium text-gray-900 whitespace-nowrap`;
  const navLinkBase = "text-[12px] sm:text-sm md:text-base text-gray-700 hover:text-gray-900";
  const navLinkActive = "text-purple-600 font-medium";
  const ctaClass = "inline-flex items-center justify-center h-11 rounded-md bg-[#F4B860] px-5 text-[#2C2C2C] font-semibold hover:bg-[#E5A850]";

  return (
    <header className={headerClass} style={transparentLanding ? ({ top: 'var(--pwa-banner-offset, 0px)' } as any) : undefined}>
      <div className="container mx-auto px-4 py-1.5 md:py-4">
        <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between">
          <Link href="/" className={logoTitleClass} aria-label="BioStackr home">
            <span className="tracking-wider">BIOSTACK</span>
            <span className="inline-block align-baseline ml-1 origin-center scale-x-[-1] text-[1.2em]">R</span>
          </Link>
          <div className="flex items-center justify-end gap-2 md:gap-6">
            <nav className="flex items-center gap-3 md:gap-4 text-xs md:text-base">
              <Link href="/contact" className={navLinkBase}>Contact</Link>
              <Link href="/auth/signup" className={`${navLinkBase} whitespace-nowrap`}>Sign Up</Link>
              <Link href="/auth/signin" className={`${navLinkBase} whitespace-nowrap`}>Sign In</Link>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}


