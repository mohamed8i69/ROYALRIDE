import { ChangeDetectionStrategy, Component, afterNextRender, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';

/**
 * صفحة السياسات (الشروط والأحكام + الخصوصية + الحجز والإلغاء والاسترداد)
 * المسار المقترح: /policies
 * روابط مباشرة للأقسام: /policies#terms  /policies#privacy  /policies#cancellation  /policies#refund
 */
@Component({
  selector: 'app-policies',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './privacy.html',
  styleUrl : './privacy.css'
})
export class Privacy {
  private readonly doc = inject(DOCUMENT);
  private readonly route = inject(ActivatedRoute);

  readonly path = '/policies';
  readonly sections = [
    { id: 'terms', label: 'الشروط والأحكام العامة' },
    { id: 'privacy', label: 'سياسة الخصوصية وسرية المعلومات' },
    { id: 'cancellation', label: 'سياسة الحجز والإلغاء والاسترداد' },
    { id: 'refund', label: 'آلية الاسترداد المالي' },
    { id: 'contact', label: 'التواصل والدعم' },
  ];

  constructor() {
    inject(Title).setTitle('الشروط والأحكام وسياسة الخصوصية والإلغاء والاسترداد | الرحلة الملكية');
    inject(Meta).updateTag({
      name: 'description',
      content:
        'الشروط والأحكام، سياسة الخصوصية، وسياسة الحجز والإلغاء والاسترداد لخدمات الرحلة الملكية للنقل مع سائق.',
    });

    // يدعم الروابط المباشرة مثل /policies#privacy (من الفوتر أو من بوابة الدفع)
    afterNextRender(() => {
      const id = this.route.snapshot.fragment ?? this.doc.location.hash.slice(1);
      if (id) this.goTo(id);
    });
  }

  goTo(id: string, event?: Event): void {
    event?.preventDefault();
    const el = this.doc.getElementById(id);
    if (!el) return;

    const win = this.doc.defaultView;
    const reduceMotion = win?.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    el.focus({ preventScroll: true });
    win?.history.replaceState(win.history.state, '', `${this.path}#${id}`);
  }
}
