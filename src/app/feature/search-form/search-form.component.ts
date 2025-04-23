import { Component, computed, OnInit } from '@angular/core';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { Options } from '@angular-slider/ngx-slider';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  FormControl,
  FormArray,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule, NgIf, NgFor, AsyncPipe } from '@angular/common';
import { SearchFormService } from '../../services/search-form/search-form.service';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { query } from '@angular/animations';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonAlertComponent } from '../../pages/common-alert/common-alert.component';
import { AppCarouselComponent } from '../../pages/components/app-carousel/app-carousel.component';
import { AppFlightTypeTabsComponent } from '../../pages/components/app-flight-type-tabs/app-flight-type-tabs.component';
import { AppCommonFlightFieldsComponent } from '../../pages/components/app-common-flight-fields/app-common-flight-fields.component';
import { AppMultiCityFieldsComponent } from '../../pages/components/app-multi-city-fields/app-multi-city-fields.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-search-form',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    NgxSliderModule,
    NgSelectModule,
    NgIf,
    AppCarouselComponent,
    AppFlightTypeTabsComponent,
    AppCommonFlightFieldsComponent,
    AppMultiCityFieldsComponent,
  ],
  templateUrl: './search-form.component.html',
  styleUrl: './search-form.component.css',
})
export class SearchFormComponent implements OnInit {

  today: string = new Date().toISOString().split('T')[0];
  minToDate: string = this.today;
  searchInput$ = new Subject<string>();


  updateMinToDate(): void {
    const fromDate = this.roundTripFormData.get('fromDate')?.value;
    this.minToDate = fromDate ? fromDate : this.today;
  }

  constructor(
    private formBuilder: FormBuilder,
    private searchFormService: SearchFormService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  activeFlightIndex: number = 0;

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

  selectAirport2(event: any, field: string): void {
    if (!event || !event.iataCode) return;

    const selectedCode = event.iataCode;
    const legsArray = this.multiCityFormData.get('legs') as FormArray;
    const currentLeg = legsArray.at(this.activeFlightIndex) as FormGroup;

    // Patch the selected airport
    currentLeg.patchValue({ [field]: selectedCode });

    // Validate origin and destination are different
    const currentLegValues = currentLeg.value;
    if (currentLegValues.origin &&
      currentLegValues.destination &&
      currentLegValues.origin === currentLegValues.destination) {
      alert(`The "From" and "To" fields in leg ${this.activeFlightIndex + 1} cannot be the same.`);
      currentLeg.patchValue({ [field]: '' });
    }
  }

  // Method to set active flight index
  setActiveFlightIndex(index: number): void {
    const legsArray = this.multiCityFormData.get('legs') as FormArray;
    if (index >= 0 && index < legsArray.length) {
      this.activeFlightIndex = index;
    }
  }

  // Method to add new leg
  // addLeg(): void {
  //   const legs = this.multiCityFormData.get('legs') as FormArray;
  //   legs.push(this.createLegFormGroup());
  // }

  // Method to remove leg
  // removeLeg(index: number): void {
  //   const legs = this.multiCityFormData.get('legs') as FormArray;
  //   if (legs.length > 1) {
  //     legs.removeAt(index);
  //     if (this.activeFlightIndex >= legs.length) {
  //       this.activeFlightIndex = legs.length - 1;
  //     }
  //   }
  // }

  // Helper method to create a new leg form group
  // private createLegFormGroup(): FormGroup {
  //   return this.formBuilder.group({
  //     origin: [null, Validators.required],
  //     destination: [null, Validators.required],
  //     fromDate: ['', Validators.required]
  //   });
  // }


  listOfAirports: any[] = [];

  // Multicity add flight tabs
  // Signal for easy access to legs array
  get legs(): FormArray {
    return this.multiCityFormData.get('legs') as FormArray;
  }

  // Create a leg form group
  createLegFormGroup(initialValues: any = null): FormGroup {
    return this.formBuilder.group({
      origin: [initialValues?.origin || null, Validators.required],
      destination: [initialValues?.destination || null, Validators.required],
      fromDate: [initialValues?.fromDate || '', Validators.required]
    });
  }
  // Add a new leg (max 5)
  addLeg(initialValues: any = null): void {
    const legsArray = this.multiCityFormData.get('legs') as FormArray;
    if (legsArray.length < 5) {
      const newLeg = this.createLegFormGroup(initialValues);
      legsArray.push(newLeg);
      this.activeFlightIndex = legsArray.length - 1;

      // Update form validity
      this.multiCityFormData.updateValueAndValidity();
    }
  }

  removeLeg(index: number): void {
    if (this.legs.length > 1) {
      const legsArray = this.multiCityFormData.get('legs') as FormArray;

      // Remove the leg
      legsArray.removeAt(index);

      // Update form validity
      this.multiCityFormData.updateValueAndValidity();

      // Adjust active flight index if needed
      if (this.activeFlightIndex >= legsArray.length) {
        this.activeFlightIndex = legsArray.length - 1;
      }

      // Reindex remaining legs if needed
      const remainingLegs = legsArray.controls;
      remainingLegs.forEach((leg, idx) => {
        // Update any index-dependent values if needed
        // For example, if you store the leg number somewhere
      });
    }
  }

  setActiveFlight(index: number): void {
    this.activeFlightIndex = index;
  }

  passengerCounts = {
    adult: 1,
    child: 0,
    infant: 0,
  };

  increment(type: 'adult' | 'child' | 'infant', event: Event): void {
    event.stopPropagation();
    this.passengerCounts[type]++;
  }

  decrement(type: 'adult' | 'child' | 'infant', event: Event): void {
    event.stopPropagation();
    if (this.passengerCounts[type] > 0) {
      this.passengerCounts[type]--;
    }
  }

  getPassengerSummary() {
    return ` ${this.passengerCounts.adult} Adult, ${this.passengerCounts.child} Child, ${this.passengerCounts.infant} Infant`;
  }

  toggleDropdown(event: MouseEvent): void {
    // Check if the click is on the dropdown toggle button (this prevents closing when clicking the button)
    const dropdownMenu = document.querySelector('.dropdown-menu') as HTMLElement;
    const dropdownButton = document.getElementById('passengerDropdown') as HTMLElement;

    // Toggle dropdown manually if click is not on an increment/decrement button
    if (!dropdownMenu.contains(event.target as Node) && event.target !== dropdownButton) {
      return;  // Don't close the dropdown when clicking on the buttons
    }

  }

  // Origin and destination
  selectedOrigin: string | undefined;
  selectedDestination: string | undefined;

  // Method to swap the values of origin and destination
  swapSelection() {
    // Swap logic for One Way Form
    if (this.oneWayFormData) {
      const origin = this.oneWayFormData.get('origin').value;
      const destination = this.oneWayFormData.get('destination').value;
      this.oneWayFormData.patchValue({
        origin: destination,
        destination: origin
      });
    }
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
    if (this.oneWayFormData.valid) {
      const formData = this.oneWayFormData.value;
      
      const payload = {
        origin: formData.origin,
        destination: formData.destination,
        fromDate: formData.fromDate,
        adults: formData.adults,
        children: formData.children,
        infants: formData.infants,
        routes: formData.routes,
        class: formData.class,
        formType: 'one-way',
        // Include special fares directly
        students: formData.students,
        armedForces: formData.armedForces,
        seniorCitizens: formData.seniorCitizens,
        medicalProfessionals: formData.medicalProfessionals
      };

      localStorage.setItem('flightFormData', JSON.stringify(payload));
      console.log('Saving form to localStorage:', payload);
      this.router.navigate(['/flight-search'], {
        queryParams: payload
      });
    }
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

    const formData = {
      ...this.roundTripFormData.value,
      formType: 'round-trip'
    };

    localStorage.setItem('flightFormData', JSON.stringify(formData));
    this.router.navigate(['/flight-search'], {
      queryParams: formData
    });
  }

  multiCityFormData: any = FormGroup;
  submitMultiCityFormData(): void {
    if (this.multiCityFormData.invalid) {
      this.multiCityFormData.markAllAsTouched(); // This is key
      this.showAlert('Please fill out all required fields.');
      return;
    }
    const formData = this.multiCityFormData.value;
    localStorage.setItem('flightFormData', JSON.stringify(formData));
    this.router.navigate(['/flight-search'], {
      queryParams: {
        ...formData,
        legs: JSON.stringify(formData.legs),
        formType: 'multi-city',
      },
    });
  }

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

  handleReturnDateSelection(): void {
    if (this.oneWayForm) {
      // Switch to round trip
      this.toggleRoundTrip();
      
      // Sync the forms
      const oneWayValues = this.oneWayFormData.value;
      this.roundTripFormData.patchValue({
        origin: oneWayValues.origin,
        destination: oneWayValues.destination,
        fromDate: oneWayValues.fromDate,
        toDate: oneWayValues.toDate,
        adults: oneWayValues.adults,
        children: oneWayValues.children,
        infants: oneWayValues.infants,
        routes: oneWayValues.routes,
        class: oneWayValues.class,
        students: oneWayValues.students,
        armedForces: oneWayValues.armedForces,
        seniorCitizens: oneWayValues.seniorCitizens,
        medicalProfessionals: oneWayValues.medicalProfessionals
      });

      // Update form type in the URL
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { formType: 'round-trip' },
        queryParamsHandling: 'merge'
      });
    }
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

    this.oneWayFormData = this.formBuilder.group({
      origin: [null, Validators.required],
      destination: [null, Validators.required],
      fromDate: ['', Validators.required],
      toDate: [''], // Add this line to include toDate in one-way form
      adults: [1, Validators.required],
      children: [0, Validators.required],
      infants: [0, Validators.required],
      routes: ['Non Stop', Validators.required],
      class: ['Economy', Validators.required],
      // Add individual controls for each special fare
      students: ['0'],
      armedForces: ['0'],
      seniorCitizens: ['0'],
      medicalProfessionals: ['0']
    });

    // Handle query params for form population
    this.route.queryParams.subscribe(params => {
      if (Object.keys(params).length > 0) {
        const formType = params['formType'];
        if (formType === 'one-way') {
          this.oneWayFormData.patchValue({
            origin: params['origin'] || null,
            destination: params['destination'] || null,
            fromDate: params['fromDate'] || '',
            toDate: params['toDate'] || null,
            adults: +params['adults'] || 1,
            children: +params['children'] || 0,
            infants: +params['infants'] || 0,
            routes: params['routes'] || 'Non Stop',
            class: params['class'] || 'Economy',
            students: params['students'] || '0',
            armedForces: params['armedForces'] || '0',
            seniorCitizens: params['seniorCitizens'] || '0',
            medicalProfessionals: params['medicalProfessionals'] || '0'
          });
          this.toggleOneWayTrip();
        }

        if (formType === 'round-trip') {
          this.roundTripFormData.patchValue({
            origin: params['origin'] || null,
            destination: params['destination'] || null,
            fromDate: params['fromDate'] || '',
            toDate: params['toDate'] || '',
            adults: +params['adults'] || 1,
            children: +params['children'] || 0,
            infants: +params['infants'] || 0,
            routes: params['routes'] || 'Non Stop',
            class: params['class'] || 'Economy',
            students: params['students'] || '0',
            armedForces: params['armedForces'] || '0',
            seniorCitizens: params['seniorCitizens'] || '0',
            medicalProfessionals: params['medicalProfessionals'] || '0'
          });
          this.toggleRoundTrip();
        }

        if (formType === 'multi-city') {
          try {
            const legs = JSON.parse(params['legs'] || '[]');
            if (legs.length) {
              const legControls = legs.map((leg: any) =>
                this.formBuilder.group({
                  origin: [leg.origin, Validators.required],
                  destination: [leg.destination, Validators.required],
                  fromDate: [leg.fromDate, Validators.required]
                })
              );

              // Create a new FormGroup with the updated legs FormArray
              this.multiCityFormData = this.formBuilder.group({
                legs: this.formBuilder.array(legControls),
                adults: [+params['adults'] || 1, [Validators.required, Validators.min(1)]],
                children: [+params['children'] || 0, [Validators.required, Validators.min(0)]],
                infants: [+params['infants'] || 0, [Validators.required, Validators.min(0)]],
                routes: [params['routes'] || 'Non Stop', Validators.required],
                class: [params['class'] || 'Economy', Validators.required],
                students: params['students'] || '0',
                armedForces: params['armedForces'] || '0',
                seniorCitizens: params['seniorCitizens'] || '0',
                medicalProfessionals: params['medicalProfessionals'] || '0'
              });
            }
          } catch (error) {
            console.error('Error parsing legs:', error);
            // Initialize with default values if parsing fails
            this.initializeMultiCityForm();
          }
          this.toggleMultiCity();
        }
      }
    });


    // Initialize Round Trip form
    this.roundTripFormData = this.formBuilder.group({
      origin: [null, Validators.required],
      destination: [null, Validators.required],
      fromDate: ['', Validators.required],
      toDate: ['', [Validators.required, this.returnDateValidator()]],
      adults: [this.passengerCounts.adult, Validators.required],
      children: [this.passengerCounts.child, Validators.required],
      infants: [this.passengerCounts.infant, Validators.required],
      routes: ['Non Stop', Validators.required],
      class: ['Economy', Validators.required],
      // Add special fare controls
      armedForces: ['0'],
      medicalProfessionals: ['0'],
      seniorCitizens: ['0'],
      students: ['0']
    });

    // Initialize Multi-city form
    this.multiCityFormData = this.formBuilder.group({
      legs: this.formBuilder.array([this.createLegFormGroup()]),
      adults: [1, [Validators.required, Validators.min(1)]],
      children: [0, [Validators.required, Validators.min(0)]],
      infants: [0, [Validators.required, Validators.min(0)]],
      routes: ['Non Stop', Validators.required],
      class: ['Economy', Validators.required],
      // Add special fare controls
      armedForces: ['0'],
      medicalProfessionals: ['0'],
      seniorCitizens: ['0'],
      students: ['0']
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
  }

  passengerOptions = {
    adult: {
      value: 1,
      options: {
        floor: 1,
        ceil: 10,
        showSelectionBar: true,
        getPointerColor: () => 'var(--primary)',
        getSelectionBarColor: () => 'var(--primary)',
      } as Options
    },
    child: {
      value: 0,
      options: {
        floor: 0,
        ceil: 10,
        showSelectionBar: true,
        getPointerColor: () => 'var(--primary)',
        getSelectionBarColor: () => 'var(--primary)',
      } as Options
    },
    infant: {
      value: 0,
      options: {
        floor: 0,
        ceil: 10,
        showSelectionBar: true,
        getPointerColor: () => 'var(--primary)',
        getSelectionBarColor: () => 'var(--primary)',
      } as Options
    }
  };

  oneWayForm: boolean = true;
  roundTripForm: boolean = false;
  multiCityForm: boolean = false;
  activeTab: string = 'oneWay'; // Set the default active tab to 'oneWay'

  toggleOneWayTrip(): void {
    this.oneWayForm = true;
    this.roundTripForm = false;
    this.multiCityForm = false;
    this.activeTab = 'oneWay';
  }

  toggleRoundTrip(): void {
    this.oneWayForm = false;
    this.roundTripForm = true;
    this.multiCityForm = false;
    this.activeTab = 'roundTrip';
    
    // Ensure formType is updated in the form data
    if (this.roundTripFormData) {
      const currentValue = this.roundTripFormData.value;
      this.roundTripFormData.patchValue({
        ...currentValue,
        formType: 'round-trip'
      });
    }
  }

  toggleMultiCity(): void {
    this.oneWayForm = false;
    this.roundTripForm = false;
    this.multiCityForm = true;
    this.activeTab = 'multiCity';
  }

  // Method to handle tab changes from child component
  onTabChange(tabName: string): void {
    switch (tabName) {
      case 'oneWay':
        this.toggleOneWayTrip();
        break;
      case 'roundTrip':
        this.toggleRoundTrip();
        break;
      case 'multiCity':
        this.toggleMultiCity();
        break;
    }
  }

  handleSliderChange(value: any) {
  }
  onSearch(term: string): void {
    this.searchInput$.next(term)
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
  private initializeMultiCityForm(): void {
    this.multiCityFormData = this.formBuilder.group({
      legs: this.formBuilder.array([this.createLegFormGroup()]),
      adults: [1, [Validators.required, Validators.min(1)]],
      children: [0, [Validators.required, Validators.min(0)]],
      infants: [0, [Validators.required, Validators.min(0)]],
      routes: ['Non Stop', Validators.required],
      class: ['Economy', Validators.required],
      // Add special fare controls
      armedForces: ['0'],
      medicalProfessionals: ['0'],
      seniorCitizens: ['0'],
      students: ['0']
    });
  }

  // Custom validator for return date
  private returnDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.parent) {
        return null;
      }
      
      const fromDate = control.parent.get('fromDate')?.value;
      const toDate = control.value;
      
      if (!fromDate || !toDate) {
        return null;
      }

      return new Date(toDate) <= new Date(fromDate) 
        ? { invalidReturn: true } 
        : null;
    };
  }

  // Update validation when departure date changes
  onDepartureDateChange() {
    const toDateControl = this.roundTripFormData.get('toDate');
    if (toDateControl) {
      toDateControl.updateValueAndValidity();
    }
  }
}
