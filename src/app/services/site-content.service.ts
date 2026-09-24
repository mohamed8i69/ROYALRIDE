import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FleetCar {
  key: string;
  name: string;
  number: number;
  price: string;
  note: string;
  details: string;
  image: string;
  images?: string[];
}

export interface TransferCar {
  key: string;
  name: string;
  price: string;
  note: string;
  image: string;
  images?: string[];
}

export type SectionId = 'hero' | 'transfer' | 'fleet' | 'tours'|'contact';

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

const defaultContent: SiteContent = {
  heroTitle: 'رحلات ملكية: خدمة سيارات VIP مع سائقين خاصين في جدة، أبها، الرياض، ومكة',
  heroSubtitle: 'ROYALRIDE — الرحلة الملكية',
  aboutTitle: 'من نحن',
  aboutText: 'نحن مؤسسة مرون خالد عبدالله محمد لخدمات النقل، نقدم تجربة VIP متكاملة بسيارات فاخرة وسائقين محترفين في الرياض وجدة ومكة وأبها.',
  aboutSecondaryText: 'نؤمن أن كل رحلة تستحق مستوى استثنائياً من الراحة والأمان والدقة في المواعيد.',
  transferTitle: 'التنقل بين جدة ومكة',
  transferText: 'الاستقبال والتنقل من جدة إلى مكة والعكس من مكة إلى جدة',
  toursTitle: 'أبها: الجولات السياحية والخدمات الخاصة',
  toursText: 'بكجات خاصة يتم ترتيبها بناءً على جدول رحلاتكم لخدمتكم، تواصلوا معنا.',
  sectionOrder: ['hero', 'transfer', 'fleet', 'tours', 'contact'],
  cars: [
    { key: 'taurus', name: 'فورد تورس', number: 4, price: '1000', note: 'اليوم الكامل · 12 ساعة مع السائق', details: 'خيار أنيق ومريح للتنقلات اليومية والرحلات الخاصة.', image: 'photo_2026-09-19_14-27-45.jpg', images: ['photo_2026-09-19_14-27-45.jpg', 'hero.jpg', 'photo_2026-09-19_14-27-48.jpg'] },
    { key: 'gmc', name: 'جمس (GMC)', number: 6, price: '1100', note: 'اليوم الكامل · 12 ساعة مع السائق', details: 'مساحة واسعة وخدمة مثالية للعائلات والوفود الصغيرة.', image: 'photo_2026-09-19_14-27-39.jpg', images: ['photo_2026-09-19_14-27-39.jpg', 'Gemini_Generated_Image_qs51tfqs51tfqs51.jpg', 'hero.jpg'] },
    { key: 'lexus', name: 'لكزس', number: 7, price: '1500', note: 'اليوم الكامل · 12 ساعة مع السائق', details: 'فخامة هادئة وتجربة راقية مع سائق خاص.', image: 'WhatsApp Image 2026-09-20 at 7.11.13 AM (2).jpeg', images: ['WhatsApp Image 2026-09-20 at 7.11.13 AM (2).jpeg', 'photo_2026-09-19_14-27-45.jpg', 'photo_2026-09-19_14-27-42.jpg'] },
    { key: 'sclass', name: 'مرسيدس S Class', number: 4, price: '2300', note: 'اليوم الكامل · 12 ساعة مع السائق', details: 'الفئة الملكية للمناسبات المهمة والتنقلات التنفيذية.', image: 'photo_2026-09-19_14-27-42.jpg', images: ['photo_2026-09-19_14-27-42.jpg', 'WhatsApp Image 2026-09-20 at 7.11.13 AM (2).jpeg', 'hero.jpg'] },
    { key: 'staria', name: 'Staria Van', number: 4, price: '800', note: '100 ريال بالساعة داخل جدة · 800 ريال يوم كامل', details: 'سيارة واسعة للمجموعات؛ اليوم الكامل يشمل 12 ساعة مع السائق.', image: 'WhatsApp Image 2026-09-20 at 7.11.13 AM (3).jpeg', images: ['WhatsApp Image 2026-09-20 at 7.11.13 AM (3).jpeg', 'photo_2026-09-19_14-27-39.jpg', '70772683470.png'] },
  ],
  transferCars: [
    { key: 'transfer-taurus', name: 'فورد تورس', price: '250', note: 'اتجاه واحد', image: 'photo_2026-09-19_14-27-45.jpg', images: ['photo_2026-09-19_14-27-45.jpg', 'hero.jpg'] },
    { key: 'transfer-lexus', name: 'لكزس', price: '340', note: 'اتجاه واحد', image: 'WhatsApp Image 2026-09-20 at 7.11.13 AM (2).jpeg', images: ['WhatsApp Image 2026-09-20 at 7.11.13 AM (2).jpeg', 'photo_2026-09-19_14-27-42.jpg'] },
    { key: 'transfer-gmc', name: 'جمس (GMC)', price: '370', note: 'اتجاه واحد', image: 'photo_2026-09-19_14-27-39.jpg', images: ['photo_2026-09-19_14-27-39.jpg', 'Gemini_Generated_Image_qs51tfqs51tfqs51.jpg'] },
    { key: 'transfer-sclass', name: 'مرسيدس S Class', price: '1200', note: '12 ساعة', image: 'photo_2026-09-19_14-27-42.jpg', images: ['photo_2026-09-19_14-27-42.jpg', 'WhatsApp Image 2026-09-20 at 7.11.13 AM (2).jpeg'] },
    { key: 'transfer-staria', name: 'Staria Van', price: '800', note: '12 ساعة', image: 'WhatsApp Image 2026-09-20 at 7.11.13 AM (3).jpeg', images: ['WhatsApp Image 2026-09-20 at 7.11.13 AM (3).jpeg', 'photo_2026-09-19_14-27-39.jpg'] },
  ],
};

const API_BASE = environment.apiUrl || 'https://dashboard-nine-flame-50.vercel.app';

/** Ensure every car has an `images` gallery; fall back to defaults then primary `image`. */
function normalizeCarImages<T extends { key: string; image: string; images?: string[] }>(
  cars: T[] | undefined,
  defaults: T[],
): T[] {
  const list = cars && cars.length > 0 ? cars : defaults;
  return list.map((car) => {
    const fallback = defaults.find((d) => d.key === car.key);
    const hasGallery = Array.isArray(car.images) && car.images.filter(Boolean).length > 0;

    let images: string[];
    if (hasGallery) {
      images = car.images!.filter(Boolean);
    } else if (fallback?.images && fallback.images.length > 0) {
      // Keep the live primary image first, then append other default gallery shots
      const primary = (car.image || fallback.image || '').trim();
      const rest = fallback.images.filter((src) => src && src !== primary);
      images = primary ? [primary, ...rest] : [...fallback.images];
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

@Injectable({ providedIn: 'root' })
export class SiteContentService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  readonly content = signal<SiteContent>(structuredClone(defaultContent));
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  async reload(): Promise<SiteContent> {
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
    this.content.update((prev) => ({
      ...prev,
      sectionOrder: res?.sectionOrder || sectionOrder,
    }));
    this.error.set(null);
  }

  async reset(): Promise<void> {
    await this.save(defaultContent);
  }

  private async load(): Promise<SiteContent> {
    if (!isPlatformBrowser(this.platformId)) {
      this.loading.set(false);
      return this.content();
    }

    this.loading.set(true);

    try {
      const remote = await firstValueFrom(this.http.get<SiteContent>(`${API_BASE}/api/site-content`));
      if (remote && typeof remote === 'object') {
        let mergedSectionOrder = defaultContent.sectionOrder;
        if (remote.sectionOrder && Array.isArray(remote.sectionOrder) && remote.sectionOrder.length > 0) {
          mergedSectionOrder = remote.sectionOrder.includes('contact')
            ? remote.sectionOrder
            : [...remote.sectionOrder, 'contact'];
        }

        const merged: SiteContent = {
          ...structuredClone(defaultContent),
          ...remote,
          cars: normalizeCarImages(remote.cars, defaultContent.cars),
          transferCars: normalizeCarImages(remote.transferCars, defaultContent.transferCars),
          sectionOrder: mergedSectionOrder,
        };
        this.content.set(merged);
      }
      this.error.set(null);
    } catch {
      this.error.set('تعذر الاتصال بالخادم، يتم عرض البيانات الافتراضية مؤقتاً.');
    } finally {
      this.loading.set(false);
    }

    return this.content();
  }
}
