import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SiteContentService, FleetCar } from '../../services/site-content.service';
import { OrdersService } from '../../services/orders.service';

export type ServiceType = 'transfer' | 'hourly' | 'tour';
export type TransferMode = 'intercity' | 'jeddah_airport';
export type PeakSeason = 'normal' | 'hajj_umrah' | 'riyadh_season' | 'alula_season';
export type PaymentMethod = 'mada' | 'apple_pay' | 'credit_card' | 'stc_pay' | 'tabby_tamara' | 'corporate_b2b';
import {
  LucideX,
  LucideCarFront,
  LucideClock3,
  LucideMap,
  LucidePlane,
  LucideShieldCheck,
  LucideCreditCard,
  LucideSmartphone,
  LucideShoppingBag,
  LucideFileText,
  LucideCheck,
} from '@lucide/angular';
@Component({
  selector: 'app-booking-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideX,
    LucideCarFront,
    LucideClock3,
    LucideMap,
    LucidePlane,
    LucideShieldCheck,
    LucideCreditCard,
    LucideSmartphone,
    LucideShoppingBag,
    LucideFileText,
    LucideCheck,
  ],
  templateUrl: './booking-modal.html',
})
export class BookingModal {
  @ViewChild('bookingScrollArea') private bookingScrollArea?: ElementRef<HTMLElement>;
  @ViewChild('bookingPriceSummary') private bookingPriceSummary?: ElementRef<HTMLElement>;

  private readonly siteContent = inject(SiteContentService);
  private readonly ordersService = inject(OrdersService);

  @Input() set isOpen(value: boolean) {
    this.open.set(value);
    if (value) {
      this.currentStep.set(1);
      this.orderSavedSuccess.set(false);
    }
  }
  @Input() set initialCarKey(key: string | null) {
    if (key) {
      this.selectCar(key);
    }
  }
  @Input() set initialServiceType(type: ServiceType | null) {
    if (type) {
      this.serviceType.set(type);
    }
  }
  @Input() set initialCity(city: string | null) {
    if (city) {
      this.setSelectedCity(city);
    }
  }
  @Input() set initialTour(tour: string | null) {
    if (tour) {
      this.selectedTour.set(tour);
    }
  }

  @Output() closeModal = new EventEmitter<void>();

  readonly open = signal<boolean>(false);
  readonly currentStep = signal<number>(1); // 1: Route & Date, 2: Fleet & Pricing, 3: Privacy, 4: Guest & Payment, 5: Receipt
  readonly isSavingOrder = signal<boolean>(false);
  readonly orderSavedSuccess = signal<boolean>(false);

  // Step 1: Service & Route Details
  readonly serviceType = signal<ServiceType>('transfer');
  readonly transferMode = signal<TransferMode>('intercity');
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

  // Step 3: Privacy
  readonly isDiscreetBooking = signal<boolean>(false);
  readonly welcomePlacardName = signal<string>('');

  // Step 4: Guest Information & Payment
  readonly guestName = signal<string>('');
  readonly guestPhone = signal<string>('');
  readonly specialNotes = signal<string>('');
  readonly paymentMethod = signal<PaymentMethod>('mada');

  // Setters for Template Signal Binding
  setPaymentMethod(val: PaymentMethod): void { this.paymentMethod.set(val); }
  setPickupLocation(val: string): void { this.pickupLocation.set(val); }
  setDropoffLocation(val: string): void { this.dropoffLocation.set(val); }
  setFlightNumber(val: string): void { this.flightNumber.set(val); }
  setGuestName(val: string): void { this.guestName.set(val); }
  setGuestPhone(val: string): void { this.guestPhone.set(val); }
  setSpecialNotes(val: string): void { this.specialNotes.set(val); }
  setIsDiscreetBooking(val: boolean): void { this.isDiscreetBooking.set(val); }
  setWelcomePlacardName(val: string): void { this.welcomePlacardName.set(val); }
  setEnableFlightTracking(val: boolean): void { this.enableFlightTracking.set(val); }
  setPickupDate(val: string): void { this.pickupDate.set(val); }
  setPickupTime(val: string): void { this.pickupTime.set(val); }
  setSelectedTour(val: string): void { this.selectedTour.set(val); }

  setTransferMode(mode: TransferMode): void {
    this.transferMode.set(mode);
    if (mode === 'jeddah_airport') {
      this.selectedCity.set('جدة');
      this.dropoffLocation.set('داخل جدة');
    } else {
      this.dropoffLocation.set('فندق برج الساعة - مكة المكرمة');
    }

    const selectedCar = this.selectedCarObj();
    if (!this.isCarAvailableForCurrentRoute(selectedCar)) {
      const firstAvailableCar = this.carsList().find((car) => this.isCarAvailableForCurrentRoute(car));
      if (firstAvailableCar) this.selectCar(firstAvailableCar.key);
    }
  }

  // Computed data
  readonly carsList = computed(() => this.siteContent.content()?.cars ?? []);
  readonly cityOptions = computed(() => {
    if (this.serviceType() === 'transfer' && this.transferMode() === 'jeddah_airport') return ['جدة'];
    const cities = this.selectedCarObj().availableCities;
    return cities?.length ? cities : ['جدة', 'مكة المكرمة', 'الرياض', 'أبها', 'العلا', 'البحر الأحمر'];
  });

  readonly selectedCarObj = computed(() => {
    const list = this.carsList();
    const key = this.selectedCarKey();
    return list.find((c) => c.key === key || c.key === key.replace('transfer-', '')) || list[0];
  });

  // Dynamic Pricing Calculations
  readonly basePrice = computed(() => {
    return this.basePriceForCar(this.selectedCarObj());
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

  selectPeakSeason(season: PeakSeason): void {
    this.peakSeason.set(season);
  }

  estimatedTotalForCar(car: FleetCar): number {
    const base = this.basePriceForCar(car);
    const peakAmount = Math.round(base * (this.peakMultiplier() - 1));
    const subtotal = base + peakAmount;
    return subtotal + Math.round(subtotal * 0.15);
  }

  priceBasisForCar(car: FleetCar): string {
    if (this.serviceType() === 'transfer') {
      if (this.transferMode() === 'jeddah_airport') return 'من/إلى مطار جدة داخل المدينة';
      return this.transferItemForCar(car)?.note || 'سعر الرحلة حسب المسار';
    }
    if (this.serviceType() === 'tour') {
      return `حسب الباقة: ${this.selectedTour()}`;
    }
    return `${this.selectedHours()} ساعة مع السائق`;
  }

  setSelectedCity(city: string): void {
    this.selectedCity.set(city);
    if (city === 'أبها') {
      if (this.serviceType() === 'tour') {
        this.selectedTour.set('جولة عسير وأبها (12 ساعة)');
      }
      this.pickupLocation.set('مطار أبها الإقليمي (AHB)');
      this.dropoffLocation.set('منتزه السودة - أبها');
    } else if (city === 'الرياض') {
      if (this.serviceType() === 'tour') {
        this.selectedTour.set('خدمات وتغطية موسم الرياض الخاصة');
      }
      this.pickupLocation.set('مطار الملك خالد الدولي (RUH)');
      this.dropoffLocation.set('منطقة بوليفارد سيتي - الرياض');
    } else if (city === 'العلا') {
      if (this.serviceType() === 'tour') {
        this.selectedTour.set('تجربة العلا الملكية VIP');
      }
      this.pickupLocation.set('مطار العلا الدولي (ULH)');
      this.dropoffLocation.set('منتجع الحجر - العلا');
    } else if (city === 'مكة المكرمة') {
      if (this.serviceType() === 'tour') {
        this.selectedTour.set('باقة العمرة والزيارة الراقية');
      }
      this.pickupLocation.set('مطار الملك عبد العزيز الدولي (JED)');
      this.dropoffLocation.set('فندق برج الساعة - مكة المكرمة');
    } else if (city === 'جدة') {
      this.pickupLocation.set('مطار الملك عبد العزيز الدولي (JED)');
      this.dropoffLocation.set('فندق الشاطئ - كورنيش جدة');
    }
  }

  private basePriceForCar(car: FleetCar): number {
    if (this.serviceType() === 'transfer') {
      const transferItem = this.transferItemForCar(car);
      const price = this.transferMode() === 'jeddah_airport'
        ? transferItem?.airportPrice
        : transferItem?.price;
      return parseInt(price || '', 10) || 300;
    }
    if (this.serviceType() === 'tour') {
      if (this.selectedTour().includes('العلا')) return 2800;
      if (this.selectedTour().includes('أبها')) return 1500;
      if (this.selectedTour().includes('الرياض')) return 1500;
      return 1200;
    }

    const fullDayRate = parseInt(car.price, 10) || 1000;
    if (this.selectedHours() === 4) return Math.round(fullDayRate * 0.45);
    if (this.selectedHours() === 8) return Math.round(fullDayRate * 0.75);
    return fullDayRate;
  }

  private transferItemForCar(car: FleetCar) {
    const transferKey = `transfer-${car.key.replace('transfer-', '')}`;
    return this.siteContent.content()?.transferCars?.find((item) => item.key === transferKey);
  }

  isCarAvailableForCurrentRoute(car: FleetCar): boolean {
    if (this.serviceType() !== 'transfer' || this.transferMode() !== 'jeddah_airport') return true;
    return Boolean(this.transferItemForCar(car)?.airportPrice);
  }

  readonly bookingRef = computed(() => {
    return 'ROYAL-' + Math.floor(100000 + Math.random() * 900000);
  });

  close(): void {
    this.open.set(false);
    this.closeModal.emit();
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
      transferMode: this.serviceType() === 'transfer' ? this.transferMode() : undefined,
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
        isDiscreetBooking: this.isDiscreetBooking(),
        welcomePlacardName: this.welcomePlacardName().trim(),
      },
    };

    await this.ordersService.createOrder(payload);
    this.isSavingOrder.set(false);
    this.orderSavedSuccess.set(true);
  }

  nextStep(): void {
    if (this.currentStep() < 4) {
      this.currentStep.update((s) => s + 1);
      this.scrollStepToTop();
    } else if (this.currentStep() === 4) {
      void this.submitOrder('direct');
      this.currentStep.set(5); // Receipt view
      this.scrollStepToTop();
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update((s) => s - 1);
      this.scrollStepToTop();
    }
  }

  private scrollStepToTop(): void {
    window.requestAnimationFrame(() => {
      const scrollArea = this.bookingScrollArea?.nativeElement;
      if (!scrollArea) return;

      scrollArea.scrollTo({
        top: 0,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    });
  }

  selectCar(key: string): void {
    this.selectedCarKey.set(key);
    const selectedCar = this.carsList().find((car) => car.key === key.replace('transfer-', ''));
    const availableCities = selectedCar?.availableCities;
    if (availableCities?.length && !availableCities.includes(this.selectedCity())) {
      this.selectedCity.set(availableCities[0]);
    }
  }

  selectCarAndShowPrice(key: string): void {
    this.selectCar(key);
    this.scrollToPriceSummary();
  }

  private scrollToPriceSummary(): void {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const scrollArea = this.bookingScrollArea?.nativeElement;
      const priceSummary = this.bookingPriceSummary?.nativeElement;
      if (!scrollArea || !priceSummary) return;

      const areaTop = scrollArea.getBoundingClientRect().top;
      const summaryTop = priceSummary.getBoundingClientRect().top;
      const targetTop = scrollArea.scrollTop + summaryTop - areaTop - 16;
      const maxScrollTop = scrollArea.scrollHeight - scrollArea.clientHeight;
      scrollArea.scrollTo({
        top: Math.max(0, Math.min(targetTop, maxScrollTop)),
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    }));
  }

  onWhatsAppClick(): void {
    void this.submitOrder('whatsapp');
  }

  getWhatsAppBookingUrl(): string {
    const car = this.selectedCarObj().name;
    const typeLabel =
      this.serviceType() === 'transfer'
        ? this.transferMode() === 'jeddah_airport' ? 'من/إلى مطار جدة داخل المدينة' : 'بين جدة ومكة'
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

🔒 *الخصوصية:*
• حجز سري: ${this.isDiscreetBooking() ? 'نعم' : 'لا'}
• اسم لوحة استقبال المطار: ${this.welcomePlacardName().trim() || 'بدون'}

👤 *بيانات الضيف:*
• الاسم: ${this.guestName() || 'ضيف كريم'}
• الجوال: ${this.guestPhone() || 'غير محدد'}
• طريقة الدفع: ${this.getPaymentLabel()}

💰 *إجمالي التكلفة شامل VAT (15%):* ${this.totalPrice()} ريال
----------------------------------------
يرجى تأكيد الحجز وتعيين السائق.`;

    return `https://wa.me/966569038515?text=${encodeURIComponent(text)}`;
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
