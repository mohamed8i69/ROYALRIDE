import { Component, input, output, signal, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface LightboxData {
  images: string[];
  name: string;
  initialIndex?: number;
}

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-car-lightbox',
  templateUrl: './car-lightbox.html',
})
export class CarLightbox {
  /** The lightbox data containing images list and car name. Pass `null` to hide. */
  readonly data = input<LightboxData | null>(null);

  /** Emitted when the user requests to close the lightbox. */
  readonly close = output<void>();

  readonly currentIndex = signal<number>(0);

  constructor() {
    effect(() => {
      const currentData = this.data();
      if (currentData) {
        this.currentIndex.set(currentData.initialIndex || 0);
      }
    });
  }

  get images(): string[] {
    const d = this.data();
    if (!d) return [];
    if (d.images && d.images.length > 0) return d.images;
    return [];
  }

  get currentImageSrc(): string {
    const list = this.images;
    const idx = this.currentIndex();
    return list[idx] || '';
  }

  nextImage(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    const list = this.images;
    if (list.length <= 1) return;
    this.currentIndex.update((i) => (i + 1) % list.length);
  }

  prevImage(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    const list = this.images;
    if (list.length <= 1) return;
    this.currentIndex.update((i) => (i - 1 + list.length) % list.length);
  }

  selectImage(index: number, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (index >= 0 && index < this.images.length) {
      this.currentIndex.set(index);
    }
  }

  dismiss(): void {
    this.close.emit();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (!this.data()) return;

    if (event.key === 'Escape') {
      this.dismiss();
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      this.nextImage();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      this.prevImage();
    }
  }
}
