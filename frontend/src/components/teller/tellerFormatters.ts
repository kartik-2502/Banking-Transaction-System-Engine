export function formatCurrency(amount?: number | null, currency = 'INR'): string {
  const num = Number(amount ?? 0);
  if (currency === 'INR') {
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${currency} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function maskAccountNumber(accountNumber?: string | null): string {
  if (!accountNumber) return '—';
  if (accountNumber.length <= 4) return accountNumber;
  return `${'•'.repeat(Math.max(2, accountNumber.length - 4))}${accountNumber.slice(-4)}`;
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export function getStatusBadgeClass(status?: string | null): string {
  switch ((status || '').toUpperCase()) {
    case 'SUCCESS':
    case 'ACTIVE':
    case 'VERIFIED':
    case 'APPROVED':
    case 'CLEARED':
    case 'RESOLVED':
    case 'OPEN':
    case 'ON_DUTY':
    case 'BALANCED':
      return 'bg-emerald-900/15 text-emerald-900 border-emerald-700/30';
    case 'PENDING':
    case 'PENDING_VERIFICATION':
    case 'UNDER_REVIEW':
    case 'UNDER_PROCESSING':
    case 'SENT_FOR_CLEARING':
    case 'INVESTIGATING':
    case 'ESCALATED':
    case 'IN_PROGRESS':
    case 'BREAK':
      return 'bg-amber-900/15 text-amber-900 border-amber-700/30';
    case 'FAILED':
    case 'REJECTED':
    case 'FROZEN':
    case 'CLOSED':
    case 'BOUNCED':
    case 'SHORTAGE':
    case 'OFF_DUTY':
      return 'bg-rose-900/15 text-rose-900 border-rose-700/30';
    case 'REVERSED':
    case 'EXCESS':
    case 'CANCELLED':
      return 'bg-[#8E4322]/15 text-[#70411A] border-[#8E4322]/30';
    default:
      return 'bg-[#EFE2CE] text-[#3F3124] border-[#D9C7AB]';
  }
}

export function extractErrorMessage(err: any, fallback = 'Operation failed'): string {
  return err?.response?.data?.message || err?.message || fallback;
}
