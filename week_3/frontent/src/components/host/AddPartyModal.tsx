import { Clock, MessageSquare, Phone, User, Users } from 'lucide-react';
import React, { useState } from 'react';
import type { CreateWaitlistDTO } from '../../types';
import { Modal } from '../common/Modal';

interface AddPartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateWaitlistDTO) => Promise<void>;
  suggestedWaitMinutes: number;
}

export const AddPartyModal: React.FC<AddPartyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  suggestedWaitMinutes,
}) => {
  const [guestName, setGuestName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [partySize, setPartySize] = useState<number>(2);
  const [notes, setNotes] = useState('');
  const [customWait, setCustomWait] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setGuestName('');
    setPhoneNumber('');
    setPartySize(2);
    setNotes('');
    setCustomWait('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setError('Please enter guest name');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('Please enter contact phone number');
      return;
    }
    if (partySize < 1) {
      setError('Party size must be at least 1');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSubmit({
        guest_name: guestName.trim(),
        phone_number: phoneNumber.trim(),
        party_size: Number(partySize),
        notes: notes.trim() || undefined,
        estimated_wait_minutes: customWait ? Number(customWait) : suggestedWaitMinutes,
      });
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add party to waitlist');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Party to Waitlist"
      description="Register a walk-in guest party into the live queue."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
            {error}
          </div>
        )}

        {/* Guest Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Guest Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              placeholder="e.g. Jessica Miller"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Phone Number <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Phone className="w-4 h-4" />
            </div>
            <input
              type="tel"
              required
              placeholder="e.g. +1 (555) 019-2834"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Used for live SMS / status link notifications.</p>
        </div>

        {/* Party Size & Quick Buttons */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Party Size <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3, 4, 5, 6, 8].map((num) => (
              <button
                type="button"
                key={num}
                onClick={() => setPartySize(num)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  partySize === num
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Users className="w-4 h-4" />
            </div>
            <input
              type="number"
              min="1"
              max="30"
              value={partySize}
              onChange={(e) => setPartySize(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>
        </div>

        {/* Estimated Wait Override */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Estimated Wait (Minutes)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Clock className="w-4 h-4" />
            </div>
            <input
              type="number"
              min="0"
              placeholder={`Suggested: ~${suggestedWaitMinutes} mins`}
              value={customWait}
              onChange={(e) => setCustomWait(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>
        </div>

        {/* Special Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Special Requests / Notes
          </label>
          <div className="relative">
            <div className="absolute top-2.5 left-3 pointer-events-none text-slate-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <textarea
              rows={2}
              placeholder="e.g. High chair, birthday celebration, booth preferred..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Adding...' : 'Add to Queue'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
