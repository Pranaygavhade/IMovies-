import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  Film,
  Clock,
  ShieldAlert,
  ChevronLeft,
  ArrowRight,
  Info,
  Sparkles,
} from 'lucide-react';
import {
  fetchShowWithSeats,
  toggleSeatSelect,
  clearSelectedSeats,
  lockSelectedSeats,
  updateSeatStatusRealtime,
} from '../redux/slices/bookingSlice';
import { getSocket, joinShowRoom, leaveShowRoom } from '../api/socket';
import { Spinner } from '../components/common/Loader';

const SeatSelection = () => {
  const { id: showId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { currentShow, seats, selectedSeats, totalAmount, lockExpiresAt, loading, lockingLoading } =
    useSelector((state) => state.booking);

  const [timeLeft, setTimeLeft] = useState(null);

  // 1. Fetch Show and Seats on mount
  useEffect(() => {
    dispatch(fetchShowWithSeats(showId));
    dispatch(clearSelectedSeats());

    // Join real-time socket room for this show
    joinShowRoom(showId);

    const socket = getSocket();

    // Socket event listeners
    const handleSeatLocked = (data) => {
      if (data.showId === showId) {
        dispatch(
          updateSeatStatusRealtime({
            seats: data.seats,
            status: 'locked',
            lockedBy: data.lockedBy,
            lockExpiresAt: data.lockExpiresAt,
          })
        );
      }
    };

    const handleSeatReleased = (data) => {
      if (data.showId === showId) {
        dispatch(
          updateSeatStatusRealtime({
            seats: data.seats,
            status: 'available',
          })
        );
      }
    };

    const handleSeatBooked = (data) => {
      if (data.showId === showId) {
        dispatch(
          updateSeatStatusRealtime({
            seats: data.seats,
            status: 'booked',
          })
        );
      }
    };

    socket.on('seat-locked', handleSeatLocked);
    socket.on('seat-released', handleSeatReleased);
    socket.on('seat-booked', handleSeatBooked);

    return () => {
      leaveShowRoom(showId);
      socket.off('seat-locked', handleSeatLocked);
      socket.off('seat-released', handleSeatReleased);
      socket.off('seat-booked', handleSeatBooked);
    };
  }, [dispatch, showId]);

  // 2. Countdown Timer for active seat lock
  useEffect(() => {
    if (!lockExpiresAt) {
      setTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const remainingMs = new Date(lockExpiresAt).getTime() - new Date().getTime();
      if (remainingMs <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
        toast.warn('Your seat lock reservation has expired. Please select seats again.');
        dispatch(fetchShowWithSeats(showId));
        dispatch(clearSelectedSeats());
      } else {
        setTimeLeft(Math.floor(remainingMs / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockExpiresAt, dispatch, showId]);

  // Group seats by Row
  const rowsMap = useMemo(() => {
    const map = {};
    (seats || []).forEach((seat) => {
      if (!map[seat.row]) {
        map[seat.row] = {
          row: seat.row,
          category: seat.category,
          price: seat.price,
          seats: [],
        };
      }
      map[seat.row].seats.push(seat);
    });

    // Sort seats in each row by seat number
    Object.values(map).forEach((r) => {
      r.seats.sort((a, b) => {
        const numA = parseInt(a.seatNumber.replace(/\D/g, ''), 10);
        const numB = parseInt(b.seatNumber.replace(/\D/g, ''), 10);
        return numA - numB;
      });
    });

    // Return rows in alphabetical order (A, B, C...)
    return Object.keys(map)
      .sort()
      .map((k) => map[k]);
  }, [seats]);

  const handleSeatClick = (seat) => {
    if (seat.status === 'booked') {
      toast.info(`Seat ${seat.seatNumber} is already booked.`);
      return;
    }

    // If locked by another user
    const now = new Date();
    if (
      seat.status === 'locked' &&
      seat.lockExpiresAt &&
      new Date(seat.lockExpiresAt) > now &&
      seat.lockedBy &&
      seat.lockedBy !== user?.id
    ) {
      toast.warn(`Seat ${seat.seatNumber} is temporarily held by another guest.`);
      return;
    }

    const isSelected = selectedSeats.some((s) => s._id === seat._id);
    if (!isSelected && selectedSeats.length >= 8) {
      toast.info('Maximum 8 seats allowed per booking.');
      return;
    }

    dispatch(toggleSeatSelect(seat));
  };

  const handleProceedToPayment = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to proceed with booking.');
      navigate('/login', { state: { from: `/shows/${showId}/seats` } });
      return;
    }

    if (selectedSeats.length === 0) {
      toast.warning('Please select at least one seat to proceed.');
      return;
    }

    try {
      const seatNumbers = selectedSeats.map((s) => s.seatNumber);
      const res = await dispatch(lockSelectedSeats({ showId, seatNumbers })).unwrap();
      toast.success('Seats reserved for 5 minutes! Proceeding to checkout...');
      navigate('/payment', {
        state: {
          showId,
          show: currentShow,
          selectedSeats,
          totalAmount,
          lockExpiresAt: res.lockExpiresAt,
        },
      });
    } catch (err) {
      toast.error(err || 'Failed to lock selected seats. They may have just been taken.');
      dispatch(fetchShowWithSeats(showId));
    }
  };

  if (loading || !currentShow) {
    return <Spinner text="Loading interactive auditorium seating layout..." />;
  }

  const formatTimer = (seconds) => {
    if (seconds === null) return null;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="seat-selection-page container py-4">
      {/* 1. Header Bar */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-3 border-bottom border-secondary border-opacity-25">
        <div>
          <Link
            to={`/movies/${currentShow.movie._id}`}
            className="text-muted text-decoration-none small d-flex align-items-center gap-1 mb-1 hover-white"
          >
            <ChevronLeft size={16} /> Back to Movie
          </Link>
          <h2 className="font-heading text-white fs-3 mb-1">{currentShow.movie.title}</h2>
          <div className="text-muted small d-flex flex-wrap align-items-center gap-2">
            <span className="text-danger fw-semibold">{currentShow.theatre.name}</span>
            <span>•</span>
            <span>{currentShow.screen}</span>
            <span>•</span>
            <span className="text-white fw-bold">{currentShow.startTime}</span>
            <span>•</span>
            <span>{currentShow.date}</span>
            <span>•</span>
            <span className="badge bg-secondary">{currentShow.format}</span>
          </div>
        </div>

        {/* Lock Timer Display (if seats currently locked) */}
        {timeLeft !== null && (
          <div
            className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 border border-warning"
            style={{ backgroundColor: 'rgba(217, 119, 6, 0.15)' }}
          >
            <Clock size={18} className="text-warning animate-pulse" />
            <div>
              <div className="text-warning small fw-bold">RESERVATION TIMER</div>
              <div className="fs-5 fw-bold text-white font-monospace">{formatTimer(timeLeft)}</div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Interactive Seating Chart */}
      <div className="glass-panel p-3 p-md-5 mb-4 position-relative overflow-x-auto">
        {/* Cinema Curved Screen */}
        <div className="cinema-screen-wrap">
          <div className="cinema-screen"></div>
          <div className="screen-text">ALL EYES THIS WAY • SCREEN</div>
        </div>

        {/* Rows of Seats */}
        <div className="d-flex flex-column align-items-center gap-3 my-4" style={{ minWidth: '480px' }}>
          {rowsMap.map((rowConfig) => {
            const isRecliner = rowConfig.category === 'Recliner';
            const isPremium = rowConfig.category === 'Premium';

            return (
              <div key={rowConfig.row} className="d-flex align-items-center justify-content-center w-100">
                {/* Row Letter label */}
                <span className="text-muted fw-bold me-3 text-center" style={{ width: '24px' }}>
                  {rowConfig.row}
                </span>

                {/* Seats Container with middle aisle gap */}
                <div className="d-flex align-items-center">
                  {rowConfig.seats.map((seat, idx) => {
                    const isSelected = selectedSeats.some((s) => s._id === seat._id);
                    const isBooked = seat.status === 'booked';
                    const isLocked = seat.status === 'locked' && !isSelected;

                    let seatClass = 'seat-available';
                    if (isSelected) seatClass = 'seat-selected';
                    else if (isBooked) seatClass = 'seat-booked';
                    else if (isLocked) seatClass = 'seat-locked';

                    const categoryBorder = isRecliner
                      ? 'cat-recliner'
                      : isPremium
                      ? 'cat-premium'
                      : 'cat-regular';

                    // Insert middle aisle gap at half the row
                    const isMiddle = idx === Math.floor(rowConfig.seats.length / 2);

                    return (
                      <React.Fragment key={seat._id}>
                        {isMiddle && <div style={{ width: '32px' }} />}
                        <button
                          type="button"
                          className={`seat-btn ${seatClass} ${categoryBorder}`}
                          onClick={() => handleSeatClick(seat)}
                          disabled={isBooked || isLocked}
                          title={`${seat.seatNumber} (${seat.category}) - $${seat.price}`}
                        >
                          {seat.seatNumber.replace(/\D/g, '')}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Row Price label */}
                <span className="text-muted small ms-3 text-nowrap" style={{ width: '60px', fontSize: '0.75rem' }}>
                  ${rowConfig.price}
                </span>
              </div>
            );
          })}
        </div>

        {/* 3. Seat Legend */}
        <div className="d-flex flex-wrap justify-content-center align-items-center gap-4 mt-5 pt-3 border-top border-secondary border-opacity-25 small">
          <div className="d-flex align-items-center gap-2">
            <span className="seat-btn seat-available m-0" style={{ width: '22px', height: '22px' }}></span>
            <span className="text-muted">Available</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="seat-btn seat-selected m-0" style={{ width: '22px', height: '22px' }}></span>
            <span className="text-muted">Selected</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="seat-btn seat-booked m-0" style={{ width: '22px', height: '22px' }}></span>
            <span className="text-muted">Booked</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="seat-btn seat-locked m-0" style={{ width: '22px', height: '22px' }}></span>
            <span className="text-muted">Locked (in checkout)</span>
          </div>
          <div className="vr bg-secondary d-none d-md-block opacity-50"></div>
          <div className="d-flex align-items-center gap-2">
            <span className="border-bottom border-2 border-warning pe-1">Gold</span>
            <span className="text-muted">Recliner</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="border-bottom border-2 border-primary pe-1">Indigo</span>
            <span className="text-muted">Premium</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="border-bottom border-2 border-success pe-1">Green</span>
            <span className="text-muted">Regular</span>
          </div>
        </div>
      </div>

      {/* 4. Running Price Summary & Checkout Action Footer */}
      <div className="glass-panel p-4 position-sticky bottom-0 start-0 w-100 shadow-lg" style={{ zIndex: 100 }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="text-muted small text-uppercase fw-semibold mb-1">
              Selected Seats ({selectedSeats.length}/8):
            </div>
            {selectedSeats.length === 0 ? (
              <span className="text-white-50 fst-italic small">No seats selected yet. Click on available seats above.</span>
            ) : (
              <div className="d-flex flex-wrap gap-1">
                {selectedSeats.map((s) => (
                  <span
                    key={s._id}
                    className="badge bg-danger text-white px-2 py-1"
                    style={{ fontSize: '0.8rem' }}
                  >
                    {s.seatNumber} (${s.price})
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="d-flex align-items-center gap-4 justify-content-between justify-content-md-end">
            <div className="text-end">
              <div className="text-muted small text-uppercase">Total Amount</div>
              <div className="fs-3 fw-bold text-white font-heading">${totalAmount.toFixed(2)}</div>
            </div>

            <button
              className="btn btn-cinema d-flex align-items-center gap-2 px-4 py-2"
              disabled={selectedSeats.length === 0 || lockingLoading}
              onClick={handleProceedToPayment}
            >
              {lockingLoading ? (
                <span>Locking Seats...</span>
              ) : (
                <>
                  <span className="fw-bold">Lock Seats & Pay</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelection;

