"use client";
import { usePathname } from "next/navigation";
import UniversalHeader from "./UniversalHeader";

export default function HeaderGate() {
  const pathname = usePathname() || "/";
  // Show the marketing header only on public landing routes
  const allow = ["/", "/sleep", "/sleep-v2", "/sleep-v3"]; 
  const isLanding = allow.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!isLanding) return null;
  return <UniversalHeader />;
}


