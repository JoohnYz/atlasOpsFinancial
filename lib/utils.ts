import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateFilename(name: string, maxLength: number = 15): string {
  if (name.length <= maxLength) return name
  const extension = name.split('.').pop()
  const nameWithoutExtension = name.substring(0, name.lastIndexOf('.'))
  const charsToKeep = maxLength - (extension?.length || 0) - 4 // 4 for "..." and a bit of spacing
  if (charsToKeep <= 0) return name.substring(0, maxLength - 3) + "..."
  return nameWithoutExtension.substring(0, charsToKeep) + "..." + (extension ? `.${extension}` : "")
}
