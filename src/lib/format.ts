const STATUS_LABELS: Record<string, string> = {
  active: 'Aktif',
  inactive: 'Tidak Aktif',
  pending: 'Menunggu',
  pending_approval: 'Menunggu Persetujuan',
  approved: 'Disetujui',
  revoked: 'Dicabut',
  rejected: 'Ditolak',
  suspended: 'Suspended',
  cancelled: 'Dibatalkan',
  paid: 'Lunas',
  unpaid: 'Belum Bayar',
  expired: 'Kedaluwarsa',
};

export function safeString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return String(value);
}

export function getInitial(value: unknown): string {
  const text = safeString(value).trim();
  return text ? text.charAt(0).toUpperCase() : '?';
}

export function formatStatus(value: unknown): string {
  const key = safeString(value).trim();
  if (!key) return '-';
  return STATUS_LABELS[key] || key;
}

export function renderTemplate(template: unknown, tokens: Record<string, string | undefined>): string {
  return safeString(template).replace(/\{(\w+)\}/g, (_, key: string) => tokens[key] ?? '');
}
