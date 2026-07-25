import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const DEFAULT_AVATAR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk0YTNiOCIgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIHN0eWxlPSJiYWNrZ3JvdW5kLWNvbG9yOiMxZTI5M2IiPjxjaXJjbGUgY3g9IjEyIiBjeT0iOCIgcj0iNCIvPjxwYXRoIGQ9Ik0xMiAxNGMtNi4xIDAtOCA0LTggNHYyaDE2di0ycz0xLjktNC04LTR6Ii8+PC9zdmc+";
