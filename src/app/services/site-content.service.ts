import { computed, inject, PLATFORM_ID, Service } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

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

@Service()
export class SiteContentService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  /**
   * Modern Angular httpResource: fetches site-content reactively as Signals.
   * Runs in the browser against the same-origin /api/site-content endpoint.
   */
  readonly contentResource = httpResource<SiteContent | null>(
    () => (isPlatformBrowser(this.platformId) ? '/api/site-content' : undefined),
    {
      defaultValue: null,
      parse: (raw: unknown): SiteContent | null => {
        if (!raw || typeof raw !== 'object') return null;
        return this.normalizeContent(raw as Partial<SiteContent>);
      },
    }
  );

  /** Exposed reactive Signals for components */
  readonly content = computed(() => this.contentResource.value() ?? null);
  readonly loading = computed(() => this.contentResource.isLoading());
  readonly error = computed(() =>
    this.contentResource.error() ? 'تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى لاحقاً.' : null
  );

  async reload(): Promise<SiteContent | null> {
    if (!isPlatformBrowser(this.platformId)) {
      return this.content();
    }

    this.contentResource.reload();
    try {
      const remote = await firstValueFrom(this.http.get<SiteContent>('/api/site-content'));
      if (remote && typeof remote === 'object') {
        const loaded = this.normalizeContent(remote);
        this.contentResource.set(loaded);
        return loaded;
      }
    } catch (error) {
      console.error('SiteContentService.reload() failed:', error);
    }
    return this.content();
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

    const saved = await firstValueFrom(this.http.put<SiteContent>('/api/site-content', next));
    const normalized = this.normalizeContent(saved ?? next);
    this.contentResource.set(normalized);
  }

  async saveSectionOrder(sectionOrder: SectionId[]): Promise<void> {
    const res = await firstValueFrom(
      this.http.patch<{ ok: boolean; sectionOrder: SectionId[] }>(
        '/api/site-content/section-order',
        { sectionOrder }
      )
    );
    const updatedOrder = res?.sectionOrder || sectionOrder;
    this.contentResource.update((prev) => (prev ? { ...prev, sectionOrder: updatedOrder } : prev));
  }

  private normalizeContent(remote: Partial<SiteContent>): SiteContent {
    const knownSectionIds = new Set<SectionId>(FALLBACK_SECTION_ORDER);
    const suppliedOrder = (Array.isArray(remote.sectionOrder) ? remote.sectionOrder : [])
      .filter((id): id is SectionId => knownSectionIds.has(id));
    const uniqueSuppliedOrder = [...new Set(suppliedOrder)];
    const mergedSectionOrder: SectionId[] = [
      ...uniqueSuppliedOrder,
      ...FALLBACK_SECTION_ORDER.filter((id) => !uniqueSuppliedOrder.includes(id)),
    ];

    return {
      ...(remote as SiteContent),
      cars: normalizeCarImages(remote.cars),
      transferCars: normalizeCarImages(remote.transferCars),
      sectionOrder: mergedSectionOrder,
    };
  }
}

