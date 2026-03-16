'use client';
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Tomorrow } from "next/font/google";
import { createClient } from "@/lib/supabase/client";

const tomorrow = Tomorrow({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-tomorrow" });

export default function UniversalHeader() {
  const pathname = usePathname() || "/";
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        setIsAuthed(!!data?.user);
      } catch {
        setIsAuthed(false);
      }
    })();
  }, []);

  const headerClass =
    "fixed left-0 right-0 top-0 z-50 w-full border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80";
  const logoTitleClass = `${tomorrow.className} text-base sm:text-xl md:text-2xl font-medium text-gray-900 whitespace-nowrap`;
  const navLinkBase = "text-xs sm:text-sm md:text-base text-gray-700 hover:text-gray-900 whitespace-nowrap";
  const signUpBtn =
    "inline-flex items-center justify-center h-7 sm:h-9 rounded-full border border-neutral-300 px-2.5 sm:px-3 text-xs sm:text-sm text-gray-900 font-semibold hover:bg-neutral-100";
  const signOutBtn =
    "inline-flex items-center justify-center h-7 sm:h-10 rounded-full border border-neutral-300 px-2.5 sm:px-4 text-sm text-gray-800 hover:bg-neutral-100";

  const homeHref = isAuthed ? "/dashboard" : "/";
  const signUpHref = pathname === "/" ? "/#pricing" : "/pricing";
  const handleSignUpClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      try {
        e.preventDefault();
        const el = document.getElementById("pricing");
        if (el && typeof el.scrollIntoView === "function") {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          // Fallback to hash navigation
          window.location.hash = "pricing";
        }
      } catch {
        // Fallback to hash navigation on any error
        try { window.location.hash = "pricing"; } catch {}
      }
    }
  };

  return (
    <header className={headerClass}>
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="h-12 sm:h-16 flex items-center justify-between">
          <Link href={homeHref} className={logoTitleClass} aria-label="BioStackr home">
            <span className="tracking-wider">BIOSTACK</span>
            <span className="inline-block align-baseline ml-1 origin-center scale-x-[-1] text-[1.2em]">R</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            {!isAuthed ? (
              <>
                {pathname?.startsWith('/cohorts') ? (
                  <Link href="/" className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-neutral-50 px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-neutral-800 hover:text-black hover:bg-neutral-100 whitespace-nowrap">
                    For Individuals
                  </Link>
                ) : (
                  <Link href="/cohorts" className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-neutral-50 px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-neutral-800 hover:text-black hover:bg-neutral-100 whitespace-nowrap">
                    For Brands
                  </Link>
                )}
                <Link href="/auth/signin" className={navLinkBase}>
                  Sign In
                </Link>
                <Link href={signUpHref} onClick={handleSignUpClick} className={signUpBtn}>
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                {pathname?.startsWith('/cohorts') ? (
                  <Link href="/" className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-neutral-50 px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-neutral-800 hover:text-black hover:bg-neutral-100 whitespace-nowrap">
                    For Individuals
                  </Link>
                ) : (
                  <Link href="/cohorts" className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-neutral-50 px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-neutral-800 hover:text-black hover:bg-neutral-100 whitespace-nowrap">
                    For Brands
                  </Link>
                )}
                <Link href="/auth/signout" className={signOutBtn}>
                  Sign Out
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}


