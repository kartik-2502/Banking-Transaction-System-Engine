import React, { useEffect, useState } from 'react';
import { CheckCircle2, Download, FileCheck2, RefreshCw, Upload, XCircle } from 'lucide-react';
import { loanOfficerApi } from '../../services/api';
import { LoanDocumentItem } from '../../types';
import { extractErrorMessage, formatDateTime, getLoanBadgeClass } from './loanFormatters';

const DOC_TYPES = [
  'AADHAAR_ID_PROOF', 'PAN_CARD', 'ADDRESS_PROOF', 'SALARY_SLIPS', 'INCOME_CERTIFICATE',
  'BANK_STATEMENTS', 'EMPLOYMENT_CERTIFICATE', 'PROPERTY_DOCUMENTS', 'VEHICLE_QUOTATION',
  'EDUCATIONAL_ADMISSION', 'BUSINESS_FINANCIALS', 'OTHER_SUPPORTING',
];

export const LoanDocumentsTab: React.FC<{ initialLoanId?: string }> = ({ initialLoanId }) => {
  const [docs, setDocs] = useState<LoanDocumentItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Upload state
  const [loanId, setLoanId] = useState(initialLoanId || 'LN_SEED_BR1_01');
  const [documentType, setDocumentType] = useState('PAN_CARD');
  const [expiryDate, setExpiryDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const loadDocs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await loanOfficerApi.listDocuments(statusFilter, 0, 25);
      setDocs(res.content || []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load loan document verification register.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Select a file to upload.');
      return;
    }
    setError('');
    setMessage('');
    try {
      const uploaded = await loanOfficerApi.uploadDocument(
        loanId.trim(), documentType, file, expiryDate || undefined, remarks.trim() || undefined
      );
      setMessage(`Document ${uploaded.documentId} uploaded (${uploaded.fileName}).`);
      setFile(null);
      setRemarks('');
      await loadDocs();
    } catch (err) {
      setError(extractErrorMessage(err, 'Document upload failed.'));
    }
  };

  const handleDecision = async (documentId: string, status: string) => {
    let reason: string | undefined;
    if (status === 'REJECTED' || status === 'RESUBMISSION_REQUIRED') {
      reason = window.prompt(`Enter ${status} reason for document ${documentId}:`) || '';
      if (!reason.trim()) return;
    }
    setError('');
    setMessage('');
    try {
      const updated = await loanOfficerApi.verifyDocument(documentId, {
        status,
        remarks: `Marked ${status} by officer`,
        rejectionReason: reason,
      });
      setMessage(`Document ${updated.documentId} status updated to ${updated.verificationStatus}.`);
      await loadDocs();
    } catch (err) {
      setError(extractErrorMessage(err, 'Document verification update rejected.'));
    }
  };

  const handleDownload = async (doc: LoanDocumentItem) => {
    try {
      const blob = await loanOfficerApi.downloadDocumentBlob(doc.documentId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 3000);
    } catch (err) {
      setError(extractErrorMessage(err, 'Authorized download failed.'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1B130D]">Document Verification Center</h2>
        <p className="text-sm text-[#3F3124]">
          Upload encrypted loan supporting proofs, securely download authorized documents, verify authenticity, track expiry dates, or request missing resubmissions.
        </p>
      </div>

      {error && <div className="p-3.5 rounded-xl bg-rose-900/10 border border-rose-700/30 text-sm text-rose-900">{error}</div>}
      {message && <div className="p-3.5 rounded-xl bg-emerald-900/10 border border-emerald-700/30 text-sm text-emerald-900">{message}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <form onSubmit={handleUpload} className="xl:col-span-4 p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3 text-xs">
          <h3 className="text-base font-bold text-[#1B130D] flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#70411A]" /> Upload Loan Document
          </h3>
          <div>
            <label className="block font-semibold mb-1">Loan Application ID</label>
            <input required value={loanId} onChange={(e) => setLoanId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Document Type</label>
            <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
              {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Document File</label>
            <input type="file" required onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-xs" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Expiry Date (Optional)</label>
            <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]" />
          </div>
          <input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Officer verification checklist notes" className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]" />
          <button type="submit" className="w-full py-2.5 rounded-xl bg-[#261D15] text-[#F4ECE0] font-semibold">
            Upload to Secure Repository
          </button>
        </form>

        <div className="xl:col-span-8 p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-[#1B130D] flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#70411A]" /> Verification Queue
            </h3>
            <div className="flex gap-2">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs">
                <option value="ALL">ALL</option>
                <option value="PENDING">PENDING</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                <option value="VERIFIED">VERIFIED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="RESUBMISSION_REQUIRED">RESUBMISSION_REQUIRED</option>
                <option value="EXPIRED">EXPIRED</option>
              </select>
              <button type="button" onClick={loadDocs} className="p-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#E9D9C0] text-[#3F3124]">
                <tr>
                  <th className="py-2.5 px-3">Doc ID / Loan</th>
                  <th className="py-2.5 px-3">Type &amp; File</th>
                  <th className="py-2.5 px-3">Status &amp; Expiry</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2D0B4]">
                {docs.length === 0 ? (
                  <tr><td colSpan={4} className="py-6 text-center text-[#3F3124]">No documents found for selected filter.</td></tr>
                ) : (
                  docs.map((doc) => (
                    <tr key={doc.documentId}>
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold">{doc.documentId}</div>
                        <div className="font-mono text-[11px] text-[#70411A]">{doc.loanId} &bull; {doc.customerName}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold">{doc.documentType}</div>
                        <div className="text-[11px] text-[#3F3124]">{doc.fileName} &bull; {formatDateTime(doc.createdAt)}</div>
                        {doc.rejectionReason && <div className="text-[11px] text-rose-900">Reason: {doc.rejectionReason}</div>}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getLoanBadgeClass(doc.verificationStatus)}`}>
                          {doc.verificationStatus}
                        </span>
                        {doc.expiryDate && (
                          <div className={`text-[11px] mt-1 ${doc.expired ? 'text-rose-800 font-bold' : 'text-[#3F3124]'}`}>
                            Exp: {doc.expiryDate} {doc.expired ? '(EXPIRED)' : ''}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap space-x-1">
                        <button type="button" onClick={() => handleDownload(doc)} className="p-1.5 rounded-lg bg-[#F3E7D4] border border-[#D9C7AB]" title="Authorized Download">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => handleDecision(doc.documentId, 'VERIFIED')} className="px-2 py-1 rounded-lg bg-emerald-800 text-white font-semibold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Verify
                        </button>
                        <button type="button" onClick={() => handleDecision(doc.documentId, 'RESUBMISSION_REQUIRED')} className="px-2 py-1 rounded-lg bg-amber-800 text-white font-semibold">
                          Resubmit
                        </button>
                        <button type="button" onClick={() => handleDecision(doc.documentId, 'REJECTED')} className="px-2 py-1 rounded-lg bg-rose-800 text-white font-semibold inline-flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
