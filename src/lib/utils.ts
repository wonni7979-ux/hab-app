import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAmount(value: string | number): string {
  const numStr = value.toString().replace(/[^0-9-]/g, "")
  if (!numStr) return ""
  const parts = numStr.split(".")
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return parts.join(".")
}

export function parseAmount(value: string): number {
  return parseInt(value.replace(/,/g, "")) || 0
}
