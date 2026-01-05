import React from "react";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingFieldIndicatorProps {
  className?: string;
}

export function LoadingFieldIndicator({ className }: LoadingFieldIndicatorProps) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 animate-pulse", className)}>
      <Loader2 className="h-3 w-3 animate-spin" />
      Auto-filling...
    </span>
  );
}

interface AutoFilledBadgeProps {
  source?: string;
  confidence?: "high" | "medium" | "low";
  className?: string;
  children?: React.ReactNode;
}

export function AutoFilledBadge({ source, confidence, className, children }: AutoFilledBadgeProps) {
  const getConfidenceColor = (conf?: string) => {
    switch (conf) {
      case "high":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-blue-100 text-blue-800";
      case "low":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSourceDisplay = (src?: string) => {
    switch (src) {
      case "google_places":
        return "Google Places";
      case "smart_defaults":
        return "Smart Default";
      case "county_records":
        return "County Records";
      default:
        return "Auto-filled";
    }
  };

  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", getConfidenceColor(confidence), className)}>
      <Sparkles className="h-3 w-3" />
      {children || getSourceDisplay(source)}
    </span>
  );
}

interface SmartDefaultBadgeProps {
  className?: string;
}

export function SmartDefaultBadge({ className }: SmartDefaultBadgeProps) {
  return (
    <span className={cn("inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800", className)}>
      Smart Default
    </span>
  );
}

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export function ErrorMessage({ message, className }: ErrorMessageProps) {
  return (
    <div className={cn("inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-red-50 text-red-800 border border-red-200", className)}>
      <AlertCircle className="h-4 w-4" />
      {message}
    </div>
  );
}