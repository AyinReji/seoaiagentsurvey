/**
 * CSS Utility — Class Name Merger
 * =================================
 * Combines Tailwind CSS classes with proper conflict resolution.
 *
 * Uses:
 * - `clsx` for conditional class joining (handles arrays, objects, falsy values)
 * - `twMerge` for Tailwind-specific deduplication (e.g., "px-2 px-4" → "px-4")
 *
 * Usage:
 *   cn("px-4 py-2", isActive && "bg-primary", "px-6")
 *   // → "py-2 px-6 bg-primary" (px-4 is properly overridden by px-6)
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
