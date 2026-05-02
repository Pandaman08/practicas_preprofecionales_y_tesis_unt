import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(dateString: string | Date, pattern = 'dd/MM/yyyy'): string {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, pattern, { locale: es });
  } catch {
    return '-';
  }
}

export function formatDateTime(dateString: string | Date): string {
  return formatDate(dateString, 'dd/MM/yyyy HH:mm');
}

export function timeAgo(dateString: string | Date): string {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  } catch {
    return '-';
  }
}

export function isExpired(dateString: string): boolean {
  try {
    return parseISO(dateString) < new Date();
  } catch {
    return false;
  }
}
