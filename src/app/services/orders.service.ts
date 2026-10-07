import { computed, inject, Service, signal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
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
  transferMode?: 'intercity' | 'jeddah_airport';
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

@Service()
export class OrdersService {
  private readonly http = inject(HttpClient);

  /** Modern Angular httpResource: fetches orders reactively as Signals */
  readonly ordersResource = httpResource<Order[]>(() => `${API_BASE}/api/orders`, {
    defaultValue: [],
    parse: (raw: unknown) => {
      const list = (raw as Order[]) || [];
      return [...list].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    },
  });

  /** Exposed reactive Signals for backward compatibility with existing components */
  readonly orders = computed(() => this.ordersResource.value() ?? []);
  readonly loading = computed(() => this.ordersResource.isLoading());
  readonly submitting = signal<boolean>(false);
  readonly updatingId = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  /** Load/reload all orders reactively */
  async loadOrders(): Promise<Order[]> {
    this.ordersResource.reload();
    return this.orders();
  }

  /**
   * Mutation: Save a new order using HttpClient (POST)
   */
  async createOrder(orderData: Partial<Order>): Promise<Order | null> {
    this.submitting.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.http.post<{ ok: boolean; order: Order }>(`${API_BASE}/api/orders`, orderData)
      );

      if (response && response.order) {
        this.ordersResource.reload();
        return response.order;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تعذر حفظ الطلب في خادم API.';
      this.error.set((err as { error?: { message?: string } })?.error?.message ?? msg);
      console.error('Backend API order save error:', err);
    } finally {
      this.submitting.set(false);
    }
    return null;
  }

  /**
   * Mutation: Update order status using HttpClient (PATCH)
   */
  async updateStatus(orderIdOrRef: string, newStatus: OrderStatus): Promise<boolean> {
    this.updatingId.set(orderIdOrRef);
    this.error.set(null);

    try {
      await firstValueFrom(
        this.http.patch<{ ok: boolean }>(`${API_BASE}/api/orders/${orderIdOrRef}/status`, { status: newStatus })
      );

      this.ordersResource.reload();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تحديث حالة الطلب فشل.';
      this.error.set((err as { error?: { message?: string } })?.error?.message ?? msg);
      console.error('API order status update failed:', err);
      return false;
    } finally {
      this.updatingId.set(null);
    }
  }

  /**
   * Mutation: Delete an order using HttpClient (DELETE)
   */
  async deleteOrder(orderIdOrRef: string): Promise<boolean> {
    this.deletingId.set(orderIdOrRef);
    this.error.set(null);

    try {
      await firstValueFrom(this.http.delete(`${API_BASE}/api/orders/${orderIdOrRef}`));
      this.ordersResource.reload();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حذف الطلب فشل.';
      this.error.set((err as { error?: { message?: string } })?.error?.message ?? msg);
      console.error('API order delete failed:', err);
      return false;
    } finally {
      this.deletingId.set(null);
    }
  }
}
