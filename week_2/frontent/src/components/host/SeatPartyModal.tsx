import { CheckCircle2, LayoutGrid, Users } from 'lucide-react';
import React, { useState } from 'react';
import type { Table, WaitlistEntry } from '../../types';
import { Modal } from '../common/Modal';

interface SeatPartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  party: WaitlistEntry | null;
  tables: Table[];
  onConfirmSeat: (partyId: string, tableId: string) => Promise<void>;
}

export const SeatPartyModal: React.FC<SeatPartyModalProps> = ({
  isOpen,
  onClose,
  party,
  tables,
  onConfirmSeat,
}) => {
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!party) return null;

  const availableTables = tables.filter((t) => t.status === 'AVAILABLE');
  const otherTables = tables.filter((t) => t.status !== 'AVAILABLE');

  const handleSeat = async () => {
    if (!selectedTableId) return;
    try {
      setIsSubmitting(true);
      await onConfirmSeat(party.id, selectedTableId);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Seat Party: ${party.guest_name}`}
      description={`Party size: ${party.party_size} guests • Select an available table`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Table Selector Cards */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Available Tables ({availableTables.length})
          </label>

          {availableTables.length === 0 ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium text-center">
              ⚠️ No tables are currently marked as Available. Free up an occupied table or choose one below.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto p-1">
              {availableTables.map((tbl) => {
                const isExactOrBigger = tbl.capacity >= party.party_size;
                const isSelected = selectedTableId === tbl.id;

                return (
                  <button
                    key={tbl.id}
                    type="button"
                    onClick={() => setSelectedTableId(tbl.id)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{tbl.table_number}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Cap: {tbl.capacity}
                      </span>
                      {isExactOrBigger ? (
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          Fits
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                          Small
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Other Tables (Occupied/Reserved) */}
        {otherTables.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <details className="text-xs">
              <summary className="font-semibold text-slate-500 cursor-pointer hover:text-slate-700">
                View Occupied / Reserved Tables ({otherTables.length})
              </summary>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 max-h-40 overflow-y-auto">
                {otherTables.map((tbl) => (
                  <button
                    key={tbl.id}
                    type="button"
                    onClick={() => setSelectedTableId(tbl.id)}
                    className={`p-2.5 rounded-lg border text-left text-xs opacity-75 hover:opacity-100 transition-all ${
                      selectedTableId === tbl.id
                        ? 'border-amber-500 bg-amber-50/50'
                        : 'border-slate-200 bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-slate-800 flex items-center justify-between">
                      <span>{tbl.table_number}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-500">{tbl.status}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-1">
                      {tbl.current_guest_name ? `Seated: ${tbl.current_guest_name}` : `Cap: ${tbl.capacity}`}
                    </p>
                  </button>
                ))}
              </div>
            </details>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSeat}
            disabled={!selectedTableId || isSubmitting}
            className="px-5 py-2 text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            <LayoutGrid className="w-4 h-4" />
            {isSubmitting ? 'Seating...' : 'Confirm Seating'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
