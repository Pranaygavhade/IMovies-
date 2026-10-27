import React, { useEffect, useState } from 'react';
import { Check, Lock, Clock } from 'lucide-react';
import { IShowSeat, IScreen, SeatCategory } from '../types/index.js';
import { getSocket, joinShowRoom, leaveShowRoom } from '../services/socket.js';

interface SeatMapProps {
  showId: string;
  screen: IScreen;
  seats: IShowSeat[];
  selectedSeatIds: string[];
  onToggleSeat: (seatIdentifier: string, category: SeatCategory, price: number) => void;
  currentUserId?: string;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  showId,
  screen,
  seats: initialSeats,
  selectedSeatIds,
  onToggleSeat,
  currentUserId,
}) => {
  const [seatMap, setSeatMap] = useState<Map<string, IShowSeat>>(new Map());

  // Initialize and sync seatMap whenever initialSeats changes
  useEffect(() => {
    const map = new Map<string, IShowSeat>();
    for (const seat of initialSeats) {
      map.set(seat.seatIdentifier, seat);
    }
    setSeatMap(map);
  }, [initialSeats]);

  // Connect to Socket.IO room for real-time seat synchronization across tabs/users
  useEffect(() => {
    if (!showId) return;

    joinShowRoom(showId);
    const socket = getSocket();

    const handleSeatLocked = (data: { showId: string; seats: string[]; lockedBy: string; lockExpiresAt: string }) => {
      if (data.showId !== showId) return;
      setSeatMap((prev) => {
        const next = new Map(prev);
        for (const seatId of data.seats) {
          const existing = next.get(seatId);
          if (existing) {
            next.set(seatId, {
              ...existing,
              status: 'locked',
              isHeldByMe: currentUserId ? data.lockedBy === currentUserId : false,
              lockExpiresAt: data.lockExpiresAt,
            });
          }
        }
        return next;
      });
    };

    const handleSeatUnlocked = (data: { showId: string; seats: string[] }) => {
      if (data.showId !== showId) return;
      setSeatMap((prev) => {
        const next = new Map(prev);
        for (const seatId of data.seats) {
          const existing = next.get(seatId);
          if (existing && existing.status !== 'booked') {
            next.set(seatId, {
              ...existing,
              status: 'available',
              isHeldByMe: false,
              lockExpiresAt: null,
            });
          }
        }
        return next;
      });
    };

    const handleSeatBooked = (data: { showId: string; seats: string[] }) => {
      if (data.showId !== showId) return;
      setSeatMap((prev) => {
        const next = new Map(prev);
        for (const seatId of data.seats) {
          const existing = next.get(seatId);
          if (existing) {
            next.set(seatId, {
              ...existing,
              status: 'booked',
              isHeldByMe: false,
              lockExpiresAt: null,
            });
          }
        }
        return next;
      });
    };

    socket.on('seat:locked', handleSeatLocked);
    socket.on('seat:unlocked', handleSeatUnlocked);
    socket.on('seat:booked', handleSeatBooked);

    return () => {
      socket.off('seat:locked', handleSeatLocked);
      socket.off('seat:unlocked', handleSeatUnlocked);
      socket.off('seat:booked', handleSeatBooked);
      leaveShowRoom(showId);
    };
  }, [showId, currentUserId]);

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto py-6">
      {/* Screen Graphic at Top */}
      <div className="w-full flex flex-col items-center mb-12">
        <div className="relative w-4/5 h-12 flex items-center justify-center">
          <svg className="w-full h-8" viewBox="0 0 500 40" fill="none">
            <path
              d="M 20 30 Q 250 5 480 30"
              stroke="#E50914"
              strokeWidth="4"
              strokeLinecap="round"
              className="drop-shadow-[0_0_12px_rgba(229,9,20,0.6)]"
            />
          </svg>
          <div className="absolute -bottom-4 text-[11px] font-semibold tracking-widest uppercase text-cinema-400">
            All eyes this way — Screen
          </div>
        </div>
      </div>

      {/* Seating Grid */}
      <div className="w-full overflow-x-auto pb-6">
        <div className="min-w-[600px] flex flex-col items-center space-y-4">
          {(screen?.seatLayout || []).map((row) => (
            <div key={row.rowLabel} className="flex items-center gap-3">
              {/* Row Label (Left) */}
              <span className="w-6 text-center text-xs font-bold text-cinema-400">
                {row.rowLabel}
              </span>

              {/* Seats in this row */}
              <div className="flex items-center gap-2">
                {(row.seats || []).map((seatDef) => {
                  const seatData = seatMap.get(seatDef.seatIdentifier);
                  const status = seatData ? seatData.status : 'available';
                  const isSelected = selectedSeatIds.includes(seatDef.seatIdentifier);
                  const isBooked = status === 'booked';
                  const isLockedByOther =
                    status === 'locked' && !seatData?.isHeldByMe && !isSelected;

                  // Dynamic seat button styles
                  let seatClasses =
                    'relative w-8 h-8 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all duration-200 select-none';

                  if (isBooked) {
                    seatClasses +=
                      ' bg-cinema-800 text-cinema-600 border border-cinema-750/50 cursor-not-allowed';
                  } else if (isLockedByOther) {
                    seatClasses +=
                      ' bg-amber-500/20 text-amber-400 border border-amber-500/40 cursor-not-allowed animate-pulse';
                  } else if (isSelected) {
                    seatClasses +=
                      ' bg-crimson-600 text-white shadow-glow-crimson border border-crimson-400 scale-105';
                  } else {
                    // Available seats by category
                    if (row.category === 'VIP') {
                      seatClasses +=
                        ' bg-cinema-850 hover:bg-amber-500/20 text-cinema-200 hover:text-amber-300 border border-amber-500/30 hover:border-amber-500/70 hover:scale-105 cursor-pointer';
                    } else if (row.category === 'Premium') {
                      seatClasses +=
                        ' bg-cinema-850 hover:bg-sky-500/20 text-cinema-200 hover:text-sky-300 border border-sky-500/30 hover:border-sky-500/70 hover:scale-105 cursor-pointer';
                    } else {
                      seatClasses +=
                        ' bg-cinema-850 hover:bg-cinema-700 text-cinema-200 hover:text-white border border-cinema-750 hover:border-cinema-500 hover:scale-105 cursor-pointer';
                    }
                  }

                  return (
                    <React.Fragment key={seatDef.seatIdentifier}>
                      <button
                        disabled={isBooked || isLockedByOther}
                        onClick={() =>
                          onToggleSeat(
                            seatDef.seatIdentifier,
                            row.category,
                            seatData?.price || 200
                          )
                        }
                        title={`Seat ${seatDef.seatIdentifier} (${row.category}) - ₹${
                          seatData?.price || 200
                        }`}
                        className={seatClasses}
                      >
                        {isBooked ? (
                          <Lock className="w-3 h-3" />
                        ) : isLockedByOther ? (
                          <Clock className="w-3 h-3" />
                        ) : isSelected ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : (
                          seatDef.seatNumber
                        )}
                      </button>

                      {/* Aisle gap if configured */}
                      {seatDef.isAisle && <div className="w-6" />}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Row Label (Right) */}
              <span className="w-6 text-center text-xs font-bold text-cinema-400">
                {row.rowLabel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Legend */}
      <div className="w-full flex flex-wrap items-center justify-center gap-6 mt-8 pt-6 border-t border-cinema-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-cinema-850 border border-cinema-700" />
          <span className="text-cinema-400">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-crimson-600 border border-crimson-400 shadow-glow-crimson-sm" />
          <span className="text-white font-medium">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500/30 border border-amber-500/50" />
          <span className="text-cinema-400">Reserved / Held</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-cinema-800 border border-cinema-750/50 text-cinema-600 flex items-center justify-center">
            <Lock className="w-2.5 h-2.5" />
          </div>
          <span className="text-cinema-500">Booked</span>
        </div>
        <div className="flex items-center gap-2 border-l border-cinema-800 pl-4">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="text-cinema-300">VIP</span>
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 ml-2" />
          <span className="text-cinema-300">Premium</span>
          <span className="w-2.5 h-2.5 rounded-full bg-cinema-400 ml-2" />
          <span className="text-cinema-300">Standard</span>
        </div>
      </div>
    </div>
  );
};
