import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidPhone(phone: string): boolean {
  return /^[\d\-+()]{10,15}$/.test(phone);
}
