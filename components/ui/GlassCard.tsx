"use client";

import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  status?: "safe" | "alert" | null;
}

export function GlassCard({ children, className = "", status }: GlassCardProps) {
  const statusClass = status === "safe" ? "status-safe" : status === "alert" ? "status-alert" : "";
  
  return (
    <div className={`glass-card ${statusClass} ${className}`}>
      {children}
    </div>
  );
}
