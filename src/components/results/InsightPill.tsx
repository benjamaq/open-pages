"use client";

import React from "react";

type Props = {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger";
  className?: string;
};

const toneMap: Record<NonNullable<Props["tone"]>, string> = {
  neutral: "bg-neutral-100 text-neutral-700 border border-neutral-200",
  success: "bg-green-100 text-green-700 border border-green-200",
  warning: "bg-amber-100 text-amber-700 border border-amber-200",
  danger: "bg-red-100 text-red-700 border border-red-200",
};

export default function InsightPill({ label, tone = "neutral", ...rest }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${toneMap[tone]} ${rest.className ?? ""}`}
    >
      {label}
    </span>
  );
}

