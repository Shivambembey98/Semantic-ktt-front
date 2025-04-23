import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AirCreateReservationService {
  private readonly STORAGE_KEY = 'airReservationFormData';

  setFormData(data: any) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  getFormData(): any {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  // clearFormData() {
  //   localStorage.removeItem(this.STORAGE_KEY);
  // }
}
