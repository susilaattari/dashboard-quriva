function normalizeWhatsApp(value: string) {
  const phone = value.replace(/[^0-9]/g, '');
  return phone.startsWith('0') ? `62${phone.slice(1)}` : phone;
}

export const BRAND = {
  name: 'Quriva',
  companyName: process.env.NEXT_PUBLIC_COMPANY_NAME || 'PT Quriva Indonesia',
  rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'quriva.tech',
  supportWhatsApp: normalizeWhatsApp(process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '6289614072349'),
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@quriva.com',
  bank: {
    bank: process.env.NEXT_PUBLIC_BANK_NAME || 'Bank Syariah Indonesia (BSI)',
    accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || '7123456789',
    accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || 'PT Quriva Indonesia',
  },
} as const;

export function getTenantHost(subdomain?: string | null) {
  return subdomain ? `${subdomain}.${BRAND.rootDomain}` : BRAND.rootDomain;
}

export function getSupportWhatsAppUrl(message?: string) {
  const phone = BRAND.supportWhatsApp.replace(/[^0-9]/g, '');
  const query = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${phone}${query}`;
}

export function getBankTransferInfo() {
  return `${BRAND.bank.bank}\nNo. Rekening: ${BRAND.bank.accountNumber}\na.n. ${BRAND.bank.accountName}`;
}
