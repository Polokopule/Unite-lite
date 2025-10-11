import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { User } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeAgo(timestamp: number): string {
    const now = new Date();
    const secondsAgo = Math.round((now.getTime() - timestamp) / 1000);

    if (secondsAgo < 5) {
        return 'now';
    } else if (secondsAgo < 60) {
        return `${secondsAgo}s ago`;
    }

    const minutesAgo = Math.floor(secondsAgo / 60);
    if (minutesAgo < 60) {
        return `${minutesAgo}m ago`;
    }

    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo < 24) {
        return `${hoursAgo}h ago`;
    }

    const daysAgo = Math.floor(hoursAgo / 24);
     if (daysAgo < 7) {
        return `${daysAgo}d ago`;
    }
    
    const weeksAgo = Math.floor(daysAgo / 7);
    if (weeksAgo < 4) {
        return `${weeksAgo}w ago`;
    }
    
    const monthsAgo = Math.floor(daysAgo / 30);
    if (monthsAgo < 12) {
        return `${monthsAgo}mo ago`;
    }

    const yearsAgo = Math.floor(daysAgo / 365);
    return `${yearsAgo}y ago`;
}

export const isVerified = (user: User) => {
    return user.email === 'polokopule91@gmail.com' || (user.followers && user.followers.length >= 1000000);
}
