import { Component, computed, inject, signal } from '@angular/core';
import { Footer } from '../../components/footer/footer';
import { BookingModal, ServiceType } from '../../components/booking-modal/booking-modal';
import { CarLightbox, LightboxData } from '../../components/car-lightbox/car-lightbox';
import { SiteContentService, SectionId, SiteContent } from '../../services/site-content.service';

@Component({
  imports: [Footer, BookingModal, CarLightbox],
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl : './home.css',
})
export class Home {
  private readonly siteContent = inject(SiteContentService);

  /** Raw nullable signal from the service */
  readonly content = this.siteContent.content;

  /** Loading & error state from the service */
  readonly loading = this.siteContent.loading;
  readonly error = this.siteContent.error;

  /** Non-null content for template use — only accessed when content() is not null */
  readonly contentData = computed<SiteContent | null>(() => this.content());

  readonly activeCar = signal<string | null>(null);
  readonly activeTransfer = signal<string | null>(null);

  // Booking Modal State
  readonly isBookingModalOpen = signal<boolean>(false);
  readonly selectedCarKey = signal<string | null>(null);
  readonly selectedServiceType = signal<ServiceType>('transfer');
  readonly selectedCity = signal<string | null>(null);
  readonly selectedTour = signal<string | null>(null);

  // Car Image Lightbox Carousel
  readonly lightboxData = signal<LightboxData | null>(null);

  openBookingModal(carKey?: string, serviceType?: ServiceType, city?: string, tour?: string): void {
    if (carKey) this.selectedCarKey.set(carKey);
    else this.selectedCarKey.set(null); 
    if (serviceType) this.selectedServiceType.set(serviceType);
    else this.selectedServiceType.set('transfer');
    if (city) this.selectedCity.set(city);
    else this.selectedCity.set('جدة');
    if (tour) this.selectedTour.set(tour);
    else this.selectedTour.set('جدة - مكة');
    console.log(this.selectedCarKey(), this.selectedServiceType(), this.selectedCity(), this.selectedTour())
    this.isBookingModalOpen.set(true);
  }

  closeBookingModal(): void {
    this.isBookingModalOpen.set(false);
  }

  toggleDetails(car: string): void {
    this.activeCar.update((active) => (active === car ? null : car));
  }

  toggleTransferDetails(car: string): void {
    this.activeTransfer.update((active) => (active === car ? null : car));
  }

  openLightbox(images: string[] | string, name: string): void {
    let list: string[] = [];
    if (Array.isArray(images) && images.length > 0) {
      list = images.filter(Boolean);
    } else if (typeof images === 'string' && images.trim()) {
      list = [images.trim()];
    }
    this.lightboxData.set({ images: list, name });
  }

  closeLightbox(): void {
    this.lightboxData.set(null);
  }

  transferOrderLink(carName: string, price: string): string {
    const message = `مرحباً، أريد طلب ${carName} للتنقل بين جدة ومكة بسعر ${price} ريال.`;
    return `https://wa.me/966569038515?text=${encodeURIComponent(message)}`;
  }

  /** Returns the 1-based position (1–6) of a section for CSS order class binding. */
  sectionPos(id: SectionId): number {
    const sectionOrder = this.content()?.sectionOrder;
    if (!sectionOrder) return 6;
    const idx = sectionOrder.indexOf(id);
    return idx === -1 ? 6 : idx + 1;
  }
}
