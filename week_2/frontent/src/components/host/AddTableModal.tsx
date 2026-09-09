import { LayoutGrid, Users } from 'lucide-react';
import React, { useState } from 'react';
import type { CreateTableDTO } from '../../types';
import { Modal } from '../common/Modal';

interface AddTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateTableDTO) => Promise<void>;
}

export const AddTableModal: React.FC<AddTableModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState<number>(4);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setTableNumber('');
    setCapacity(4);
    setError('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) {
      setError('Please provide a table label (e.g. T9, Patio 1, Booth 3)');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSubmit({
        table_number: tableNumber.trim(),
        capacity: Number(capacity),
        status: 'AVAILABLE',
      });
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add table');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Table"
      description="Configure a new dining table for the floor."
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
            {error}
          </div>
        )}

        {/* Table Number */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Table Number / Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              placeholder="e.g. T11, Booth 4, Patio 2"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Seating Capacity <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center gap-2 mb-2">
            {[2, 4, 6, 8].map((num) => (
              <button
                type="button"
                key={num}
                onClick={() => setCapacity(num)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  capacity === num
                    ? 'bg-amber-500 text-slate-950 border-amber-500'
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
              max="24"
              value={capacity}
              onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Adding...' : 'Add Table'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
