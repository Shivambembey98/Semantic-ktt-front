import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import {
  RouterLink,
  ActivatedRoute,
  Router,
  NavigationStart,
  NavigationEnd,
  NavigationError,
} from '@angular/router';
import { CommonModule, NgIf, NgFor, } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SearchFormService } from '../../services/search-form/search-form.service';
import {
  FormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormArray
} from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonAlertComponent } from '../../pages/common-alert/common-alert.component';

@Component({
  selector: 'app-modify-search',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule, NgIf, NgFor],
  templateUrl: './modify-search.component.html',
  styleUrl: './modify-search.component.css',
})
export class ModifySearchComponent implements OnInit {
  @Input() isLoading: boolean = false;
  @Output() isLoadingChange = new EventEmitter<boolean>();

  today: string = new Date().toISOString().split('T')[0];
  minToDate: string = this.today;
  searchInput$ = new Subject<string>();

  updateMinToDate(): void {
    const fromDate = this.roundTripFormData.get('fromDate')?.value;
    this.minToDate = fromDate ? fromDate : this.today;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private searchFormService: SearchFormService,
    private cdr: ChangeDetectorRef
  ) { }
  specialFares = [
    { id: 'armedForces', label: 'Armed Forces' },
    { id: 'medicalProfessionals', label: 'Medical Professionals' },
    { id: 'seniorCitizens', label: 'Senior Citizens' },
    { id: 'students', label: 'Students' }
  ];
  selectedSpecialFare: string | null = null;

  passengerCounts: {
    adult: number;
    child: number;
    infant: number;
  } = {
    adult: 1,
    child: 0,
    infant: 0
  };

  activeFlightIndex: number = 0;

  get legs(): FormArray {
    return this.multiCityFormData.get('legs') as FormArray;
  }

  // Create a leg form group
  createLegFormGroup(): FormGroup {
    return this.formBuilder.group({
      origin: [null, Validators.required],
      destination: [null, Validators.required],
      fromDate: ['', Validators.required]
    });
  }
  // Add a new leg (max 5)
  addLeg(): void {
    if (this.legs.length < 5) {
      this.legs.push(this.createLegFormGroup());
      this.activeFlightIndex = this.legs.length - 1; // Set newly added flight as active
    }
  }

  removeLeg(index: number): void {
    if (this.legs.length > 1) {
      this.legs.removeAt(index);

      // Ensure the last available tab remains active
      if (index === this.activeFlightIndex) {
        this.activeFlightIndex = Math.max(0, this.legs.length - 1);
      }
    }
  }

  setActiveFlight(index: number): void {
    this.activeFlightIndex = index;
  }

  increment(type: 'adult' | 'child' | 'infant', event: Event): void {
    event.stopPropagation();
    if (type === 'adult' && this.passengerCounts.adult < 9) {
      this.passengerCounts.adult++;
    } else if (type === 'child' && this.passengerCounts.child < 9) {
      this.passengerCounts.child++;
    } else if (type === 'infant' && this.passengerCounts.infant < this.passengerCounts.adult) {
      this.passengerCounts.infant++;
    }
    this.updateFormsWithPassengerCounts();
  }

  decrement(type: 'adult' | 'child' | 'infant', event: Event): void {
    event.stopPropagation();
    if (type === 'adult' && this.passengerCounts.adult > 1) {
      this.passengerCounts.adult--;
      // Ensure infants don't exceed adults
      if (this.passengerCounts.infant > this.passengerCounts.adult) {
        this.passengerCounts.infant = this.passengerCounts.adult;
      }
    } else if (type === 'child' && this.passengerCounts.child >0) {
      this.passengerCounts.child--;
    } else if (type === 'infant' && this.passengerCounts.infant >0) {
      this.passengerCounts.infant--;
    }
    this.updateFormsWithPassengerCounts();
  }

  private updateFormsWithPassengerCounts(): void {
    const passengerUpdate = {
      adults: this.passengerCounts.adult,
      children: this.passengerCounts.child,
      infants: this.passengerCounts.infant
    };

    // Update all form types
    if (this.oneWayFormData && this.oneWayFormData.get('adults')) {
      this.oneWayFormData.patchValue({
        adults: passengerUpdate.adults,
        children: passengerUpdate.children,
        infants: passengerUpdate.infants
      }, { emitEvent: true });
    }
    if (this.roundTripFormData) {
      this.roundTripFormData.patchValue(passengerUpdate);
    }
    if (this.multiCityFormData) {
      this.multiCityFormData.patchValue(passengerUpdate);
    }
  }

  getPassengerSummary(): string {
    const currentForm = this.multiCityForm ? this.multiCityFormData :
                       this.roundTripForm ? this.roundTripFormData :
                       this.oneWayFormData;
    
    const adults = currentForm.get('adults')?.value || this.passengerCounts.adult;
    const children = currentForm.get('children')?.value || this.passengerCounts.child;
    const infants = currentForm.get('infants')?.value || this.passengerCounts.infant;
    
    return `${adults} Adult, ${children} Child, ${infants} Infant`;
  }

  isUpdating = false;

  modalMessage: string = '';
  showAlert(message: string) {
    this.modalMessage = message;
    const modalEl = document.getElementById('commonAlertModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  oneWayFormData: any = FormGroup;

  submitOneWayFormData() {
    if (this.oneWayFormData.invalid) {
      Object.keys(this.oneWayFormData.controls).forEach((field) => {
        this.oneWayFormData.controls[field].markAsTouched();
      });
      this.showAlert('Please fill out all required fields.');
      return;
    }
    
    this.isLoadingChange.emit(true);
    const formData = this.oneWayFormData.value;
    
    this.router.navigate(['/flight-search'], {
      queryParams: {
        ...formData,
        students: formData.students,
        armedForces: formData.armedForces,
        seniorCitizens: formData.seniorCitizens,
        medicalProfessionals: formData.medicalProfessionals,
        formType: 'one-way',
        activeTab: 'One Way'
      },
    });
  }

  roundTripFormData: any = FormGroup;

  submitRoundTripFormData() {
    if (this.roundTripFormData.invalid) {
      Object.keys(this.roundTripFormData.controls).forEach((field) => {
        this.roundTripFormData.controls[field].markAsTouched();
      });
      this.showAlert('Please fill out all required fields.');
      return;
    }

    this.isLoadingChange.emit(true);
    const formData = this.roundTripFormData.value;
    
    this.router.navigate(['/flight-search'], {
      queryParams: {
        ...formData,
        formType: 'round-trip',
      },
    });
  }

  multiCityFormData: any = FormGroup;

  submitMultiCityFormData(): void {
    if (this.multiCityFormData.invalid) {
      this.multiCityFormData.markAllAsTouched();
      this.showAlert('Please fill out all required fields.');
      return;
    }

    this.isLoadingChange.emit(true);
    const formData = this.multiCityFormData.value;
    
    this.router.navigate(['/flight-search'], {
      queryParams: {
        ...formData,
        legs: JSON.stringify(formData.legs),
        formType: 'multi-city',
      },
    });
  }

  formData: any = {}; // Holds the form data submitted
  formType: string = ''; // Will store the form type (either 'one-way' or 'round-trip')

  receivedOneWayFormData: any;
  receivedRoundTripFormData: any;
  receivedMultiCityFormData: any;

  selectAirport(event: any, field: string) {
    if (!event || !event.iataCode) return;

    const selectedCode = event.iataCode;

    // Update One Way and Round Trip
    if (field === 'origin') {
      this.oneWayFormData.patchValue({ origin: selectedCode });
      this.roundTripFormData.patchValue({ origin: selectedCode });
    } else if (field === 'destination') {
      this.oneWayFormData.patchValue({ destination: selectedCode });
      this.roundTripFormData.patchValue({ destination: selectedCode });
    }


    // Validate One Way
    const oneWayOrigin = this.oneWayFormData.value.origin;
    const oneWayDestination = this.oneWayFormData.value.destination;
    if (oneWayOrigin && oneWayDestination && oneWayOrigin === oneWayDestination) {
      alert(`The "From" and "To" fields for One Way cannot be the same.`);
      this.oneWayFormData.patchValue({ [field]: '' });
    }

    // Validate Round Trip
    const roundTripOrigin = this.roundTripFormData.value.origin;
    const roundTripDestination = this.roundTripFormData.value.destination;
    if (roundTripOrigin && roundTripDestination && roundTripOrigin === roundTripDestination) {
      alert(`The "From" and "To" fields for Round Trip cannot be the same.`);
      this.roundTripFormData.patchValue({ [field]: '' });
    }
  }

  selectAirport2(event: any, field: string) {
    if (!event || !event.iataCode) return;
    const selectedCode = event.iataCode;

    // Handle active Multi-City leg
    const legsArray = this.multiCityFormData.get('legs') as FormArray;
    const currentLeg = legsArray.at(this.activeFlightIndex) as FormGroup;

    // First, patch the current field value
    currentLeg.patchValue({ [field]: selectedCode });

    // Then, validate the current leg's from and to
    const currentLegValues = currentLeg.value;
    if (
      currentLegValues.origin &&
      currentLegValues.destination &&
      currentLegValues.origin === currentLegValues.destination
    ) {
      alert(`The "From" and "To" fields in leg ${this.activeFlightIndex + 1} cannot be the same.`);
      // Reset only the field user just selected
      currentLeg.patchValue({ [field]: '' });
    }
  }

  listOfAirports: any[] = [];

  loadAirports(query: string): void {
    this.searchFormService.getAirports(query).subscribe(
      (data) => {
        // Map the response to include a `displayLabel` field
        this.listOfAirports = data.map(airport => ({
          ...airport,
          displayLabel: `${airport.iataCode} - ${airport.airportCity}`
        }));
      },
      (error) => {
        console.error('Error loading airports', error);
      }
    );
  }

  ngOnInit(): void {
    this.searchInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(query => {
        this.loadAirports(query ?? '');
      });

    this.loadAirports('');

    this.route.queryParams.subscribe((params) => {
      this.formType = params['formType'] || 'one-way'; // Default to 'one-way'

      // Call the toggle function to update the UI state
      this.toggleFormByType(this.formType);
      this.passengerCounts.adult = +params['adults'] || 1;
      this.passengerCounts.child = +params['children'] || 0;
      this.passengerCounts.infant = +params['infants'] || 0;
      

      // Initialize Forms
      this.oneWayFormData = this.formBuilder.group({
        origin: ['', Validators.required],
        destination: ['', Validators.required],
        fromDate: ['', Validators.required],
        toDate: [null],
        adults: [this.passengerCounts.adult, Validators.required],
        children: [this.passengerCounts.child, Validators.required],
        infants: [this.passengerCounts.infant, Validators.required],
        routes: ['Non Stop', Validators.required],
        class: ['Economy', Validators.required],
        students: params['students'] || '0',
        armedForces: params['armedForces'] || '0',
        seniorCitizens: params['seniorCitizens'] || '0',
        medicalProfessionals: params['medicalProfessionals'] || '0'
      });

      this.roundTripFormData = this.formBuilder.group({
        origin: [null, Validators.required],
        destination: [null, Validators.required],
        fromDate: ['', Validators.required],
        toDate: ['', Validators.required],
        adults: [this.passengerCounts.adult, Validators.required],
        children: [this.passengerCounts.child, Validators.required],
        infants: [this.passengerCounts.infant, Validators.required],
        routes: ['Non Stop', Validators.required],
        class: ['Economy', Validators.required],
        students: params['students'] || '0',
        armedForces: params['armedForces'] || '0',
        seniorCitizens: params['seniorCitizens'] || '0',
        medicalProfessionals: params['medicalProfessionals'] || '0'
      });

      this.multiCityFormData = this.formBuilder.group({
        legs: this.formBuilder.array([this.createLegFormGroup()]), // Default one leg
        adults: [1, [Validators.required, Validators.min(1)]],
        infants: [0, [Validators.required, Validators.min(0)]],
        children: [0, [Validators.required, Validators.min(0)]],
        routes: ['Non Stop', Validators.required],
        class: ['Economy', Validators.required],
        students: params['students'] || '0',
        armedForces: params['armedForces'] || '0',
        seniorCitizens: params['seniorCitizens'] || '0',
        medicalProfessionals: params['medicalProfessionals'] || '0'
      });

      // Sync One Way and Round Trip forms
      this.oneWayFormData.valueChanges.subscribe((value: { origin: any; destination: any; fromDate: any; toDate: any; }) => {
        if (!this.isUpdating) {
          this.isUpdating = true;
          this.roundTripFormData.patchValue({
            origin: value.origin,
            destination: value.destination,
            fromDate: value.fromDate,
            toDate: value.toDate,
          });
          this.isUpdating = false;
        }
      });

      this.roundTripFormData.valueChanges.subscribe((value: { origin: any; destination: any; fromDate: any; toDate: any; }) => {
        if (!this.isUpdating) {
          this.isUpdating = true;
          this.oneWayFormData.patchValue({
            origin: value.origin,
            destination: value.destination,
            fromDate: value.fromDate,
            toDate: value.toDate,
          });
          this.isUpdating = false;
        }
      });
      // Initialize the appropriate form based on formType
      switch (this.formType) {
        case 'one-way':
          this.setFormData(this.oneWayFormData, params);
          break;
        case 'round-trip':
          this.setFormData(this.roundTripFormData, params);
          break;
        case 'multi-city':
          this.setFormData(this.multiCityFormData, params);
          break;
      }
    });
  }
  toggleSpecialFare(fareId: string): void {
    if (this.selectedSpecialFare === fareId) {
      this.selectedSpecialFare = null;
      this.specialFares.forEach(fare => {
        if (this.oneWayForm) {
          this.oneWayFormData.get(fare.id)?.setValue('0');
        } else if (this.roundTripForm) {
          this.roundTripFormData.get(fare.id)?.setValue('0');
        } else if (this.multiCityForm) {
          this.multiCityFormData.get(fare.id)?.setValue('0');
        }
      });
    } else {
      this.selectedSpecialFare = fareId;
      this.specialFares.forEach(fare => {
        const value = fare.id === fareId ? '1' : '0';
        if (this.oneWayForm) {
          this.oneWayFormData.get(fare.id)?.setValue(value);
        } else if (this.roundTripForm) {
          this.roundTripFormData.get(fare.id)?.setValue(value);
        } else if (this.multiCityForm) {
          this.multiCityFormData.get(fare.id)?.setValue(value);
        }
      });
    }
  }

  isSpecialFareSelected(fareId: string): boolean {
    if (this.oneWayForm) {
      return this.oneWayFormData.get(fareId)?.value === '1';
    } else if (this.roundTripForm) {
      return this.roundTripFormData.get(fareId)?.value === '1';
    } else if (this.multiCityForm) {
      return this.multiCityFormData.get(fareId)?.value === '1';
    }
    return false;
  }

  private setFormData(form: FormGroup, params: any) {
    if (params['formType']) {
      this.formType = params['formType']; // Store form type globally
    }

    if (this.formType === 'multi-city' && params['legs']) {
      const legsArray = this.multiCityFormData.get('legs') as FormArray;
      const parsedLegs = JSON.parse(params.legs);

      // Clear existing legs
      while (legsArray.length) {
        legsArray.removeAt(0);
      }

      // Add legs dynamically
      parsedLegs.forEach((leg: any) => {
        legsArray.push(this.formBuilder.group({
          origin: [leg.origin || '', Validators.required],
          destination: [leg.destination || '', Validators.required],
          fromDate: [leg.fromDate || '', Validators.required],
          // toDate: [leg.toDate || '', Validators.required],
        }));
      });

      form.patchValue({
        adults: params['adults'] || 1,
        children: params['children'] || 0,
        infants: params['infants'] || 0,
        routes: params['routes'] || 'Non Stop',
        class: params['class'] || 'Economy'
      });

    } else if (this.formType === 'round-trip') {
      form.patchValue({
        origin: params['origin'] || '',
        destination: params['destination'] || '',
        fromDate: params['fromDate'] || '',
        toDate: params['toDate'] || '',  // Ensure round-trip toDate is included
        adults: params['adults'] || 1,
        children: params['children'] || 0,
        infants: params['infants'] || 0,
        routes: params['routes'] || 'Non Stop',
        class: params['class'] || 'Economy'
      });

    } else { // One-way case
      form.patchValue({
        origin: params['origin'] || '',
        destination: params['destination'] || '',
        fromDate: params['fromDate'] || '',
        toDate: null,  // One-way should not have toDate
        adults: params['adults'] || 1,
        children: params['children'] || 0,
        infants: params['infants'] || 0,
        routes: params['routes'] || 'Non Stop',
        class: params['class'] || 'Economy'
      });
    }
  }

  // Form dropdown
  activeTab: string = 'One Way';  // Default active tab
  dropdownOpen: boolean = false; // Controls dropdown visibility

  oneWayForm: boolean = true;
  roundTripForm: boolean = false;
  multiCityForm: boolean = false;

  toggleFormByType(tabType: string) {
    this.oneWayForm = tabType === 'one-way';
    this.roundTripForm = tabType === 'round-trip';
    this.multiCityForm = tabType === 'multi-city';
    this.activeTab = tabType === 'one-way' ? 'One Way' : tabType === 'round-trip' ? 'Round Trip' : 'Multi City';
  }

  toggleOneWayTrip() {
    if (this.roundTripForm || this.multiCityForm) {
      this.oneWayForm = true;
      this.roundTripForm = false;
      this.multiCityForm = false;
      this.activeTab = 'One Way';
    }
  }

  toggleRoundTrip() {
    if (this.oneWayForm || this.multiCityForm) {
      this.roundTripForm = true;
      this.oneWayForm = false;
      this.multiCityForm = false;
      this.activeTab = 'Round Trip';
    }
  }
  onSearch(term: string): void {
    this.searchInput$.next(term)
  }

  toggleMultiCity() {
    if (this.oneWayForm || this.roundTripForm) {
      this.multiCityForm = true;
      this.oneWayForm = false;
      this.roundTripForm = false;
      this.activeTab = 'Multi City';
    }
  }
  // getUsers() {
  //   this.flightBookingService.getAllUsers().subscribe({
  //     next: (response: any) => {
  //       console.log('Users--', response);
  //     },
  //     error: (error: any) => {
  //       console.log('Error fetching users--', error);
  //     },
  //   });
  // }
}
