"use client";

import React from "react";

type Props = {
  text: string;
  tone?: "neutral" | "success" | "warning" | "danger";
};

const iconByTone: Record<NonNullable<Props["tone"]>, { icon: string; color: string }> = {
  neutral: { icon: "•", color: "text-neutral-500" },
  success: { icon: "✔︎", color: "text-green-600" },
  warning: { icon: "⚑", color: "text-amber-600" },
  danger: { icon: "!", color: "text-red-600" },
};

export default function InsightBullet({ text, tone = "neutral" }: Props) {
  const conf = iconByTone[tone];
  return (
    <li className="flex items-start gap-2">
      <span className={`mt-0.5 text-xs ${conf.color}`}>{conf.icon}</span>
      <span className="text-sm md:text-[15px] text-neutral-700 leading-relaxed">{text}</span>
    </li>
  );
}

