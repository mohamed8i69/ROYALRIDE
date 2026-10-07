import { computed, inject, Service, signal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AdminAuthService } from './admin-auth.service';

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

@Service()
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AdminAuthService);

  /**
   * Modern Angular httpResource: fetches orders reactively as Signals.
   * Only triggers when the admin is authenticated. Unauthenticated guests
   * visiting Home receive undefined, preventing unauthorized /api/orders requests.
   */
  readonly ordersResource = httpResource<Order[]>(
    () => (this.auth.isAuthenticated() ? '/api/orders' : undefined),
    {
      defaultValue: [],
      parse: (raw: unknown) => {
        const list = (raw as Order[]) || [];
        return [...list].sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      },
    }
  );

  /** Exposed reactive Signals for backward compatibility with existing components */
  readonly orders = computed(() => this.ordersResource.value() ?? []);
  readonly loading = computed(() => this.ordersResource.isLoading());
  readonly submitting = signal<boolean>(false);
  readonly updatingId = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly error = computed(() => (this.ordersResource.error() ? 'تعذر تحميل الطلبات من الخادم.' : null));

  /** Load/reload all orders reactively (Admin feature) */
  async loadOrders(): Promise<Order[]> {
    if (this.auth.isAuthenticated()) {
      this.ordersResource.reload();
    }
    return this.orders();
  }

  /**
   * Mutation: Save a new order using HttpClient (POST) - Public Guest API
   */
  async createOrder(orderData: Partial<Order>): Promise<Order | null> {
    this.submitting.set(true);

    try {
      const response = await firstValueFrom(
        this.http.post<{ ok: boolean; order: Order }>('/api/orders', orderData)
      );

      if (response && response.order) {
        if (this.auth.isAuthenticated()) {
          this.ordersResource.reload();
        }
        return response.order;
      }
    } catch (err: unknown) {
      console.error('Backend API order save error:', err);
    } finally {
      this.submitting.set(false);
    }
    return null;
  }

  /**
   * Mutation: Update order status using HttpClient (PATCH) - Protected Admin API
   */
  async updateStatus(orderIdOrRef: string, newStatus: OrderStatus): Promise<boolean> {
    this.updatingId.set(orderIdOrRef);

    try {
      await firstValueFrom(
        this.http.patch<{ ok: boolean }>(`/api/orders/${orderIdOrRef}/status`, { status: newStatus })
      );

      this.ordersResource.reload();
      return true;
    } catch (err: unknown) {
      console.error('API order status update failed:', err);
      return false;
    } finally {
      this.updatingId.set(null);
    }
  }

  /**
   * Mutation: Delete an order using HttpClient (DELETE) - Protected Admin API
   */
  async deleteOrder(orderIdOrRef: string): Promise<boolean> {
    this.deletingId.set(orderIdOrRef);

    try {
      await firstValueFrom(this.http.delete(`/api/orders/${orderIdOrRef}`));
      this.ordersResource.reload();
      return true;
    } catch (err: unknown) {
      console.error('API order delete failed:', err);
      return false;
    } finally {
      this.deletingId.set(null);
    }
  }
}

