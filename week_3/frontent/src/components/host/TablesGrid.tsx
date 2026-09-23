import { CheckCircle, LayoutGrid, Lock, Plus, Users, Utensils, Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import type { Table, TableStatus } from '../../types';

interface TablesGridProps {
  tables: Table[];
  onAddTableClick: () => void;
  onUpdateTableStatus: (id: string, status: TableStatus, freeParty?: boolean) => Promise<void>;
  onDropParty?: (partyId: string, tableId: string) => void;
}

export const TablesGrid: React.FC<TablesGridProps> = ({
  tables,
  onAddTableClick,
  onUpdateTableStatus,
  onDropParty,
}) => {
  const [dragOverTableId, setDragOverTableId] = useState<string | null>(null);

  const availableCount = tables.filter((t) => t.status === 'AVAILABLE').length;
  const occupiedCount = tables.filter((t) => t.status === 'OCCUPIED').length;
  const reservedCount = tables.filter((t) => t.status === 'RESERVED').length;

  const handleDragOver = (e: React.DragEvent, table: Table) => {
    e.preventDefault();
    if (table.status === 'AVAILABLE') {
      e.dataTransfer.dropEffect = 'move';
      if (dragOverTableId !== table.id) {
        setDragOverTableId(table.id);
      }
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDragEnter = (e: React.DragEvent, table: Table) => {
    e.preventDefault();
    if (table.status === 'AVAILABLE') {
      setDragOverTableId(table.id);
    }
  };

  const handleDragLeave = (e: React.DragEvent, table: Table) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverTableId === table.id) {
      setDragOverTableId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, table: Table) => {
    e.preventDefault();
    setDragOverTableId(null);

    if (table.status !== 'AVAILABLE') return;

    const partyId = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('partyId');
    if (partyId && onDropParty) {
      onDropParty(partyId, table.id);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500 text-slate-950 shadow-xs">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-base">Dining Floor & Tables</h3>
              <span className="text-[11px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                {tables.length} Total
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {availableCount} Available
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-purple-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                {occupiedCount} Occupied
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-sky-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                {reservedCount} Reserved
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] font-medium text-amber-900">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Drag party from queue to seat</span>
          </div>

          <button
            onClick={onAddTableClick}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Table</span>
          </button>
        </div>
      </div>

      {/* Floor Visual Grid of Square Tables */}
      <div className="p-4 sm:p-5 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 overflow-y-auto max-h-[660px] bg-slate-50/40">
        {tables.map((tbl) => {
          const isOccupied = tbl.status === 'OCCUPIED';
          const isAvailable = tbl.status === 'AVAILABLE';
          const isReserved = tbl.status === 'RESERVED';
          const isDragOver = dragOverTableId === tbl.id;

          // Square Table Appearance & Card Styles
          let statusBadgeBg = 'bg-emerald-100/80 text-emerald-800 border-emerald-300';
          let statusText = 'AVAILABLE';
          let tableSurface = 'bg-white border-emerald-200 shadow-xs hover:border-emerald-300';

          if (isOccupied) {
            statusBadgeBg = 'bg-purple-100/90 text-purple-900 border-purple-300';
            statusText = 'OCCUPIED';
            tableSurface = 'bg-purple-50/30 border-purple-200/90 shadow-xs';
          } else if (isReserved) {
            statusBadgeBg = 'bg-sky-100/90 text-sky-900 border-sky-300';
            statusText = 'RESERVED';
            tableSurface = 'bg-sky-50/30 border-sky-200/90 shadow-xs';
          }

          // Drag over glow styling
          if (isDragOver && isAvailable) {
            tableSurface =
              'bg-emerald-100 border-2 border-emerald-500 ring-4 ring-emerald-400/40 scale-[1.03] shadow-lg animate-pulse';
          }

          return (
            <div
              key={tbl.id}
              onDragOver={(e) => handleDragOver(e, tbl)}
              onDragEnter={(e) => handleDragEnter(e, tbl)}
              onDragLeave={(e) => handleDragLeave(e, tbl)}
              onDrop={(e) => handleDrop(e, tbl)}
              className={`relative aspect-square rounded-2xl border-2 p-3.5 flex flex-col justify-between transition-all duration-200 select-none group ${tableSurface}`}
            >
              {/* Top Banner: Availability Status (top) & Capacity */}
              <div className="flex items-center justify-between gap-1 w-full">
                {/* Availability Badge */}
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-black tracking-wide ${statusBadgeBg}`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isAvailable ? 'bg-emerald-500 animate-pulse' : isOccupied ? 'bg-purple-600' : 'bg-sky-500'
                    }`}
                  />
                  <span>{statusText}</span>
                </div>

                {/* Seat Capacity Badge */}
                <div className="flex items-center gap-1 text-slate-700 bg-white/95 border border-slate-200 px-2 py-0.5 rounded-full text-[11px] font-bold shadow-2xs">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>Seats {tbl.capacity}</span>
                </div>
              </div>

              {/* Central Square Table Visual */}
              <div className="my-auto flex flex-col items-center justify-center text-center py-1">
                {/* Visual Square Table Top */}
                <div
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center border-2 shadow-xs transition-transform duration-150 ${
                    isAvailable
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 group-hover:scale-105'
                      : isOccupied
                      ? 'bg-purple-100 border-purple-300 text-purple-950'
                      : 'bg-sky-100 border-sky-300 text-sky-950'
                  }`}
                >
                  <span className="font-black text-xl sm:text-2xl tracking-tight text-slate-900">
                    {tbl.table_number}
                  </span>
                  {/* Visual Chair Dots representing capacity */}
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: Math.min(tbl.capacity, 6) }).map((_, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${
                          isOccupied ? 'bg-purple-600' : isAvailable ? 'bg-emerald-600' : 'bg-sky-600'
                        }`}
                      />
                    ))}
                    {tbl.capacity > 6 && (
                      <span className="text-[9px] font-black text-slate-500">+{tbl.capacity - 6}</span>
                    )}
                  </div>
                </div>

                {/* Current Seated Guest Details or Drop Zone Prompt */}
                {isOccupied && tbl.current_guest_name ? (
                  <div className="mt-2 w-full px-2.5 py-1 rounded-xl bg-purple-100/90 border border-purple-200/90 text-purple-950 text-xs font-bold flex items-center justify-center gap-1.5 truncate shadow-2xs">
                    <Utensils className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                    <span className="truncate">{tbl.current_guest_name}</span>
                  </div>
                ) : isAvailable && isDragOver ? (
                  <div className="mt-2 px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-[11px] font-black flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Drop to Seat!</span>
                  </div>
                ) : isAvailable ? (
                  <div className="mt-2 text-[11px] text-emerald-700/80 font-semibold">
                    Ready for guests
                  </div>
                ) : (
                  <div className="mt-2 text-[11px] text-sky-700 font-semibold">
                    Reserved
                  </div>
                )}
              </div>

              {/* Bottom Quick Status Actions */}
              <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between gap-1 text-[11px]">
                {isOccupied ? (
                  <button
                    onClick={() => onUpdateTableStatus(tbl.id, 'AVAILABLE', true)}
                    className="w-full py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                    title="Mark table clean and available"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Free Table</span>
                  </button>
                ) : isAvailable ? (
                  <div className="flex items-center gap-1.5 w-full">
                    <button
                      onClick={() => onUpdateTableStatus(tbl.id, 'OCCUPIED')}
                      className="flex-1 py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors truncate text-center cursor-pointer"
                      title="Directly mark occupied"
                    >
                      Occupy
                    </button>
                    <button
                      onClick={() => onUpdateTableStatus(tbl.id, 'RESERVED')}
                      className="p-1 px-2 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-700 transition-colors cursor-pointer"
                      title="Reserve table"
                    >
                      <Lock className="w-3.5 h-3.5 inline" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onUpdateTableStatus(tbl.id, 'AVAILABLE')}
                    className="w-full py-1.5 px-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-extrabold transition-colors text-center cursor-pointer"
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

