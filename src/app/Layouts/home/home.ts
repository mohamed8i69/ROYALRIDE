import { Component, inject, signal } from '@angular/core';
import { Footer } from '../../components/footer/footer';
import { BookingModal, ServiceType } from '../../components/booking-modal/booking-modal';
import { CarLightbox, LightboxData } from '../../components/car-lightbox/car-lightbox';
import { SiteContentService, SectionId, FleetCar, TransferCar } from '../../services/site-content.service';

type CitiesTab = 'transfer' | 'fleet';

@Component({
  imports: [Footer, BookingModal, CarLightbox],
  selector: 'app-home',
  templateUrl: './home.html',
})
export class Home {
  private readonly siteContent = inject(SiteContentService);
  readonly content = this.siteContent.content;

  /** Active tab inside the Jeddah/Makkah cities block */
  readonly citiesTab = signal<CitiesTab>('transfer');

  /** Active tab inside the Riyadh cities block */
  readonly riyadhTab = signal<CitiesTab>('fleet');

  /** Per-card image index for in-card carousels */
  readonly cardImageIndex = signal<Record<string, number>>({});

  // Booking Modal State
  readonly isBookingModalOpen = signal<boolean>(false);
  readonly selectedCarKey = signal<string | null>(null);
  readonly selectedServiceType = signal<ServiceType>('transfer');

  // Full-screen lightbox
  readonly lightboxData = signal<LightboxData | null>(null);

  setCitiesTab(tab: CitiesTab): void {
    this.citiesTab.set(tab);
  }

  setRiyadhTab(tab: CitiesTab): void {
    this.riyadhTab.set(tab);
  }

  openBookingModal(carKey?: string, serviceType?: ServiceType): void {
    if (carKey) this.selectedCarKey.set(carKey);
    if (serviceType) this.selectedServiceType.set(serviceType);
    this.isBookingModalOpen.set(true);
  }

  closeBookingModal(): void {
    this.isBookingModalOpen.set(false);
  }

  carGallery(car: { image: string; images?: string[] }): string[] {
    if (car.images && car.images.length > 0) return car.images.filter(Boolean);
    return car.image ? [car.image] : [];
  }

  currentCardImage(car: { key: string; image: string; images?: string[] }): string {
    const gallery = this.carGallery(car);
    if (gallery.length === 0) return car.image || '';
    const idx = this.cardImageIndex()[car.key] || 0;
    return gallery[idx % gallery.length];
  }

  nextCardImage(car: { key: string; image: string; images?: string[] }, event?: Event): void {
    event?.stopPropagation();
    const gallery = this.carGallery(car);
    if (gallery.length <= 1) return;
    this.cardImageIndex.update((map) => {
      const cur = map[car.key] || 0;
      return { ...map, [car.key]: (cur + 1) % gallery.length };
    });
  }

  prevCardImage(car: { key: string; image: string; images?: string[] }, event?: Event): void {
    event?.stopPropagation();
    const gallery = this.carGallery(car);
    if (gallery.length <= 1) return;
    this.cardImageIndex.update((map) => {
      const cur = map[car.key] || 0;
      return { ...map, [car.key]: (cur - 1 + gallery.length) % gallery.length };
    });
  }

  openLightbox(car: { name: string; image: string; images?: string[]; key: string }): void {
    const list = this.carGallery(car);
    const initialIndex = this.cardImageIndex()[car.key] || 0;
    this.lightboxData.set({ images: list, name: car.name, initialIndex });
  }

  closeLightbox(): void {
    this.lightboxData.set(null);
  }

  whatsAppBookLink(
    car: FleetCar | TransferCar,
    service: CitiesTab,
    city: 'jeddah' | 'riyadh' = 'jeddah',
  ): string {
    const cityLabel = city === 'riyadh' ? 'في الرياض' : 'بين جدة ومكة';
    const kind =
      service === 'transfer'
        ? `للاستقبال / التنقل ${cityLabel} (${car.note || ''})`
        : `للتأجير بالساعة / اليوم ${cityLabel} (${car.note || 'يوم كامل'})`;
    const message = `مرحباً، أريد حجز ${car.name} ${kind} بسعر ${car.price} ريال.`;
    return `https://wa.me/966569038515?text=${encodeURIComponent(message)}`;
  }

  toursWhatsAppLink(): string {
    const message = 'مرحباً، أريد ترتيب جولة سياحية في أبها مع ROYALRIDE.';
    return `https://wa.me/966569038515?text=${encodeURIComponent(message)}`;
  }

  /** 1-based position for Tailwind order-N (supports up to 4 sections). */
  sectionPos(id: SectionId): number {
    const idx = this.content().sectionOrder.indexOf(id);
    return idx === -1 ? 4 : idx + 1;
  }
}
