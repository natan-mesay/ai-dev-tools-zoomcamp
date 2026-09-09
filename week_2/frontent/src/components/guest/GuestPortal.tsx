import confetti from 'canvas-confetti';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  PartyPopper,
  UtensilsCrossed,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { GuestStatusResponse } from '../../types';
import { PartySizeBadge, StatusBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { useToast } from '../common/Toast';

interface GuestPortalProps {
  token: string;
  onBackToHost?: () => void;
}

export const GuestPortal: React.FC<GuestPortalProps> = ({ token, onBackToHost }) => {
  const [guestData, setGuestData] = useState<GuestStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const { showToast } = useToast();

  const loadGuestStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.guest.getStatus(token);
      setGuestData(data);

      if (data.status === 'NOTIFIED') {
        triggerConfetti();
      }
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve your waitlist status.');
    } finally {
      setLoading(false);
    }
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadGuestStatus();

    // Subscribe to real-time events
    const unsubscribe = api.realtime.subscribe('*', () => {
      // Re-fetch whenever waitlist changes or status changes
      api.guest
        .getStatus(token)
        .then((latest) => {
          setGuestData((prev) => {
            if (prev && prev.status === 'WAITING' && latest.status === 'NOTIFIED') {
              showToast('alert', 'Your Table is Ready!', 'Please proceed to the host stand.');
              triggerConfetti();
            }
            return latest;
          });
        })
        .catch(() => {});
    });

    return unsubscribe;
  }, [token]);

  const handleCancelWaitlist = async () => {
    try {
      setIsCancelling(true);
      const updated = await api.guest.cancel(token);
      setGuestData(updated);
      setIsCancelModalOpen(false);
      showToast('info', 'Waitlist Cancelled', 'You have left the waitlist.');
    } catch (err: any) {
      showToast('warning', 'Cancellation Error', err.message || 'Could not cancel waitlist entry');
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading && !guestData) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-600">Loading your live waitlist status...</p>
      </div>
    );
  }

  if (error || !guestData) {
    return (
      <div className="max-w-md mx-auto min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Waitlist Entry Not Found</h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          {error || 'This waitlist tracking link might be expired or invalid.'}
        </p>
        {onBackToHost && (
          <button
            onClick={onBackToHost}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-md hover:bg-slate-800 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Host Dashboard
          </button>
        )}
      </div>
    );
  }

  const isNotified = guestData.status === 'NOTIFIED';
  const isWaiting = guestData.status === 'WAITING';
  const isSeated = guestData.status === 'SEATED';
  const isCancelled = guestData.status === 'CANCELLED';
  const isNoShow = guestData.status === 'NO_SHOW';

  return (
    <div className="min-h-[calc(100vh-60px)] bg-gradient-to-b from-slate-100 to-slate-50 py-6 px-4 flex flex-col justify-between">
      <div className="max-w-md w-full mx-auto space-y-4">
        {/* Navigation & Restaurant Header */}
        <div className="flex items-center justify-between">
          {onBackToHost && (
            <button
              onClick={onBackToHost}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Host View
            </button>
          )}
          <div className="flex items-center gap-1.5 ml-auto text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Real-time Status
          </div>
        </div>

        {/* Restaurant Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto mb-2 shadow-inner">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{guestData.restaurant_name}</h2>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400" />
            452 Downtown Ave, Culinary District
          </p>
        </div>

        {/* --- 1. TABLE READY BANNER (NOTIFIED STATE) --- */}
        {isNotified && (
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-6 shadow-xl shadow-emerald-700/20 text-center animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            <div className="w-14 h-14 rounded-2xl bg-white text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-lg animate-bounce">
              <PartyPopper className="w-7 h-7" />
            </div>
            <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-black uppercase tracking-wider mb-2 backdrop-blur-sm">
              ✨ Table Ready Now!
            </span>
            <h3 className="text-2xl font-black tracking-tight">Your Table is Ready, {guestData.guest_name}!</h3>
            <p className="text-xs text-emerald-100 mt-2 leading-relaxed max-w-xs mx-auto">
              Please proceed immediately to the front host stand. Your party is about to be seated!
            </p>
          </div>
        )}

        {/* --- 2. ACTIVE WAITING STATUS HERO CARD --- */}
        {isWaiting && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm text-center space-y-5">
            <div className="inline-flex items-center gap-2">
              <StatusBadge status="WAITING" size="lg" />
            </div>

            {/* Position In Line */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Position in Line</p>
              <div className="flex items-baseline justify-center gap-1 mt-1">
                <span className="text-6xl font-black text-slate-900 tracking-tight">
                  #{guestData.position}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 mt-1">
                {guestData.position === 1
                  ? "You're next in line! Stay close by."
                  : `${guestData.position - 1} ${guestData.position - 1 === 1 ? 'party' : 'parties'} ahead of you`}
              </p>
            </div>

            {/* Estimated Wait Countdown */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
              <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-1.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Estimated Wait Time
                </span>
                <span className="text-sm font-black">~{guestData.estimated_wait_minutes} mins</span>
              </div>
              {/* Progress visual */}
              <div className="w-full bg-amber-200/60 rounded-full h-2 overflow-hidden mt-2">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all duration-500 animate-pulse"
                  style={{ width: `${Math.max(15, 100 - (guestData.position - 1) * 20)}%` }}
                />
              </div>
              <p className="text-[11px] text-amber-800/80 mt-2 text-left">
                💡 We will notify your phone the second your table is cleared and set.
              </p>
            </div>
          </div>
        )}

        {/* --- 3. SEATED STATE --- */}
        {isSeated && (
          <div className="bg-white rounded-3xl p-6 border border-blue-200 shadow-sm text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">You Are Seated!</h3>
            {guestData.assigned_table_number && (
              <p className="text-sm font-semibold text-blue-700 bg-blue-50 py-1.5 px-3 rounded-xl inline-block border border-blue-100">
                Table {guestData.assigned_table_number}
              </p>
            )}
            <p className="text-xs text-slate-500">
              Enjoy your meal at {guestData.restaurant_name}! Thank you for dining with us.
            </p>
          </div>
        )}

        {/* --- 4. CANCELLED / NO-SHOW STATE --- */}
        {(isCancelled || isNoShow) && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {isCancelled ? 'Waitlist Cancelled' : 'Marked as No-Show'}
            </h3>
            <p className="text-xs text-slate-500">
              This reservation has been removed from the queue. If you wish to join again, please see the host.
            </p>
          </div>
        )}

        {/* Party Details Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-semibold text-slate-500">Party Name</span>
            <span className="font-bold text-slate-900">{guestData.guest_name}</span>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-semibold text-slate-500">Party Size</span>
            <PartySizeBadge size={guestData.party_size} />
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-semibold text-slate-500">Phone Number</span>
            <span className="font-mono text-slate-700">{guestData.phone_number}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-500">Check-In Time</span>
            <span className="text-slate-700">
              {new Date(guestData.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Self-Cancellation Button (Only while active) */}
        {(isWaiting || isNotified) && (
          <div className="pt-2 text-center">
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline transition-colors"
            >
              Plans changed? Leave waitlist
            </button>
          </div>
        )}
      </div>

      {/* Guest Footer */}
      <footer className="text-center text-[11px] text-slate-400 mt-8">
        Powered by <strong className="text-slate-600">MaitreQ</strong> • Restaurant Waitlist Platform
      </footer>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Leave the Waitlist?"
        description="Are you sure you want to cancel your spot in line?"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            By leaving the waitlist, you will lose your spot (Position #{guestData.position}). If you change your mind later, you will need to re-join at the back of the queue.
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Keep My Spot
            </button>
            <button
              type="button"
              disabled={isCancelling}
              onClick={handleCancelWaitlist}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow transition-all disabled:opacity-50"
            >
              {isCancelling ? 'Leaving...' : 'Yes, Leave Waitlist'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
