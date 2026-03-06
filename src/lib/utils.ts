import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// A utility function to merge Tailwind CSS classes conditionally.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Shuffles an array using the Fisher-Yates algorithm, returning a new shuffled array.
export const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array]; // Create a shallow copy to avoid modifying the original array.
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]; // Swap elements.
  }
  return newArray;
};

// Proxies Google profile pictures through our backend.
export function getProxiedImageUrl(url: string | null | undefined, isInsideDiscord: boolean) {
  if (!url) return url;
  
  // If it's already a Discord-hosted image or data URI, don't proxy it.
  if (url.includes('discordapp') || url.startsWith('data:')) return url;
  
  // If we are in Discord, proxy external domains.
  if (isInsideDiscord) {
    return `/api/proxy/image?url=${encodeURIComponent(url)}`;
  }
  
  return url;
}