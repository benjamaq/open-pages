"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tomorrow } from "next/font/google";

const tomorrow = Tomorrow({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-tomorrow" });

export default function UniversalHeader() {
  const pathname = usePathname() || "/";
  const isActive = (p: string) => pathname === p;
  // Use transparent, white-text header only on sleep landing (root or /sleep)
  const transparentLanding = pathname === "/" || pathname.startsWith("/sleep");

  const headerClass = transparentLanding
    ? "absolute top-0 left-0 right-0 z-30"
    : "border-b border-gray-100 bg-white";
  const logoTitleClass = transparentLanding ? `${tomorrow.className} text-xl md:text-3xl font-medium text-white whitespace-nowrap` : `${tomorrow.className} text-xl md:text-2xl font-medium text-gray-900 whitespace-nowrap`;
  const navLinkBase = transparentLanding ? "text-sm md:text-base text-white/85 hover:text-white" : "text-sm md:text-base text-gray-700 hover:text-gray-900";
  const navLinkActive = transparentLanding ? "text-white" : "text-purple-600 font-medium";
  const ctaClass = "inline-flex items-center justify-center h-11 rounded-md bg-[#F4B860] px-5 text-[#2C2C2C] font-semibold hover:bg-[#E5A850]";

  return (
    <header className={headerClass}>
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center">
            <Link href="/" className={logoTitleClass} aria-label="BioStackr home">
              <span className="tracking-wider">BIOSTACK</span>
              <span className="inline-block align-baseline ml-1 origin-center scale-x-[-1] text-[1.2em]">R</span>
            </Link>
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            <nav className="flex items-center gap-3 md:gap-4">
              <Link
                href="/"
                className={`${navLinkBase} ${isActive("/") ? navLinkActive : ""}`}
              >
                Sleep
              </Link>
              <Link
                href="/pain"
                className={`${navLinkBase} ${isActive("/pain") ? navLinkActive : ""}`}
              >
                Pain
              </Link>
              <Link
                href="/migraines"
                className={`${navLinkBase} ${isActive("/migraines") || isActive("/migraine") ? navLinkActive : ""}`}
              >
                Migraines
              </Link>
              <Link
                href="/contact"
                className={navLinkBase}
              >
                Contact
              </Link>
            </nav>
            <Link href="/auth/signin" className={navLinkBase}>
              Sign In
            </Link>
            <Link href="/auth/signup" className={`${ctaClass} h-10 md:h-11 px-4 md:px-5 text-sm md:text-base`}>
              Start Free
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}


