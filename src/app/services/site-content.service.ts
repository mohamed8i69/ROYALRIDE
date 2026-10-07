import { inject, PLATFORM_ID, Service, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FleetCar {
  key: string;
  name: string;
  number?: number;
  price: string;
  note: string;
  details: string;
  image: string;
  images?: string[];
  availableCities?: string[];
}

export interface TransferCar {
  key: string;
  name: string;
  price: string;
  airportPrice?: string;
  note: string;
  image: string;
  images?: string[];
}

export type SectionId = 'hero' | 'transfer' | 'fleet' | 'tours' | 'testimonials' | 'contact';

export interface SiteContent {
  heroTitle: string;
  heroSubtitle: string;
  aboutTitle: string;
  aboutText: string;
  aboutSecondaryText: string;
  transferTitle: string;
  transferText: string;
  toursTitle: string;
  toursText: string;
  cars: FleetCar[];
  transferCars: TransferCar[];
  sectionOrder: SectionId[];
}

/** Normalize car images array: ensure `images` array is in sync with the primary `image` field. */
function normalizeCarImages<T extends { image: string; images?: string[] }>(cars: T[] | undefined): T[] {
  if (!cars?.length) return [];
  return cars.map((car) => {
    const hasGallery = Array.isArray(car.images) && car.images.filter(Boolean).length > 0;
    let images: string[];
    if (hasGallery) {
      images = car.images!.filter(Boolean);
    } else if (car.image?.trim()) {
      images = [car.image.trim()];
    } else {
      images = [];
    }
    return {
      ...car,
      image: car.image?.trim() || images[0] || '',
      images,
    };
  });
}

const FALLBACK_SECTION_ORDER: SectionId[] = ['hero', 'transfer', 'fleet', 'tours', 'testimonials', 'contact'];

const API_BASE = environment.apiUrl || 'https://dashboard-nine-flame-50.vercel.app';

@Service()
export class SiteContentService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  readonly content = signal<SiteContent | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  async reload(): Promise<SiteContent | null> {
    return this.load();
  }

  async save(nextContent: SiteContent): Promise<void> {
    const next = structuredClone(nextContent);
    const syncGallery = <T extends { image: string; images?: string[] }>(cars: T[]): T[] =>
      cars.map((car) => {
        const filled = (car.images || []).map((s) => (s || '').trim()).filter(Boolean);
        const images = filled.length > 0 ? filled : car.image?.trim() ? [car.image.trim()] : [];
        return { ...car, images, image: images[0] || car.image || '' };
      });
    next.cars = syncGallery(next.cars || []);
    next.transferCars = syncGallery(next.transferCars || []);
    await firstValueFrom(this.http.put<SiteContent>(`${API_BASE}/api/site-content`, next));
    this.content.set(next);
    this.error.set(null);
  }

  async saveSectionOrder(sectionOrder: SectionId[]): Promise<void> {
    const res = await firstValueFrom(
      this.http.patch<{ ok: boolean; sectionOrder: SectionId[] }>(
        `${API_BASE}/api/site-content/section-order`,
        { sectionOrder }
      )
    );
    this.content.update((prev) => prev ? ({
      ...prev,
      sectionOrder: res?.sectionOrder || sectionOrder,
    }) : prev);
    this.error.set(null);
  }

  private async load(): Promise<SiteContent | null> {
    if (!isPlatformBrowser(this.platformId)) {
      this.loading.set(false);
      return this.content();
    }

    this.loading.set(true);

    try {
      const remote = await firstValueFrom(this.http.get<SiteContent>(`${API_BASE}/api/site-content`));
      if (remote && typeof remote === 'object') {
        const knownSectionIds = new Set<SectionId>(FALLBACK_SECTION_ORDER);
        const suppliedOrder = (Array.isArray(remote.sectionOrder) ? remote.sectionOrder : [])
          .filter((id): id is SectionId => knownSectionIds.has(id));
        const uniqueSuppliedOrder = [...new Set(suppliedOrder)];
        const mergedSectionOrder: SectionId[] = [
          ...uniqueSuppliedOrder,
          ...FALLBACK_SECTION_ORDER.filter((id) => !uniqueSuppliedOrder.includes(id)),
        ];

        const loaded: SiteContent = {
          ...remote,
          cars: normalizeCarImages(remote.cars),
          transferCars: normalizeCarImages(remote.transferCars),
          sectionOrder: mergedSectionOrder,
        };
        this.content.set(loaded);
      }
      this.error.set(null);
    } catch {
      this.error.set('تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى لاحقاً.');
    } finally {
      this.loading.set(false);
    }

    return this.content();
  }
}
