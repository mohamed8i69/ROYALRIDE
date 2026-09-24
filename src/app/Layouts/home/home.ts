import { Component, inject, signal } from '@angular/core';
import { Footer } from '../../components/footer/footer';
import { BookingModal, ServiceType } from '../../components/booking-modal/booking-modal';
import { CarLightbox, LightboxData } from '../../components/car-lightbox/car-lightbox';
import { SiteContentService, SectionId } from '../../services/site-content.service';

@Component({
  imports: [Footer, BookingModal, CarLightbox],
  selector: 'app-home',
  templateUrl: './home.html',
})
export class Home {
  private readonly siteContent = inject(SiteContentService);
  readonly content = this.siteContent.content;
  readonly activeCar = signal<string | null>(null);
  readonly activeTransfer = signal<string | null>(null);

  // Booking Modal State
  readonly isBookingModalOpen = signal<boolean>(false);
  readonly selectedCarKey = signal<string | null>(null);
  readonly selectedServiceType = signal<ServiceType>('transfer');

  // Car Image Lightbox Carousel
  readonly lightboxData = signal<LightboxData | null>(null);

  openBookingModal(carKey?: string, serviceType?: ServiceType): void {
    if (carKey) this.selectedCarKey.set(carKey);
    if (serviceType) this.selectedServiceType.set(serviceType);
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

  /** Returns the 1-based position (1–5) of a section for Tailwind order-N class binding. */
  sectionPos(id: SectionId): number {
    const idx = this.content().sectionOrder.indexOf(id);
    return idx === -1 ? 5 : idx + 1;
  }
}
