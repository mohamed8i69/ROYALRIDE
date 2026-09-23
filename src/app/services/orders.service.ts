import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export type OrderStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface OrderPricing {
  basePrice: number;
  surgeAmount: number;
  subtotal: number;
  vatAmount: number;
  totalPrice: number;
  peakSeason?: string;
}

export interface VipPreferences {
  cabinScent?: string;
  refreshment?: string;
  driverLanguage?: string;
  isDiscreetBooking?: boolean;
  welcomePlacardName?: string;
}

export interface SelectedCarInfo {
  key: string;
  name: string;
}

export interface Order {
  _id?: string;
  bookingRef: string;
  status: OrderStatus;
  channel?: 'whatsapp' | 'direct';
  guestName: string;
  guestPhone: string;
  specialNotes?: string;
  paymentMethod: string;
  serviceType: 'transfer' | 'hourly' | 'tour';
  selectedCity: string;
  pickupLocation: string;
  dropoffLocation?: string;
  selectedHours?: number;
  selectedTour?: string;
  pickupDate: string;
  pickupTime: string;
  enableFlightTracking?: boolean;
  flightNumber?: string;
  selectedCar: SelectedCarInfo;
  pricing: OrderPricing;
  vipPreferences: VipPreferences;
  createdAt?: string;
  updatedAt?: string;
}

const API_BASE = environment.apiUrl || 'https://dashboard-nine-flame-50.vercel.app';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  readonly orders = signal<Order[]>([]);
  readonly loading = signal<boolean>(false);
  readonly submitting = signal<boolean>(false);
  readonly updatingId = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  /**
   * Save a new order directly to MongoDB via Vercel backend API.
   */
  async createOrder(orderData: Partial<Order>): Promise<Order | null> {
    this.submitting.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.http.post<{ ok: boolean; order: Order }>(`${API_BASE}/api/orders`, orderData)
      );

      if (response && response.order) {
        return response.order;
      }
    } catch (err: any) {
      this.error.set(err?.error?.message || err?.message || 'تعذر حفظ الطلب في خادم API.');
      console.error('Backend API order save error:', err);
    } finally {
      this.submitting.set(false);
    }
    return null;
  }

  /**
   * Load all orders directly from MongoDB via Vercel backend API.
   */
  async loadOrders(): Promise<Order[]> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const remoteOrders = await firstValueFrom(this.http.get<Order[]>(`${API_BASE}/api/orders`));
      const sorted = (remoteOrders || []).sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      this.orders.set(sorted);
      return sorted;
    } catch (err: any) {
      this.error.set(err?.error?.message || err?.message || 'تعذر جلب الطلبات من خادم MongoDB API.');
      console.error('Failed to load orders from API:', err);
      this.orders.set([]);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Update the status of an existing order in MongoDB.
   */
  async updateStatus(orderIdOrRef: string, newStatus: OrderStatus): Promise<boolean> {
    this.updatingId.set(orderIdOrRef);
    this.error.set(null);

    try {
      await firstValueFrom(
        this.http.patch<{ ok: boolean }>(`${API_BASE}/api/orders/${orderIdOrRef}/status`, { status: newStatus })
      );

      // Update in-memory signal
      this.orders.update((list) =>
        list.map((o) => (o._id === orderIdOrRef || o.bookingRef === orderIdOrRef ? { ...o, status: newStatus } : o))
      );
      return true;
    } catch (err: any) {
      this.error.set(err?.error?.message || err?.message || 'تحديث حالة الطلب فشل.');
      console.error('API order status update failed:', err);
      return false;
    } finally {
      this.updatingId.set(null);
    }
  }

  /**
   * Delete an order from MongoDB.
   */
  async deleteOrder(orderIdOrRef: string): Promise<boolean> {
    this.deletingId.set(orderIdOrRef);
    this.error.set(null);

    try {
      await firstValueFrom(this.http.delete(`${API_BASE}/api/orders/${orderIdOrRef}`));
      this.orders.update((list) => list.filter((o) => o._id !== orderIdOrRef && o.bookingRef !== orderIdOrRef));
      return true;
    } catch (err: any) {
      this.error.set(err?.error?.message || err?.message || 'حذف الطلب فشل.');
      console.error('API order delete failed:', err);
      return false;
    } finally {
      this.deletingId.set(null);
    }
  }
}
