import { Component, input, output } from '@angular/core';

export interface LightboxImage {
  src: string;
  name: string;
}

@Component({
  standalone: true,
  selector: 'app-car-lightbox',
  templateUrl: './car-lightbox.html',
})
export class CarLightbox {
  /** The image to display. Pass `null` to hide the lightbox. */
  readonly image = input<LightboxImage | null>(null);

  /** Emitted when the user requests to close the lightbox. */
  readonly close = output<void>();

  dismiss(): void {
    this.close.emit();
  }
}
