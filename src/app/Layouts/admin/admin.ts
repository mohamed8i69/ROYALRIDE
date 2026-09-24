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
    LucideBuilding2,
    LucideRefreshCw,
    LucideSearch,
    LucidePhone,
    LucideX,
    LucideSparkles,
    LucideTrash2,
  ],
  selector: 'app-admin',
  templateUrl: './admin.html',
})
export class Admin implements OnInit {
  private readonly siteContent = inject(SiteContentService);
  private readonly auth = inject(AdminAuthService);
  readonly ordersService = inject(OrdersService);

  readonly activePanel = signal<'overview' | 'orders' | 'content' | 'fleet' | 'transfer' | 'riyadh' | 'layout'>('overview');
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
    const initial = structuredClone(this.siteContent.content());
    this.ensureImagesOnDraft(initial);
    this.draft = signal<SiteContent>(initial);
  }

  private ensureImagesOnDraft(content: SiteContent): SiteContent {
    const ensure = (cars?: { image: string; images?: string[] }[]) => {
      cars?.forEach((car) => {
        if (!car.images || car.images.length === 0) {
          car.images = car.image ? [car.image] : [];
        }
      });
    };
    ensure(content.cars);
    ensure(content.transferCars);
    ensure(content.riyadhCars);
    ensure(content.riyadhTransferCars);
    if (!content.riyadhCars?.length) content.riyadhCars = [];
    if (!content.riyadhTransferCars?.length) content.riyadhTransferCars = [];
    if (!content.toursFeatures) content.toursFeatures = [];
    return content;
  }

  /** Silently swallows broken image loads by hiding the img element */
  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  private syncCarGallery(cars?: { image: string; images?: string[] }[]): void {
    cars?.forEach((car) => {
      if (car.images && car.images.length > 0) {
        car.image = car.images[0];
      } else if (car.image) {
        car.images = [car.image];
      }
    });
  }

  addImageToCar(carKey: string, section: 'cars' | 'transferCars' | 'riyadhCars' | 'riyadhTransferCars'): void {
    this.draft.update(d => {
      const cloned = structuredClone(d);
      const car = cloned[section].find(c => c.key === carKey);
      if (!car) return cloned;
      if (!car.images || car.images.length === 0) {
        car.images = car.image ? [car.image] : [];
      }
      car.images = [...car.images, ''];
      return cloned;
    });
  }

  /** Set exact gallery size for a car (adds empty slots or trims from the end). Min 1. */
  setImageCount(carKey: string, section: 'cars' | 'transferCars' | 'riyadhCars' | 'riyadhTransferCars', count: number): void {
    const target = Math.max(1, Math.min(20, Math.floor(Number(count) || 1)));
    this.draft.update(d => {
      const cloned = structuredClone(d);
      const car = cloned[section].find(c => c.key === carKey);
      if (!car) return cloned;
      let imgs = Array.isArray(car.images) && car.images.length > 0
        ? [...car.images]
        : car.image ? [car.image] : [''];
      if (imgs.length < target) {
        imgs = [...imgs, ...Array(target - imgs.length).fill('')];
      } else if (imgs.length > target) {
        imgs = imgs.slice(0, target);
      }
      car.images = imgs;
      if (imgs[0]) car.image = imgs[0];
      return cloned;
    });
  }

  onImageCountInput(carKey: string, section: 'cars' | 'transferCars' | 'riyadhCars' | 'riyadhTransferCars', event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.setImageCount(carKey, section, value);
  }

  removeImageFromCar(carKey: string, section: 'cars' | 'transferCars' | 'riyadhCars' | 'riyadhTransferCars', index: number): void {
    this.draft.update(d => {
      const cloned = structuredClone(d);
      const car = cloned[section].find(c => c.key === carKey);
      if (!car || !car.images) return cloned;
      if (car.images.length <= 1) {
        car.images = [''];
        car.image = '';
        return cloned;
      }
      car.images = car.images.filter((_, i) => i !== index);
      if (car.images.length > 0) {
        car.image = car.images[0];
      }
      return cloned;
    });
  }

  updateImageUrl(carKey: string, section: 'cars' | 'transferCars' | 'riyadhCars' | 'riyadhTransferCars', index: number, newUrl: string): void {
    this.draft.update(d => {
      const cloned = structuredClone(d);
      const car = cloned[section].find(c => c.key === carKey);
      if (!car || !car.images) return cloned;
      const imgs = [...car.images];
      imgs[index] = newUrl;
      car.images = imgs;
      if (index === 0) {
        car.image = newUrl;
      }
      return cloned;
    });
  }

  updateToursFeature(index: number, value: string): void {
    this.draft.update(d => {
      const cloned = structuredClone(d);
      const list = [...(cloned.toursFeatures || [])];
      list[index] = value;
      cloned.toursFeatures = list;
      return cloned;
    });
  }

  addToursFeature(): void {
    this.draft.update(d => {
      const cloned = structuredClone(d);
      cloned.toursFeatures = [...(cloned.toursFeatures || []), ''];
      return cloned;
    });
  }

  removeToursFeature(index: number): void {
    this.draft.update(d => {
      const cloned = structuredClone(d);
      cloned.toursFeatures = (cloned.toursFeatures || []).filter((_, i) => i !== index);
      return cloned;
    });
  }

  async ngOnInit(): Promise<void> {
    const latest = await this.siteContent.reload();
    const cloned = structuredClone(latest);
    this.ensureImagesOnDraft(cloned);
    this.draft.set(cloned);
    void this.ordersService.loadOrders();
  }

  async refreshContent(): Promise<void> {
    this.isRefreshing.set(true);
    try {
      const latest = await this.siteContent.reload();
      const cloned = structuredClone(latest);
      this.ensureImagesOnDraft(cloned);
      this.draft.set(cloned);
    } finally {
      this.isRefreshing.set(false);
    }
  }

  setPanel(panel: 'overview' | 'orders' | 'content' | 'fleet' | 'transfer' | 'riyadh' | 'layout'): void {
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
      const currentDraft = this.draft();
      this.syncCarGallery(currentDraft.cars);
      this.syncCarGallery(currentDraft.transferCars);
      this.syncCarGallery(currentDraft.riyadhCars);
      this.syncCarGallery(currentDraft.riyadhTransferCars);
      await this.siteContent.save(currentDraft);
      const latest = structuredClone(this.siteContent.content());
      this.ensureImagesOnDraft(latest);
      this.draft.set(latest);
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
      const latest = structuredClone(this.siteContent.content());
      this.ensureImagesOnDraft(latest);
      this.draft.set(latest);
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
      cities: 'خدمات المدن (جدة ومكة + الرياض)',
      tours: 'مدينة أبها — الجولات السياحية',
      contact: 'الاستشارات والتواصل المباشر (الواتساب والهاتف)',
    };
    return labels[id] ?? id;
  }

  getSectionIcon(id: string): string {
    const icons: Record<string, string> = {
      hero: '🏠',
      cities: '🏙️',
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
