/**
 * Format timestamp ala WhatsApp Status:
 * - Hari Ini Pukul HH.mm
 * - Kemarin Pukul HH.mm
 * - dd MMM Pukul HH.mm
 */
export function formatWhatsAppTime(dateString: string): string {
  const d = new Date(dateString);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  const timeStr = d
    .toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
    .replace(':', '.');

  if (isToday) {
    return `Hari Ini Pukul ${timeStr}`;
  }
  if (isYesterday) {
    return `Kemarin Pukul ${timeStr}`;
  }
  return d
    .toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
    .replace(':', '.');
}
