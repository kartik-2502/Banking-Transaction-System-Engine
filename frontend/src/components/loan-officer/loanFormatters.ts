export function formatCurrency(amount?: number | null): string {
  const num = Number(amount ?? 0);
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function getLoanBadgeClass(status?: string | null): string {
  switch ((status || '').toUpperCase()) {
    case 'APPROVED':
    case 'DISBURSED':
    case 'PAID':
    case 'VERIFIED':
    case 'RECOMMENDED':
    case 'LOW':
    case 'RESOLVED':
      return 'bg-emerald-900/15 text-emerald-900 border-emerald-700/30';
    case 'PENDING':
    case 'SUBMITTED':
    case 'UNDER_REVIEW':
    case 'DOCUMENT_VERIFICATION':
    case 'CREDIT_ASSESSMENT':
    case 'APPROVAL_PENDING':
    case 'DISBURSEMENT_PENDING':
    case 'DUE':
    case 'UPCOMING':
    case 'PARTIALLY_PAID':
    case 'MEDIUM':
    case 'REQUIRES_ADDITIONAL_REVIEW':
    case 'INITIATED':
    case 'RETURNED_FOR_REVIEW':
      return 'bg-amber-900/15 text-amber-900 border-amber-700/30';
    case 'REJECTED':
    case 'OVERDUE':
    case 'EXPIRED':
    case 'HIGH':
    case 'NOT_RECOMMENDED':
    case 'ESCALATED':
    case 'FAILED':
    case 'CANCELLED':
    case 'NPA_90_PLUS':
      return 'bg-rose-900/15 text-rose-900 border-rose-700/30';
    case 'ADDITIONAL_INFORMATION_REQUIRED':
    case 'RESUBMISSION_REQUIRED':
    case 'WAIVED':
      return 'bg-[#8E4322]/15 text-[#70411A] border-[#8E4322]/30';
    default:
      return 'bg-[#EFE2CE] text-[#3F3124] border-[#D9C7AB]';
  }
}

export function extractErrorMessage(err: any, fallback = 'Operation failed'): string {
  return err?.response?.data?.message || err?.message || fallback;
}
