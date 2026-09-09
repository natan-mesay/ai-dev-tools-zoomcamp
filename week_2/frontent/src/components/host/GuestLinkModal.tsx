import { Check, Copy, ExternalLink, QrCode, Smartphone } from 'lucide-react';
import React, { useState } from 'react';
import type { WaitlistEntry } from '../../types';
import { Modal } from '../common/Modal';

interface GuestLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  party: WaitlistEntry | null;
}

export const GuestLinkModal: React.FC<GuestLinkModalProps> = ({
  isOpen,
  onClose,
  party,
}) => {
  const [copied, setCopied] = useState(false);

  if (!party) return null;

  const url = `${window.location.origin}${window.location.pathname}?view=guest&token=${party.public_token}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Guest Live Tracking Link"
      description={`Unique link for ${party.guest_name} (Party of ${party.party_size})`}
      maxWidth="sm"
    >
      <div className="flex flex-col items-center text-center space-y-4">
        {/* QR Code Representation */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-md">
          <div className="w-48 h-48 bg-slate-900 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden group">
            {/* Styled QR graphic simulation */}
            <div className="w-full h-full bg-white p-2 rounded-lg flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="w-10 h-10 border-4 border-slate-900 rounded-md flex items-center justify-center">
                  <div className="w-4 h-4 bg-slate-900 rounded-sm" />
                </div>
                <div className="w-10 h-10 border-4 border-slate-900 rounded-md flex items-center justify-center">
                  <div className="w-4 h-4 bg-slate-900 rounded-sm" />
                </div>
              </div>
              <div className="flex items-center justify-center gap-1.5 my-auto">
                <QrCode className="w-12 h-12 text-slate-800 animate-pulse" />
              </div>
              <div className="flex justify-between items-end">
                <div className="w-10 h-10 border-4 border-slate-900 rounded-md flex items-center justify-center">
                  <div className="w-4 h-4 bg-slate-900 rounded-sm" />
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="w-6 h-1.5 bg-slate-900 rounded-sm" />
                  <div className="w-8 h-1.5 bg-slate-900 rounded-sm" />
                </div>
              </div>
            </div>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 mt-2">Scan with phone camera</p>
        </div>

        {/* Copyable Link Box */}
        <div className="w-full">
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="truncate text-slate-600 font-mono flex-1 text-left select-all px-1">
              {url}
            </span>
            <button
              onClick={handleCopy}
              className={`p-1.5 rounded-lg flex items-center gap-1 font-semibold transition-all ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Open in new window */}
        <div className="w-full flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Close
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Open Status</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
        </div>
      </div>
    </Modal>
  );
};
