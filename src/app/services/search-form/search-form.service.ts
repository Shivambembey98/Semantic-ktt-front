import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { development_environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SearchFormService {
  // url = development_environment.apiUrl;
  lccUrl = development_environment.lccUrl;
  private selectedFlight: any = null;

  // Airport List
  private airportListSubject = new BehaviorSubject<any[]>([]);
  public airportList$ = this.airportListSubject.asObservable();
  
  constructor(private httpClient: HttpClient, private router: Router) {
    this.loadAirportData();
  }
  
  private loadAirportData() {
    this.httpClient.get<any[]>('/assets/airports.json').subscribe((data) => {      
      const formatted = data.map((airport) => ({
        ...airport,
        displayLabel: `${airport.airportCity} (${airport.iataCode})`, 
        iataCode: airport.iataCode,
        airportCity: airport.airportCity,
        airportName: airport.airportName,
      }));
      this.airportListSubject.next(formatted);
      // console.log('Loaded formatted airports:', formatted);
    });
  }
  
  getAirportByIata(iata: string): any | undefined {
    const list = this.airportListSubject.getValue();
    return list.find((a: { iataCode: string }) => a.iataCode === iata);
  }  

  // ✳️ Your existing API and flight storage methods below
  getAirports(query: string): Observable<any[]> {
    const params = new HttpParams().set('query', query);
    return this.httpClient.get<any[]>(`${this.lccUrl}/booking/search`, { params });
  }

  getAllLowCostCarrier(formData: any) {
    return this.httpClient.post(
      this.lccUrl + '/low-fare-search',
      formData,
      { responseType: 'text' as 'json' }
    );
  }

  getAirPrice(formData: any) {
    return this.httpClient.post(
      this.lccUrl + '/air-price',
      formData,
      { responseType: 'text' as 'json' }
    );
  }
  createAirReservation(formData: any): Observable<any> {
    return this.httpClient.post(
      `${this.lccUrl}/air-create-reservation`,
      formData,
      { responseType: 'text' as 'json' } // or 'json' if the backend sends JSON
    );
  }  

  setSelectedFlight(flight: any) {
    this.selectedFlight = flight;
    localStorage.setItem('selectedFlight', JSON.stringify(flight));
  }

  getSelectedFlight(): any {
    if (this.selectedFlight) return this.selectedFlight;

    const stored = localStorage.getItem('selectedFlight');
    if (stored) {
      this.selectedFlight = JSON.parse(stored);
      return this.selectedFlight;
    }
    return null;
  }

  clearSelectedFlight() {
    this.selectedFlight = null;
    localStorage.removeItem('selectedFlight');
  }
}