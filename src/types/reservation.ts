
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
  // Nuovi campi per tavoli e sale
  assigned_table_id?: string;
  assigned_room_id?: string;
}

export interface ReservationKPIs {
  totalReservations: number;
  totalGuests: number;
  newReservations: number;
  approvedReservations: number;
  averageScore: number;
}

// Nuovi tipi per tavoli e sale
export interface RestaurantTable {
  id: string;
  restaurant_id: string;
  name: string;
  seats: number;
  description?: string;
  room_id?: string;
  external_id: string;
  external_room_id?: string;
  id_sales_point?: string;
  raw_data?: any;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RestaurantRoom {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  external_id: string;
  id_sales_point?: string;
  raw_data?: any;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TableAvailability {
  table_id: string;
  table_name: string;
  seats: number;
  room_name?: string;
  is_available: boolean;
  current_reservation_id?: string;
}
