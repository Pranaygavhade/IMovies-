export type SeatCategory = 'Standard' | 'Premium' | 'VIP';
export type SeatStatus = 'available' | 'locked' | 'booked' | 'unavailable';

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  phone?: string;
  favorites?: string[];
}

export interface IMovie {
  _id: string;
  tmdbId: number;
  title: string;
  originalTitle?: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  runtime: number;
  genres: string[];
  originalLanguage: string;
  spokenLanguages: string[];
  voteAverage: number;
  voteCount: number;
  trailerYoutubeKey?: string;
  status: 'now_showing' | 'upcoming' | 'archived';
  isFeatured: boolean;
  isActive: boolean;
}

export interface ICinema {
  _id: string;
  name: string;
  slug: string;
  address: string;
  locality: string;
  city: string;
  state?: string;
  postalCode?: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  phone?: string;
  email?: string;
  amenities: string[];
  distance?: number; // In km if computed
  isActive: boolean;
}

export interface ISeatDefinition {
  seatNumber: number;
  seatIdentifier: string;
  category: SeatCategory;
  isAisle?: boolean;
  isDisabled?: boolean;
}

export interface IRowDefinition {
  rowLabel: string;
  category: SeatCategory;
  seats: ISeatDefinition[];
}

export interface IScreen {
  _id: string;
  cinemaId: string;
  name: string;
  screenType: 'Standard' | 'IMAX' | '4DX' | 'Dolby Atmos' | 'Laser 4K';
  seatLayout: IRowDefinition[];
  totalSeats: number;
  isActive: boolean;
}

export interface ICategoryPricing {
  Standard: number;
  Premium: number;
  VIP: number;
  [key: string]: number;
}

export interface IShow {
  _id: string;
  movieId: IMovie | string;
  cinemaId: ICinema | string;
  screenId: IScreen | string;
  startTime: string;
  endTime: string;
  date: string;
  language: string;
  format: '2D' | '3D' | 'IMAX 2D' | 'IMAX 3D' | '4DX';
  pricing: ICategoryPricing;
  convenienceFee: number;
  taxPercentage: number;
  bookingCutoffTime: string;
  status: 'scheduled' | 'running' | 'completed' | 'cancelled';
  isActive: boolean;
}

export interface IShowSeat {
  id: string;
  seatIdentifier: string;
  row: string;
  number: number;
  category: SeatCategory;
  price: number;
  status: SeatStatus;
  isHeldByMe?: boolean;
  lockExpiresAt?: string | null;
}

export interface IBookedSeat {
  seatIdentifier: string;
  row: string;
  number: number;
  category: SeatCategory;
  price: number;
}

export interface IBooking {
  _id: string;
  bookingReference: string;
  userId: string | IUser;
  showId: IShow;
  movieId: IMovie;
  cinemaId: ICinema;
  screenId: IScreen;
  seats: IBookedSeat[];
  ticketCount: number;
  subtotal: number;
  convenienceFee: number;
  taxes: number;
  totalAmount: number;
  status: 'pending' | 'pending_verification' | 'confirmed' | 'paid' | 'cancelled' | 'failed' | 'expired' | 'rejected';
  paymentMethod?: string;
  razorpayPaymentLinkUrl?: string;
  manualPayment?: {
    status: 'pending' | 'approved' | 'rejected';
    utrNumber?: string;
    payerUpiId?: string;
    customerNotes?: string;
    submittedAt?: string;
    verifiedAt?: string;
    rejectionReason?: string;
  };
  paymentId?: string;
  qrCodeDataUrl?: string;
  verificationCode: string;
  expiresAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
}

export interface IReview {
  _id: string;
  movieId: string;
  userId: {
    _id: string;
    name: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}
