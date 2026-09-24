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
  badge?: string;
}

export interface TransferCar {
  key: string;
  name: string;
  price: string;
  note: string;
  image: string;
  images?: string[];
  badge?: string;
}

export type SectionId = 'hero' | 'cities' | 'tours' | 'contact';

export interface SiteContent {
  heroTitle: string;
  heroSubtitle: string;
  aboutTitle: string;
  aboutText: string;
  aboutSecondaryText: string;
  citiesTitle: string;
  citiesJeddahTitle: string;
  citiesJeddahText: string;
  citiesJeddahImage: string;
  citiesRiyadhTitle: string;
  citiesRiyadhText: string;
  citiesRiyadhImage: string;
  transferTitle: string;
  transferText: string;
  fleetTabLabel: string;
  transferTabLabel: string;
  toursTitle: string;
  toursSubtitle: string;
  toursText: string;
  toursFeatures: string[];
  cars: FleetCar[];
  transferCars: TransferCar[];
  riyadhCars: FleetCar[];
  riyadhTransferCars: TransferCar[];
  sectionOrder: SectionId[];
}

const defaultContent: SiteContent = {
  heroTitle: 'رحلات ملكية: خدمة سيارات VIP مع سائقين خاصين في جدة، أبها، الرياض، ومكة',
  heroSubtitle: 'ROYALRIDE — الرحلة الملكية',
  aboutTitle: 'من نحن',
  aboutText: 'نحن مؤسسة مرون خالد عبدالله محمد لخدمات النقل، نقدم تجربة VIP متكاملة بسيارات فاخرة وسائقين محترفين في الرياض وجدة ومكة وأبها.',
  aboutSecondaryText: 'نؤمن أن كل رحلة تستحق مستوى استثنائياً من الراحة والأمان والدقة في المواعيد.',
  citiesTitle: 'اكتشف خدماتنا في مختلف المدن',
  citiesJeddahTitle: 'جدة ومكة المكرمة',
  citiesJeddahText: 'الاستقبال والنقل، والخدمات اليومية بالساعة',
  citiesJeddahImage: 'Gemini_Generated_Image_qs51tfqs51tfqs51.jpg',
  citiesRiyadhTitle: 'الرياض',
  citiesRiyadhText: 'خدمات رجال الأعمال والتنقل التنفيذي داخل العاصمة',
  citiesRiyadhImage: 'hero.jpg',
  transferTitle: 'التنقل بين جدة ومكة',
  transferText: 'الاستقبال والتنقل من جدة إلى مكة والعكس من مكة إلى جدة',
  transferTabLabel: 'استقبال / تنقل',
  fleetTabLabel: 'تأجير بالساعة / اليوم',
  toursTitle: 'مدينة أبها',
  toursSubtitle: 'الجولات السياحية والخدمات الخاصة',
  toursText: 'بكجات خاصة وجولات سياحية يتم ترتيبها بناءً على جدول رحلاتكم لخدمتكم.',
  toursFeatures: [
    'جولات سياحية',
    'تنقلات جبلية',
    'سائق خاص متاح طوال اليوم',
  ],
  sectionOrder: ['hero', 'cities', 'tours', 'contact'],
  cars: [
    { key: 'taurus', name: 'فورد تورس', number: 4, price: '1000', note: 'اليوم الكامل · 12 ساعة مع السائق', details: 'خيار أنيق ومريح للتنقلات اليومية والرحلات الخاصة.', image: 'photo_2026-09-19_14-27-45.jpg', images: ['photo_2026-09-19_14-27-45.jpg', 'hero.jpg', 'photo_2026-09-19_14-27-48.jpg'], badge: 'عائلية مريحة' },
    { key: 'gmc', name: 'جمس (GMC)', number: 6, price: '1100', note: 'اليوم الكامل · 12 ساعة مع السائق', details: 'مساحة واسعة وخدمة مثالية للعائلات والوفود الصغيرة.', image: 'photo_2026-09-19_14-27-39.jpg', images: ['photo_2026-09-19_14-27-39.jpg', 'Gemini_Generated_Image_qs51tfqs51tfqs51.jpg', 'hero.jpg'], badge: 'عائلية واسعة' },
    { key: 'lexus', name: 'لكزس', number: 7, price: '1500', note: 'اليوم الكامل · 12 ساعة مع السائق', details: 'فخامة هادئة وتجربة راقية مع سائق خاص.', image: 'WhatsApp Image 2026-09-20 at 7.11.13 AM (2).jpeg', images: ['WhatsApp Image 2026-09-20 at 7.11.13 AM (2).jpeg', 'photo_2026-09-19_14-27-45.jpg', 'photo_2026-09-19_14-27-42.jpg'] },
    { key: 'sclass', name: 'مرسيدس S Class', number: 4, price: '2300', note: 'اليوم الكامل · 12 ساعة مع السائق', details: 'الفئة الملكية للمناسبات المهمة والتنقلات التنفيذية.', image: 'photo_2026-09-19_14-27-42.jpg', images: ['photo_2026-09-19_14-27-42.jpg', 'WhatsApp Image 2026-09-20 at 7.11.13 AM (2).jpeg', 'hero.jpg'], badge: 'فئة ملكية' },
    { key: 'staria', name: 'Staria Van', number: 4, price: '800', note: '100 ريال بالساعة داخل جدة · 800 ريال يوم كامل', details: 'سيارة واسعة للمجموعات؛ اليوم الكامل يشمل 12 ساعة مع السائق.', image: 'WhatsApp Image 2026-09-20 at 7.11.13 AM (3).jpeg', images: ['WhatsApp Image 2026-09-20 at 7.11.13 AM (3).jpeg', 'photo_2026-09-19_14-27-39.jpg', '70772683470.png'] },
  ],
  transferCars: [
    { key: 'transfer-taurus', name: 'فورد تورس', price: '250', note: 'اتجاه واحد', image: 'photo_2026-09-19_14-27-45.jpg', images: ['photo_2026-09-19_14-27-45.jpg', 'hero.jpg'], badge: 'عائلية مريحة' },
    { key: 'transfer-lexus', name: 'لكزس', price: '340', note: 'اتجاه واحد', image: 'WhatsApp Image 2026-09-20 at 7.11.13 AM (2).jpeg', images: ['WhatsApp Image 2026-09-20 at 7.11.13 AM (2).jpeg', 'photo_2026-09-19_14-27-42.jpg'] },
    { key: 'transfer-gmc', name: 'جمس (GMC)', price: '370', note: 'اتجاه واحد', image: 'photo_2026-09-19_14-27-39.jpg', images: ['photo_2026-09-19_14-27-39.jpg', 'Gemini_Generated_Image_qs51tfqs51tfqs51.jpg'], badge: 'عائلية واسعة' },
    { key: 'transfer-sclass', name: 'مرسيدس S Class', price: '1200', note: '12 ساعة', image: 'photo_2026-09-19_14-27-42.jpg', images: ['photo_2026-09-19_14-27-42.jpg', 'WhatsApp Image 2026-09-20 at 7.11.13 AM (2).jpeg'], badge: 'فئة ملكية' },
    { key: 'transfer-staria', name: 'Staria Van', price: '800', note: '12 ساعة', image: 'WhatsApp Image 2026-09-20 at 7.11.13 AM (3).jpeg', images: ['WhatsApp Image 2026-09-20 at 7.11.13 AM (3).jpeg', 'photo_2026-09-19_14-27-39.jpg'] },
  ],
  riyadhCars: [
    { key: 'riyadh-sclass', name: 'مرسيدس S Class', number: 4, price: '1000', note: 'اليوم الكامل (12 ساعة)', details: 'خدمة تنفيذية راقية لرجال الأعمال والمناسبات في الرياض.', image: 'photo_2026-09-19_14-27-42.jpg', images: ['photo_2026-09-19_14-27-42.jpg', 'WhatsApp Image 2026-09-20 at 7.11.13 AM (2).jpeg', 'hero.jpg'], badge: 'فئة ملكية' },
    { key: 'riyadh-lexus', name: 'لكزس ES', number: 4, price: '900', note: 'اليوم الكامل (12 ساعة)', details: 'راحة وهدوء للتنقل اليومي والاجتماعات في العاصمة.', image: 'WhatsApp Image 2026-09-20 at 7.11.13 AM (2).jpeg', images: ['WhatsApp Image 2026-09-20 at 7.11.13 AM (2).jpeg', 'photo_2026-09-19_14-27-45.jpg'], badge: 'تنفيذية' },
    { key: 'riyadh-gmc', name: 'جمس يوكن', number: 6, price: '1100', note: 'اليوم الكامل (12 ساعة)', details: 'مساحة واسعة للعائلات والوفود داخل الرياض.', image: 'photo_2026-09-19_14-27-39.jpg', images: ['photo_2026-09-19_14-27-39.jpg', 'Gemini_Generated_Image_qs51tfqs51tfqs51.jpg'], badge: 'عائلية واسعة' },
    { key: 'riyadh-escalade', name: 'كاديلاك إسكاليد', number: 6, price: '1300', note: 'اليوم الكامل (12 ساعة)', details: 'حضور فاخر للمناسبات والتنقلات الخاصة.', image: 'photo_2026-09-19_14-27-39.jpg', images: ['photo_2026-09-19_14-27-39.jpg', 'photo_2026-09-19_14-27-42.jpg', 'hero.jpg'], badge: 'فاخرة' },
  ],
  riyadhTransferCars: [
    { key: 'riyadh-tr-sclass', name: 'مرسيدس S Class', price: '350', note: 'مطار / داخل المدينة', image: 'photo_2026-09-19_14-27-42.jpg', images: ['photo_2026-09-19_14-27-42.jpg', 'hero.jpg'], badge: 'فئة ملكية' },
    { key: 'riyadh-tr-lexus', name: 'لكزس ES', price: '280', note: 'مطار / داخل المدينة', image: 'WhatsApp Image 2026-09-20 at 7.11.13 AM (2).jpeg', images: ['WhatsApp Image 2026-09-20 at 7.11.13 AM (2).jpeg'], badge: 'تنفيذية' },
    { key: 'riyadh-tr-gmc', name: 'جمس يوكن', price: '320', note: 'مطار / داخل المدينة', image: 'photo_2026-09-19_14-27-39.jpg', images: ['photo_2026-09-19_14-27-39.jpg'], badge: 'عائلية واسعة' },
    { key: 'riyadh-tr-escalade', name: 'كاديلاك إسكاليد', price: '400', note: 'مطار / داخل المدينة', image: 'photo_2026-09-19_14-27-39.jpg', images: ['photo_2026-09-19_14-27-39.jpg', 'photo_2026-09-19_14-27-42.jpg'], badge: 'فاخرة' },
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

/** Migrate legacy transfer/fleet order entries into a single `cities` section before tours. */
export function normalizeSectionOrder(order: string[] | undefined): SectionId[] {
  const allowed: SectionId[] = ['hero', 'cities', 'tours', 'contact'];
  const fallback: SectionId[] = [...defaultContent.sectionOrder];
  if (!order || order.length === 0) return fallback;

  const mapped = order
    .map((id) => (id === 'transfer' || id === 'fleet' ? 'cities' : id))
    .filter((id): id is SectionId => (allowed as string[]).includes(id));

  const unique: SectionId[] = [];
  for (const id of mapped) {
    if (!unique.includes(id)) unique.push(id);
  }

  for (const id of allowed) {
    if (!unique.includes(id)) {
      if (id === 'cities') {
        const toursIdx = unique.indexOf('tours');
        if (toursIdx >= 0) unique.splice(toursIdx, 0, 'cities');
        else unique.push('cities');
      } else {
        unique.push(id);
      }
    }
  }

  return unique;
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
    next.riyadhCars = syncGallery(next.riyadhCars || []);
    next.riyadhTransferCars = syncGallery(next.riyadhTransferCars || []);
    next.sectionOrder = normalizeSectionOrder(next.sectionOrder);
    if (!next.toursFeatures?.length) {
      next.toursFeatures = [...defaultContent.toursFeatures];
    }
    if (!next.riyadhCars?.length) next.riyadhCars = structuredClone(defaultContent.riyadhCars);
    if (!next.riyadhTransferCars?.length) {
      next.riyadhTransferCars = structuredClone(defaultContent.riyadhTransferCars);
    }
    await firstValueFrom(this.http.put<SiteContent>(`${API_BASE}/api/site-content`, next));
    this.content.set(next);
    this.error.set(null);
  }

  async saveSectionOrder(sectionOrder: SectionId[]): Promise<void> {
    const normalized = normalizeSectionOrder(sectionOrder);
    const res = await firstValueFrom(
      this.http.patch<{ ok: boolean; sectionOrder: SectionId[] }>(
        `${API_BASE}/api/site-content/section-order`,
        { sectionOrder: normalized }
      )
    );
    this.content.update((prev) => ({
      ...prev,
      sectionOrder: normalizeSectionOrder(res?.sectionOrder || normalized),
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
        const merged: SiteContent = {
          ...structuredClone(defaultContent),
          ...remote,
          citiesTitle: remote.citiesTitle || defaultContent.citiesTitle,
          citiesJeddahTitle: remote.citiesJeddahTitle || defaultContent.citiesJeddahTitle,
          citiesJeddahText: remote.citiesJeddahText || defaultContent.citiesJeddahText,
          citiesJeddahImage: remote.citiesJeddahImage || defaultContent.citiesJeddahImage,
          citiesRiyadhTitle: remote.citiesRiyadhTitle || defaultContent.citiesRiyadhTitle,
          citiesRiyadhText: remote.citiesRiyadhText || defaultContent.citiesRiyadhText,
          citiesRiyadhImage: remote.citiesRiyadhImage || defaultContent.citiesRiyadhImage,
          transferTabLabel: remote.transferTabLabel || defaultContent.transferTabLabel,
          fleetTabLabel: remote.fleetTabLabel || defaultContent.fleetTabLabel,
          toursSubtitle: remote.toursSubtitle || defaultContent.toursSubtitle,
          toursFeatures:
            remote.toursFeatures && remote.toursFeatures.length > 0
              ? remote.toursFeatures
              : defaultContent.toursFeatures,
          cars: normalizeCarImages(remote.cars, defaultContent.cars),
          transferCars: normalizeCarImages(remote.transferCars, defaultContent.transferCars),
          riyadhCars: normalizeCarImages(
            remote.riyadhCars?.length ? remote.riyadhCars : defaultContent.riyadhCars,
            defaultContent.riyadhCars,
          ),
          riyadhTransferCars: normalizeCarImages(
            remote.riyadhTransferCars?.length
              ? remote.riyadhTransferCars
              : defaultContent.riyadhTransferCars,
            defaultContent.riyadhTransferCars,
          ),
          sectionOrder: normalizeSectionOrder(remote.sectionOrder),
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
