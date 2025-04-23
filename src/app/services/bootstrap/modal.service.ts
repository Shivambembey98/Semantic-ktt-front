import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  show(elementId: string): void {
    if (!this.isBrowser) return;

    const modalEl = document.getElementById(elementId);
    if (modalEl) {
      // Dynamically import Bootstrap only in browser
      import('bootstrap').then((bootstrap) => {
        const modalInstance = new bootstrap.Modal(modalEl);
        modalInstance.show();
      });
    }
  }

  hide(elementId: string): void {
    if (!this.isBrowser) return;

    const modalEl = document.getElementById(elementId);
    if (modalEl) {
      import('bootstrap').then((bootstrap) => {
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        modalInstance?.hide();
      });
    }
  }
}
