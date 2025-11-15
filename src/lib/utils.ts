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