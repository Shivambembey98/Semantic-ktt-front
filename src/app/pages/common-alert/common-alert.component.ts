import { Component, Input,  Output, EventEmitter, AfterViewInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Modal } from 'bootstrap';
@Component({
  selector: 'app-common-alert',
  standalone: true,
  imports: [ CommonModule],
  templateUrl: './common-alert.component.html',
  styleUrl: './common-alert.component.css'
})
export class CommonAlertComponent implements AfterViewInit {
  @Input() message: string = 'Something went wrong!';
  @Output() closed = new EventEmitter<void>();

  ngAfterViewInit() {
    const modalEl = document.getElementById('commonAlertModal');
    if (modalEl) {
      modalEl.addEventListener('hidden.bs.modal', () => {
        this.closed.emit(); // Emit event after modal closes
      });
    }
  }

  show(message: string) {
    this.message = message;
    const modalEl = document.getElementById('commonAlertModal');
    if (modalEl) {
      const modalInstance = Modal.getOrCreateInstance(modalEl);
      modalInstance.show();
    }
  }
  
  close() {
    // Remove focus from any button or focused element inside modal
    const modalEl = document.getElementById('commonAlertModal');
    const activeEl = document.activeElement as HTMLElement;
    if (modalEl?.contains(activeEl)) {
      activeEl.blur(); // 👈 blur to remove focus
    }
  
    const modalInstance = Modal.getOrCreateInstance(modalEl!);
    modalInstance?.hide();
  }  
}
