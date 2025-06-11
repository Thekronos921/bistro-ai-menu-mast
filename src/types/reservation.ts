
export type ReservationStatus = 'nuova' | 'approvata' | 'in_attesa' | 'rifiutata' | 'completata' | 'annullata_cliente' | 'annullata_ristorante';

export interface Reservation {
  id: string;
  restaurant_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  number_of_guests: number;
  reservation_time: string; // ISO 8601 format
  booking_type?: string;
  dish_id?: string;
  customer_notes?: string;
  internal_notes?: string;
  status: ReservationStatus;
  calculated_score: number;
  social_score: number;
  final_score: number;
  created_at: string;
  updated_at: string;
}

export interface ReservationKPIs {
  totalReservations: number;
  totalGuests: number;
  newReservations: number;
  approvedReservations: number;
  averageScore: number;
}
