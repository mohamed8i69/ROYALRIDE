import { Component, EventEmitter, Input, Output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SiteContentService, FleetCar } from '../../services/site-content.service';
import { OrdersService } from '../../services/orders.service';

export type ServiceType = 'transfer' | 'hourly' | 'tour';
export type PeakSeason = 'normal' | 'hajj_umrah' | 'riyadh_season' | 'alula_season';
export type ScentChoice = 'royal_oud' | 'musk' | 'amber' | 'none';
export type RefreshmentChoice = 'saudi_coffee' | 'sparkling_water' | 'fresh_juices' | 'water';
export type DriverLangChoice = 'ar' | 'en' | 'both';
export type PaymentMethod = 'mada' | 'apple_pay' | 'credit_card' | 'stc_pay' | 'tabby_tamara' | 'corporate_b2b';
import {
  LucideCrown,
  LucideX,
  LucideCarFront,
  LucideClock3,
  LucideMap,
  LucidePlane,
  LucideSparkles,
  LucideFlower2,
  LucideFlame,
  LucideCoffee,
  LucideGlassWater,
  LucideCitrus,
  LucideShieldCheck,
  LucideBadge,
  LucideCreditCard,
  LucideSmartphone,
  LucideShoppingBag,
  LucideBuilding2,
  LucideFileText,
  LucideCheck,
  LucideStar
} from '@lucide/angular';
@Component({
  selector: 'app-booking-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideCrown,
    LucideX,
    LucideCarFront,
    LucideClock3,
    LucideMap,
    LucidePlane,
    LucideSparkles,
    LucideFlower2,
    LucideFlame,
    LucideCoffee,
    LucideGlassWater,
    LucideCitrus,
    LucideShieldCheck,
    LucideBadge,
    LucideCreditCard,
    LucideSmartphone,
    LucideShoppingBag,
    LucideBuilding2,
    LucideFileText,
    LucideCheck,
    LucideStar
  ],
  templateUrl: './booking-modal.html',
})
export class BookingModal {
  private readonly siteContent = inject(SiteContentService);
  private readonly ordersService = inject(OrdersService);

  @Input() set isOpen(value: boolean) {
    this.open.set(value);
  }
  @Input() set initialCarKey(key: string | null) {
    if (key) {
      this.selectedCarKey.set(key);
    }
  }
  @Input() set initialServiceType(type: ServiceType | null) {
    if (type) {
      this.serviceType.set(type);
    }
  }

  @Output() closeModal = new EventEmitter<void>();

  readonly open = signal<boolean>(false);
  readonly currentStep = signal<number>(1); // 1: Route & Date, 2: Fleet & Dynamic Pricing, 3: VIP Comfort, 4: Guest & Payment, 5: Receipt
  readonly isSavingOrder = signal<boolean>(false);
  readonly orderSavedSuccess = signal<boolean>(false);

  // Step 1: Service & Route Details
  readonly serviceType = signal<ServiceType>('transfer');
  readonly selectedCity = signal<string>('جدة');
  readonly pickupLocation = signal<string>('مطار الملك عبد العزيز الدولي (JED)');
  readonly dropoffLocation = signal<string>('فندق برج الساعة - مكة المكرمة');
  readonly selectedHours = signal<number>(12);
  readonly selectedTour = signal<string>('جولة عسير وأبها (12 ساعة)');
  readonly pickupDate = signal<string>(new Date().toISOString().split('T')[0]);
  readonly pickupTime = signal<string>('14:00');
  readonly enableFlightTracking = signal<boolean>(true);
  readonly flightNumber = signal<string>('SV 1020');

  // Step 2: Fleet & Dynamic Pricing
  readonly selectedCarKey = signal<string>('taurus');
  readonly peakSeason = signal<PeakSeason>('normal');

  // Step 3: VIP Personalization & Privacy
  readonly cabinScent = signal<ScentChoice>('royal_oud');
  readonly refreshment = signal<RefreshmentChoice>('saudi_coffee');
  readonly driverLanguage = signal<DriverLangChoice>('ar');
  readonly isDiscreetBooking = signal<boolean>(false);
  readonly welcomePlacardName = signal<string>('سعادة الضيف الكريم');

  // Step 4: Guest Information & Payment
  readonly guestName = signal<string>('');
  readonly guestPhone = signal<string>('');
  readonly specialNotes = signal<string>('');
  readonly paymentMethod = signal<PaymentMethod>('mada');

  // Setters for Template Signal Binding
  setCabinScent(val: ScentChoice): void { this.cabinScent.set(val); }
  setRefreshment(val: RefreshmentChoice): void { this.refreshment.set(val); }
  setDriverLanguage(val: DriverLangChoice): void { this.driverLanguage.set(val); }
  setPaymentMethod(val: PaymentMethod): void { this.paymentMethod.set(val); }
  setPickupLocation(val: string): void { this.pickupLocation.set(val); }
  setDropoffLocation(val: string): void { this.dropoffLocation.set(val); }
  setFlightNumber(val: string): void { this.flightNumber.set(val); }
  setWelcomePlacardName(val: string): void { this.welcomePlacardName.set(val); }
  setGuestName(val: string): void { this.guestName.set(val); }
  setGuestPhone(val: string): void { this.guestPhone.set(val); }
  setSpecialNotes(val: string): void { this.specialNotes.set(val); }
  setIsDiscreetBooking(val: boolean): void { this.isDiscreetBooking.set(val); }
  setEnableFlightTracking(val: boolean): void { this.enableFlightTracking.set(val); }
  setPickupDate(val: string): void { this.pickupDate.set(val); }
  setPickupTime(val: string): void { this.pickupTime.set(val); }
  setSelectedTour(val: string): void { this.selectedTour.set(val); }

  // Computed data
  readonly carsList = computed(() => this.siteContent.content().cars);

  readonly selectedCarObj = computed(() => {
    const list = this.carsList();
    const key = this.selectedCarKey();
    return list.find((c) => c.key === key || c.key === key.replace('transfer-', '')) || list[0];
  });

  // Dynamic Pricing Calculations
  readonly basePrice = computed(() => {
    const car = this.selectedCarObj();
    const type = this.serviceType();

    if (type === 'transfer') {
      const transferItem = this.siteContent.content().transferCars.find((t) => t.key.includes(car.key));
      return transferItem ? parseInt(transferItem.price, 10) || 300 : 300;
    } else if (type === 'tour') {
      if (this.selectedTour().includes('العلا')) return 2800;
      if (this.selectedTour().includes('أبها')) return 1500;
      return 1200;
    } else {
      // Hourly
      const fullDayRate = parseInt(car.price, 10) || 1000;
      const hours = this.selectedHours();
      if (hours === 4) return Math.round(fullDayRate * 0.45);
      if (hours === 8) return Math.round(fullDayRate * 0.75);
      return fullDayRate; // 12 hours
    }
  });

  readonly peakMultiplier = computed(() => {
    switch (this.peakSeason()) {
      case 'hajj_umrah': return 1.25;
      case 'riyadh_season': return 1.20;
      case 'alula_season': return 1.30;
      default: return 1.0;
    }
  });

  readonly surgeAmount = computed(() => {
    const base = this.basePrice();
    const mult = this.peakMultiplier();
    return Math.round(base * (mult - 1));
  });

  readonly subtotal = computed(() => {
    return this.basePrice() + this.surgeAmount();
  });

  readonly vatAmount = computed(() => {
    return Math.round(this.subtotal() * 0.15); // ZATCA 15% VAT
  });

  readonly totalPrice = computed(() => {
    return this.subtotal() + this.vatAmount();
  });

  readonly bookingRef = computed(() => {
    return 'ROYAL-' + Math.floor(100000 + Math.random() * 900000);
  });

  close(): void {
    this.open.set(false);
    this.closeModal.emit();
  }

  setStep(step: number): void {
    if (step >= 1 && step <= 5) {
      this.currentStep.set(step);
    }
  }

  async submitOrder(channel: 'whatsapp' | 'direct' = 'direct'): Promise<void> {
    this.isSavingOrder.set(true);
    const carObj = this.selectedCarObj();
    const payload = {
      bookingRef: this.bookingRef(),
      status: 'pending' as const,
      channel,
      guestName: this.guestName() || 'ضيف كريم',
      guestPhone: this.guestPhone(),
      specialNotes: this.specialNotes(),
      paymentMethod: this.paymentMethod(),
      serviceType: this.serviceType(),
      selectedCity: this.selectedCity(),
      pickupLocation: this.pickupLocation(),
      dropoffLocation: this.serviceType() === 'transfer' ? this.dropoffLocation() : 'حسب الجدول',
      selectedHours: this.selectedHours(),
      selectedTour: this.selectedTour(),
      pickupDate: this.pickupDate(),
      pickupTime: this.pickupTime(),
      enableFlightTracking: this.enableFlightTracking(),
      flightNumber: this.enableFlightTracking() ? this.flightNumber() : '',
      selectedCar: { key: carObj.key, name: carObj.name },
      pricing: {
        basePrice: this.basePrice(),
        surgeAmount: this.surgeAmount(),
        subtotal: this.subtotal(),
        vatAmount: this.vatAmount(),
        totalPrice: this.totalPrice(),
        peakSeason: this.peakSeason(),
      },
      vipPreferences: {
        cabinScent: this.getScentLabel(),
        refreshment: this.getRefreshmentLabel(),
        driverLanguage: this.driverLanguage() === 'ar' ? 'عربي' : 'English',
        isDiscreetBooking: this.isDiscreetBooking(),
        welcomePlacardName: this.welcomePlacardName(),
      },
    };

    await this.ordersService.createOrder(payload);
    this.isSavingOrder.set(false);
    this.orderSavedSuccess.set(true);
  }

  nextStep(): void {
    if (this.currentStep() < 4) {
      this.currentStep.update((s) => s + 1);
    } else if (this.currentStep() === 4) {
      void this.submitOrder('direct');
      this.currentStep.set(5); // Receipt view
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update((s) => s - 1);
    }
  }

  selectCar(key: string): void {
    this.selectedCarKey.set(key);
  }

  onWhatsAppClick(): void {
    void this.submitOrder('whatsapp');
  }

  getWhatsAppBookingUrl(): string {
    const car = this.selectedCarObj().name;
    const typeLabel =
      this.serviceType() === 'transfer'
        ? 'من نقطة إلى نقطة'
        : this.serviceType() === 'hourly'
          ? `بالساعة (${this.selectedHours()} ساعة)`
          : `باقة سياحية (${this.selectedTour()})`;

    const text = `👑 *طلب حجز جديد عبر ROYALRIDE*
----------------------------------------
🔢 *رقم الحجز:* ${this.bookingRef()}
🚘 *المركبة:* ${car}
📍 *نوع الرحلة:* ${typeLabel}
🏙️ *المدينة:* ${this.selectedCity()}
🚩 *مكان الاستلام:* ${this.pickupLocation()}
🏁 *مكان الوصول:* ${this.serviceType() === 'transfer' ? this.dropoffLocation() : 'حسب الجدول'}
📅 *التاريخ والوقت:* ${this.pickupDate()} - ${this.pickupTime()}
✈️ *رقم الرحلة الجوية:* ${this.enableFlightTracking() ? this.flightNumber() : 'غير محدد'}

🌿 *تفاصيل الرفاهية الملكية:*
• المعطر: ${this.getScentLabel()}
• الضيافة: ${this.getRefreshmentLabel()}
• السائق: ${this.driverLanguage() === 'ar' ? 'عربي' : 'English'}
• اسم اللوحة الترحيبية: ${this.welcomePlacardName() || 'بدون'}
• حجز سري VVIP: ${this.isDiscreetBooking() ? 'نعم' : 'لا'}

👤 *بيانات الضيف:*
• الاسم: ${this.guestName() || 'ضيف كريم'}
• الجوال: ${this.guestPhone() || 'غير محدد'}
• طريقة الدفع: ${this.getPaymentLabel()}

💰 *إجمالي التكلفة شامل VAT (15%):* ${this.totalPrice()} ريال
----------------------------------------
يرجى تأكيد الحجز وتعيين السائق.`;

    return `https://wa.me/966569038515?text=${encodeURIComponent(text)}`;
  }

  getScentLabel(): string {
    switch (this.cabinScent()) {
      case 'royal_oud': return 'العود الملكي Luxury Oud';
      case 'musk': return 'المسك الأبيض White Musk';
      case 'amber': return 'العنبر الفاخر Amber';
      default: return 'بدون معطر';
    }
  }

  getRefreshmentLabel(): string {
    switch (this.refreshment()) {
      case 'saudi_coffee': return 'القهوة السعودية والتمور الفاخرة ☕';
      case 'sparkling_water': return 'ماء فوار بارد 🧊';
      case 'fresh_juices': return 'عصائر طازجة 🍊';
      default: return 'مياه معدنية فاخرة 💧';
    }
  }

  getPaymentLabel(): string {
    switch (this.paymentMethod()) {
      case 'mada': return 'مدى Mada';
      case 'apple_pay': return 'Apple Pay';
      case 'credit_card': return 'بطاقة ائتمان (Visa/Mastercard)';
      case 'stc_pay': return 'STC Pay';
      case 'tabby_tamara': return 'تقسيط 4 دفعات (Tabby/Tamara)';
      case 'corporate_b2b': return 'حساب شركاء Corporate B2B';
    }
  }
}
