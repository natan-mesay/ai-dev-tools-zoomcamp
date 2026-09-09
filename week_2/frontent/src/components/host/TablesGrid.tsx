import { CheckCircle, LayoutGrid, Lock, Plus, Users, Utensils } from 'lucide-react';
import React from 'react';
import type { Table, TableStatus } from '../../types';
import { StatusBadge } from '../common/Badge';

interface TablesGridProps {
  tables: Table[];
  onAddTableClick: () => void;
  onUpdateTableStatus: (id: string, status: TableStatus, freeParty?: boolean) => Promise<void>;
}

export const TablesGrid: React.FC<TablesGridProps> = ({
  tables,
  onAddTableClick,
  onUpdateTableStatus,
}) => {
  const availableCount = tables.filter((t) => t.status === 'AVAILABLE').length;
  const occupiedCount = tables.filter((t) => t.status === 'OCCUPIED').length;
  const reservedCount = tables.filter((t) => t.status === 'RESERVED').length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Dining Floor & Tables</h3>
            <p className="text-[11px] text-slate-500">
              {availableCount} free • {occupiedCount} occupied • {reservedCount} reserved
            </p>
          </div>
        </div>

        <button
          onClick={onAddTableClick}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Table</span>
        </button>
      </div>

      {/* Grid List */}
      <div className="p-3.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2.5 overflow-y-auto max-h-[580px]">
        {tables.map((tbl) => {
          const isOccupied = tbl.status === 'OCCUPIED';
          const isAvailable = tbl.status === 'AVAILABLE';

          const cardBorder = isAvailable
            ? 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-300'
            : isOccupied
            ? 'border-purple-200 bg-purple-50/20 hover:border-purple-300'
            : 'border-sky-200 bg-sky-50/20 hover:border-sky-300';

          return (
            <div
              key={tbl.id}
              className={`p-3 rounded-xl border flex flex-col justify-between transition-all group ${cardBorder}`}
            >
              <div>
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <span className="font-black text-slate-900 text-sm tracking-tight">{tbl.table_number}</span>
                  <StatusBadge status={tbl.status} size="sm" />
                </div>

                <div className="flex items-center gap-1 text-slate-500 text-xs font-medium">
                  <Users className="w-3 h-3 text-slate-400" />
                  <span>Seats {tbl.capacity}</span>
                </div>

                {tbl.current_guest_name && (
                  <div className="mt-2 p-1.5 rounded-lg bg-purple-100/70 border border-purple-200 text-purple-900 text-[11px] font-semibold flex items-center gap-1 truncate">
                    <Utensils className="w-3 h-3 text-purple-600 shrink-0" />
                    <span className="truncate">{tbl.current_guest_name}</span>
                  </div>
                )}
              </div>

              {/* Quick Status Actions */}
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
                {isOccupied ? (
                  <button
                    onClick={() => onUpdateTableStatus(tbl.id, 'AVAILABLE', true)}
                    className="w-full py-1 px-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center gap-1 transition-colors"
                    title="Mark table free and clean"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Free Table
                  </button>
                ) : isAvailable ? (
                  <div className="flex items-center gap-1 w-full">
                    <button
                      onClick={() => onUpdateTableStatus(tbl.id, 'OCCUPIED')}
                      className="flex-1 py-1 px-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors truncate"
                      title="Mark occupied directly"
                    >
                      Occupy
                    </button>
                    <button
                      onClick={() => onUpdateTableStatus(tbl.id, 'RESERVED')}
                      className="p-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-700 transition-colors"
                      title="Reserve table"
                    >
                      <Lock className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onUpdateTableStatus(tbl.id, 'AVAILABLE')}
                    className="w-full py-1 px-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold transition-colors"
                  >
                    Set Available
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
