
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
  table_id?: string; // Nuovo campo per il tavolo assegnato
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

// Nuovi tipi per tavoli e sale
export interface RestaurantRoom {
  id: string;
  restaurant_id: string;
  external_id: string;
  name: string;
  description?: string;
  id_sales_point?: string;
  created_at: string;
  updated_at: string;
  last_synced_at?: string;
  raw_data?: any;
}

export interface RestaurantTable {
  id: string;
  restaurant_id: string;
  external_id: string;
  name: string;
  description?: string;
  seats?: number;
  room_id?: string;
  external_room_id?: string;
  id_sales_point?: string;
  created_at: string;
  updated_at: string;
  last_synced_at?: string;
  raw_data?: any;
  // Campi aggiuntivi per la visualizzazione
  room_name?: string;
}

export interface TableAvailability {
  table_id: string;
  date: string;
  time_slots: TimeSlotAvailability[];
}

export interface TimeSlotAvailability {
  time: string;
  is_available: boolean;
  reservation_id?: string;
  customer_name?: string;
}
