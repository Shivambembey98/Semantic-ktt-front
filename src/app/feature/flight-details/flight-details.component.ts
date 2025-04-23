import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SearchFormService } from '../../services/search-form/search-form.service';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormArray,
  FormsModule,
} from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { AirCreateReservationService } from '../../services/air-create-reservation/air-create-reservation.service';

@Component({
  selector: 'app-flight-details',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule, FormsModule, NgIf],
  templateUrl: './flight-details.component.html',
  styleUrls: ['./flight-details.component.css'],
})
export class FlightDetailsComponent implements OnInit {
  passengerForm: any = FormGroup;
  submitted = false;
  searchFormData: any = null;
  selectedPassengerType: string = 'adult';
  flight: any = null;
  departureFlight: any = null;
  arrivalFlight: any = null;
  departureAirport: any = null;
  arrivalAirport: any = null;
  baggageCarryOnFormatted: string = '';
  baggageCheckedFormatted: string = '';
  totalBaggagePieces: string = '';
  returnBaggageCarryOnFormatted: string = '';
  returnBaggageCheckedFormatted: string = '';
  returnDepartureAirport: any = null;
  returnArrivalAirport: any = null;
  passengerLabels: any = {
    adult: 'Adult (12+)',
    child: 'Child (2-12)',
    infant: 'Infant (0-2)',
    student: 'Student',
    seniorCitizen: 'Senior Citizen',
  };
  baseFare: number = 0;
taxes: number = 0;
returnBaseFare: number = 0;
returnTaxes: number = 0;
totalBaseFare: number = 0;
totalTaxes: number = 0;
totalFare: number = 0;
formData: any = {};


getAirportByIata(iata: string): any {
  return this.searchFormService.getAirportByIata(iata);
}

  constructor(
    private formbuilder: FormBuilder,
    private searchFormService: SearchFormService,
    private router: Router,
    private airCreateReservationService: AirCreateReservationService
  ) {
    // Initialize the passenger form group structure
    this.passengerForm = this.formbuilder.group({
      passengers: this.formbuilder.array([]), // Will hold dynamic passenger forms
      contactInfo: this.formbuilder.group({
        email: ['', [Validators.required, Validators.email]],
        mobilePhone: [
          '',
          [Validators.required, Validators.pattern(/^\d{10}$/)],
        ],
      }),
    });
  }

  // Getters to access form controls
  get f(): { [key: string]: any } {
    return this.passengerForm.controls;
  }

  get passengers(): FormArray {
    return this.passengerForm.get('passengers') as FormArray;
  }

  // Function to create a new passenger form group
  createPassengerForm(type: string): FormGroup {
    return this.formbuilder.group({
      passengerType: [type],
      title: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      nationality: ['', Validators.required],
      gender: ['', Validators.required],
    });
  }

  // Function to add passengers based on the form data
  addPassengersByCount(data: any): void {
    const passengerTypes = [
      { type: 'adult', count: +data.adults || 0 },
      { type: 'child', count: +data.children || 0 },
      { type: 'infant', count: +data.infants || 0 },
      { type: 'student', count: +data.students || 0 },
      { type: 'seniorCitizen', count: +data.seniorCitizens || 0 },
    ];

    const passengerArray = this.passengers;
    passengerArray.clear(); // Clear the existing passengers

    // Add passengers based on the count
    for (const group of passengerTypes) {
      for (let i = 0; i < group.count; i++) {
        const passenger = this.createPassengerForm(group.type);
        passengerArray.push(passenger);
      }
    }
  }
  // Helper Functions
  mapPassengerType(type: string): string {
    switch (type) {
      case 'adult':
        return 'ADT';
      case 'child':
        return 'CHD';
      case 'infant':
        return 'INF';
      case 'student':
        return 'STD';
      case 'seniorCitizen':
        return 'SRC';
      default:
        return 'ADT';
    }
  }
  formatDOB(date: string, returnInFormat = false): string {
    const dob = new Date(date);
    const yyyy = dob.getFullYear();
    const mm = dob.toLocaleString('default', { month: 'short' }).toUpperCase();
    const dd = String(dob.getDate()).padStart(2, '0');

    return returnInFormat
      ? `${dd}${mm}${String(yyyy).slice(-2)}`
      : dob.toISOString().split('T')[0];
  }

  // Function to handle form submission
  onSubmit(): void {
    this.submitted = true;
  
    if (this.passengerForm.invalid) {
      console.warn('Form is invalid:', this.passengerForm.errors);
      return;
    }
  
    const formValue = this.passengerForm.value;
  
    const travelDtoList = formValue.passengers.map((p: any) => ({
      firstName: p.firstName,
      lastName: p.lastName,
      prefix: p.title,
      gender: p.gender === 'Male' ? 'M' : 'F',
      travelerType: this.mapPassengerType(p.passengerType),
      phoneNumber: formValue.contactInfo.mobilePhone,
      email: formValue.contactInfo.email,
      dob: this.formatDOB(p.dateOfBirth),
      docText: `P/IN/A1234567/IN/15JAN30/${p.gender === 'Male' ? 'M' : 'F'}/${this.formatDOB(p.dateOfBirth, true)}/${p.firstName.toUpperCase()}/${p.lastName.toUpperCase()}`
    }));
  
    this.formData = {
      travelDtoList,
      street: '456 Park Avenue',
      city: 'Mumbai',
      state: 'MH',
      postalCode: '400001',
      country: 'IN',
      sessionIdLfs: '',
      sessionIdAirPrice: '',
    };
  
    console.log('Form Submitted:', formValue);
    console.log('Payload to be sent:', this.formData);
  
    // Trigger modal open here
    // this.showModal = true;
  
    this.searchFormService.createAirReservation(this.formData).subscribe({
      next: (res) => {
        console.log('Reservation Success:', res);
      },
      error: (err) => {
        console.error('Reservation Error:', err);
      }
    });
  }
  

  ngOnInit(): void {
    // Get the selected flight from the service
    this.flight = this.searchFormService.getSelectedFlight();
    console.log(this.flight, 'selected flight');

    // Handle case when no flight data is available
    if (!this.flight) {
      console.warn('No flight data found, redirecting...');
      return;
    }

    // Load search form data from localStorage if available
    const storedForm = localStorage.getItem('flightFormData');
    if (storedForm) {
      this.searchFormData = JSON.parse(storedForm);
      console.log('Search Form Data:', this.searchFormData);
    } else {
      console.warn('No search form data found in localStorage');
    }

    // Add passengers based on the data from localStorage
    if (this.searchFormData) {
      this.addPassengersByCount(this.searchFormData);
    }

    // Check if it's a round-trip or one-way trip
    if (Array.isArray(this.flight) && this.flight.length === 2) {
      this.departureFlight = this.flight[0];
      this.arrivalFlight = this.flight[1];
  
      const departureFare = Number(this.departureFlight?.fare?.base ?? this.departureFlight?.basePrice ?? 0);
      const arrivalFare = Number(this.arrivalFlight?.fare?.base ?? this.arrivalFlight?.basePrice ?? 0);
  
      const departureTax = Number(this.departureFlight?.fare?.tax ?? this.departureFlight?.taxes ?? 0);
      const arrivalTax = Number(this.arrivalFlight?.fare?.tax ?? this.arrivalFlight?.taxes ?? 0);
  
      this.totalBaseFare = departureFare + arrivalFare;
      this.totalTaxes = departureTax + arrivalTax;
    } else {
      this.departureFlight = this.flight;
      this.totalBaseFare = Number(this.departureFlight?.fare?.base ?? this.departureFlight?.basePrice ?? 0);
      this.totalTaxes = Number(this.departureFlight?.fare?.tax ?? this.departureFlight?.taxes ?? 0);
    }
  
    this.totalFare = this.totalBaseFare + this.totalTaxes;
    // Subscribe to airport list to get departure and arrival airports
    this.searchFormService.airportList$.subscribe((airports) => {
      if (!airports.length) return;

      if (this.departureFlight) {
        this.departureAirport = airports.find(
          (a) => a.iataCode === this.departureFlight.departure
        );
        this.arrivalAirport = airports.find(
          (a) => a.iataCode === this.departureFlight.arrival
        );
      }

      if (this.arrivalFlight) {
        this.returnDepartureAirport = airports.find(
          (a) => a.iataCode === this.arrivalFlight.departure
        );
        this.returnArrivalAirport = airports.find(
          (a) => a.iataCode === this.arrivalFlight.arrival
        );
      }
    });

    // Format baggage details
    if (this.departureFlight?.baggageCarryOn) {
      this.baggageCarryOnFormatted = this.getFormattedBaggageDetail(
        this.departureFlight.baggageCarryOn
      );
    }
    if (this.departureFlight?.baggageChecked) {
      this.baggageCheckedFormatted = this.getFormattedBaggageDetail(
        this.departureFlight.baggageChecked
      );
    }
    if (this.arrivalFlight?.baggageCarryOn) {
      this.returnBaggageCarryOnFormatted = this.getFormattedBaggageDetail(
        this.arrivalFlight.baggageCarryOn
      );
    }
    if (this.arrivalFlight?.baggageChecked) {
      this.returnBaggageCheckedFormatted = this.getFormattedBaggageDetail(
        this.arrivalFlight.baggageChecked
      );
    }
  }

  // Helper function to get formatted city name from IATA code
  getCityName(iata: string): string {
    const airport = this.searchFormService.getAirportByIata(iata);
    return airport?.airportCity || iata;
  }

  // Helper function to get formatted layover details
  getLayoverText(layovers: { [key: string]: number }): string {
    if (!layovers || Object.keys(layovers).length === 0) return 'No layover';
    const [airport, minutes] = Object.entries(layovers)[0];
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${airport} - ${hours} hrs ${mins} mins Layover`;
  }

  // Function to format baggage details
  getFormattedBaggageDetail(baggageTexts: string[]): string {
    if (!Array.isArray(baggageTexts) || baggageTexts.length === 0) return 'N/A';

    let pieces: number | null = null;
    let weightInKg: string | null = null;

    for (let text of baggageTexts) {
      const trimmed = text.trim();

      // Extract piece info like 1P, 2P
      if (pieces === null && /^[0-9]+P$/i.test(trimmed)) {
        const match = trimmed.match(/^([0-9]+)P$/i);
        if (match) {
          pieces = parseInt(match[1], 10);
        }
      }

      // Extract weight like 23KG, 25K, etc.
      if (!weightInKg) {
        const kgMatch = trimmed.match(/([0-9]+)(K(G)?)/i);
        if (kgMatch) {
          weightInKg = `${kgMatch[1]}Kgs`;
        }
      }
    }

    const pcs = pieces !== null ? pieces : 1;
    if (weightInKg) {
      return `${weightInKg} (${pcs} Piece${
        pcs > 1 ? 's' : ''
      } * ${weightInKg})`;
    }

    return 'N/A';
  }
}