import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SiteContent, SiteContentService } from '../../services/site-content.service';
import { AdminAuthService } from '../../services/admin-auth.service';
import { OrdersService, Order, OrderStatus } from '../../services/orders.service';

import {
  LucideLayoutDashboard,
  LucideClipboardList,
  LucideFileText,
  LucideCar,
  LucideTruck,
  LucideRefreshCw,
  LucideSave,
  LucideSearch,
  LucidePhone,
  LucideTrash2,
  LucideX,
  LucideCheck,
  LucideClock,
  LucideCheckCircle2,
  LucideXCircle,
  LucideArrowRight,
  LucideLogOut,
  LucideEye,
  LucideCalendar,
  LucideMapPin,
  LucideShield,
  LucideCreditCard,
  LucideBuilding2,
  LucideShoppingBag,
  LucideSparkles,
  LucideCoffee,
  LucideDroplets,
  LucidePlane,
} from '@lucide/angular';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideLayoutDashboard,
    LucideClipboardList,
    LucideFileText,
    LucideCar,
    LucideTruck,
    LucideRefreshCw,
    LucideSearch,
    LucidePhone,
    LucideX,
    LucideSparkles,

  ],
  selector: 'app-admin',
  templateUrl: './admin.html',
})
export class Admin implements OnInit {
  private readonly siteContent = inject(SiteContentService);
  private readonly auth = inject(AdminAuthService);
  readonly ordersService = inject(OrdersService);

  readonly activePanel = signal<'overview' | 'orders' | 'content' | 'fleet' | 'transfer' | 'layout'>('overview');
  readonly saved = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly draft: ReturnType<typeof signal<SiteContent>>;

  // Orders Management state
  readonly orderFilter = signal<'all' | OrderStatus>('all');
  readonly orderSearch = signal<string>('');
  readonly selectedOrderForModal = signal<Order | null>(null);

  // Computeds for Orders
  readonly filteredOrders = computed(() => {
    const list = this.ordersService.orders();
    const filter = this.orderFilter();
    const search = this.orderSearch().toLowerCase().trim();

    return list.filter((order) => {
      const matchesFilter = filter === 'all' || order.status === filter;
      const matchesSearch =
        !search ||
        (order.bookingRef && order.bookingRef.toLowerCase().includes(search)) ||
        (order.guestName && order.guestName.toLowerCase().includes(search)) ||
        (order.guestPhone && order.guestPhone.includes(search)) ||
        (order.selectedCar && order.selectedCar.name.toLowerCase().includes(search));

      return matchesFilter && matchesSearch;
    });
  });

  readonly totalOrdersCount = computed(() => this.ordersService.orders().length);
  readonly pendingOrdersCount = computed(() => this.ordersService.orders().filter((o) => o.status === 'pending').length);
  readonly confirmedOrdersCount = computed(() => this.ordersService.orders().filter((o) => o.status === 'confirmed').length);
  readonly completedOrdersCount = computed(() => this.ordersService.orders().filter((o) => o.status === 'completed').length);
  readonly totalRevenue = computed(() =>
    this.ordersService.orders().reduce((sum, o) => sum + (o.pricing?.totalPrice || 0), 0)
  );

  readonly isSaving = signal<boolean>(false);
  readonly isResetting = signal<boolean>(false);
  readonly isRefreshing = signal<boolean>(false);

  constructor() {
    this.draft = signal<SiteContent>(structuredClone(this.siteContent.content()));
  }

  async ngOnInit(): Promise<void> {
    const latest = await this.siteContent.reload();
    this.draft.set(structuredClone(latest));
    void this.ordersService.loadOrders();
  }

  async refreshContent(): Promise<void> {
    this.isRefreshing.set(true);
    try {
      const latest = await this.siteContent.reload();
      this.draft.set(structuredClone(latest));
    } finally {
      this.isRefreshing.set(false);
    }
  }

  setPanel(panel: 'overview' | 'orders' | 'content' | 'fleet' | 'transfer' | 'layout'): void {
    this.activePanel.set(panel);
    if (panel === 'orders') {
      void this.ordersService.loadOrders();
    }
  }

  logout(): void {
    this.auth.logout();
  }

  async save(): Promise<void> {
    this.isSaving.set(true);
    this.saveError.set(null);
    try {
      await this.siteContent.save(this.draft());
      this.draft.set(structuredClone(this.siteContent.content()));
      this.saved.set(true);
      window.setTimeout(() => this.saved.set(false), 2500);
    } catch (err: any) {
      this.saveError.set(err?.error?.message || err?.message || 'تعذر حفظ التعديلات. تحقق من تشغيل خادم Dashboard API.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async reset(): Promise<void> {
    this.isResetting.set(true);
    this.saveError.set(null);
    try {
      await this.siteContent.reset();
      this.draft.set(structuredClone(this.siteContent.content()));
    } catch (err: any) {
      this.saveError.set(err?.error?.message || err?.message || 'تعذر إعادة البيانات الافتراضية من الخادم.');
    } finally {
      this.isResetting.set(false);
    }
  }

  async changeOrderStatus(order: Order, newStatus: OrderStatus): Promise<void> {
    const targetId = order._id || order.bookingRef;
    await this.ordersService.updateStatus(targetId, newStatus);
    if (this.selectedOrderForModal()?.bookingRef === order.bookingRef) {
      this.selectedOrderForModal.update((curr) => (curr ? { ...curr, status: newStatus } : null));
    }
  }

  async removeOrder(order: Order): Promise<void> {
    if (confirm(`هل أنت تأكد من حذف طلب الحجز رقم ${order.bookingRef}؟`)) {
      const targetId = order._id || order.bookingRef;
      await this.ordersService.deleteOrder(targetId);
      if (this.selectedOrderForModal()?.bookingRef === order.bookingRef) {
        this.selectedOrderForModal.set(null);
      }
    }
  }

  openOrderDetails(order: Order): void {
    this.selectedOrderForModal.set(order);
  }

  closeOrderModal(): void {
    this.selectedOrderForModal.set(null);
  }

  moveSectionUp(index: number): void {
    if (index === 0) return;
    const order = [...this.draft().sectionOrder];
    [order[index - 1], order[index]] = [order[index], order[index - 1]];
    this.draft.update(d => ({ ...d, sectionOrder: order as typeof d.sectionOrder }));
  }

  moveSectionDown(index: number): void {
    const order = [...this.draft().sectionOrder];
    if (index >= order.length - 1) return;
    [order[index], order[index + 1]] = [order[index + 1], order[index]];
    this.draft.update(d => ({ ...d, sectionOrder: order as typeof d.sectionOrder }));
  }

  getSectionLabel(id: string): string {
    const labels: Record<string, string> = {
      hero: 'القسم الرئيسي (Hero + من نحن)',
      transfer: 'التنقل بين جدة ومكة',
      fleet: 'أسطول التأجير بالساعة / اليوم',
      tours: 'جولات أبها السياحية',
      contact: 'الاستشارات والتواصل المباشر (الواتساب والهاتف)',
    };
    return labels[id] ?? id;
  }

  getSectionIcon(id: string): string {
    const icons: Record<string, string> = {
      hero: '🏠',
      transfer: '🚗',
      fleet: '🚙',
      tours: '🏔️',
      contact: '📞',
    };
    return icons[id] ?? '📄';
  }

  getWhatsAppClientUrl(order: Order): string {
    const cleanPhone = (order.guestPhone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('966')
      ? cleanPhone
      : cleanPhone.startsWith('0')
      ? '966' + cleanPhone.slice(1)
      : '966' + cleanPhone;

    const msg = `مرحباً ${order.guestName || 'عزيزنا الضيف'}، بخصوص حجزك لدى ROYALRIDE رقم ${order.bookingRef}: نحن نتابع طلبكم الآن.`;
    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`;
  }

  getStatusLabel(status: OrderStatus): string {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'confirmed': return 'مؤكد';
      case 'in_progress': return 'قيد التنفيذ';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغى';
      default: return status;
    }
  }

  getStatusBadgeClass(status: OrderStatus): string {
    switch (status) {
      case 'pending': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'confirmed': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'in_progress': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'completed': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/40';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/40';
    }
  }
}
