import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
}