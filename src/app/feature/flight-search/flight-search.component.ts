import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SearchFormService } from '../../services/search-form/search-form.service';
import { AirPriceParserService } from '../../services/air-price-parser/air-price-parser.service';
import { ModifySearchComponent } from '../modify-search/modify-search.component';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-flight-search',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    FormsModule,
    ModifySearchComponent,
  ],
  templateUrl: './flight-search.component.html',
  styleUrls: ['./flight-search.component.css'],
})
export class FlightSearchComponent implements OnInit {
  formData: any = {};
  formType: string = '';
  cardData: any[] = [];
  isLoading = false;
  showNoFlightsMessage = false;
  showNoOnwardFlightsMessage = false;
  showNoReturnFlightsMessage = false;
  showNoFlightsMessagePerLeg: boolean[] = [];

  noFlightsFound = false;
  isFilterLoading = false;
  expandedIndex: number | null = null;
  expandedIndices: { [legIndex: number]: number | null } = {};
  expandedFlightIndex: number | null = null; // for multi-city  
  expanded: boolean = false; // Single flag for expanding section
  onwardFlights: any[] | undefined;
  returnFlights: any[] | undefined;
  selectedLeg = 0; // Default to first leg
  departureAirport: any = null;
  arrivalAirport: any = null;
  filteredCardData: any[] = [];
  filteredOnwardFlights: any[] = [];
  filteredReturnFlights: any[] = [];

  timeFrames = [
    { name: 'Early', timePeriod: '00:00-06:00' },
    { name: 'Morning', timePeriod: '06:00-12:00' },
    { name: 'Afternoon', timePeriod: '12:00-18:00' },
    { name: 'Evening', timePeriod: '18:00-00:00' },
  ];

  // Filter control properties
  minPrice: number = 0;          // computed from flight data
  maxPrice: number = 0;          // computed from flight data
  currentPrice: number = 0;      // slider upper bound (default = maxPrice)

  // For the departure and arrival time filters we use separate indexes.
  selectedDepartureIndex: number | null = null;
  selectedArrivalIndex: number | null = null;
  onFilteredDataChange(filteredData: any[]) {
    this.filteredCardData = filteredData;
  }
  bookFlight(e: any) {
    this.searchFormService.setSelectedFlight(e);
    this.router.navigate(['/flight-details']);
  }
  // Transit filter value; possible values: 'nonStop', 'oneStop', 'twoStop'
  transitFilter: string = 'nonStop'; // default radio option
  resetFilters(): void {
    this.isFilterLoading = true;
    this.showNoFlightsMessage = false;
    
    setTimeout(() => {
      this.currentPrice = this.maxPrice; // Reset to max price
      this.selectedDepartureIndex = null;
      this.selectedArrivalIndex = null;
      this.transitFilter = 'nonStop';
      this.applyFilters();
      this.isFilterLoading = false;
    }, 1000);
  }
  
  clearSelectedFlights() {
    // First, clear all selection states
    if (this.formType === 'round-trip') {
      // Clear onward flights
      if (this.filteredOnwardFlights) {
        this.filteredOnwardFlights.forEach(flight => {
          flight.isSelected = false;
        });
      }
      if (this.onwardFlights) {
        this.onwardFlights.forEach(flight => {
          flight.isSelected = false;
        });
      }

      // Clear return flights
      if (this.filteredReturnFlights) {
        this.filteredReturnFlights.forEach(flight => {
          flight.isSelected = false;
        });
      }
      if (this.returnFlights) {
        this.returnFlights.forEach(flight => {
          flight.isSelected = false;
        });
      }

      // Reset the selected flights array completely
      // this.selectedRoundTripFlights = new Array(2).fill(null);
      this.selectedRoundTripFlights = []
    }


    // Clear multi-city selections
    if (this.formType === 'multi-city') {
      if (this.cardData) {
        this.cardData.forEach(leg => {
          if (leg.flights) {
            leg.flights.forEach((flight: any) => {
              flight.isSelected = false;
            });
          }
        });
      }
      if (this.filteredCardData) {
        this.filteredCardData.forEach(leg => {
          if (leg.flights) {
            leg.flights.forEach((flight: any) => {
              flight.isSelected = false;
            });
          }
        });
      }
      this.selectedMultiCityFlights = [];
    }

    // Reset UI states
    this.expanded = false;
    this.isSelectedMultiCityDetailsExpanded = false;
    this.selectedIndex = null;
    this.expandedIndex = null;
    
    // Force change detection
    this.cdr.detectChanges();
  }
  
  getColumnClass(legCount: number): number {
    if (legCount === 2) return 6; // 2 columns (col-6)
    if (legCount === 3) return 4; // 3 columns (col-4)
    if (legCount === 4) return 3; // 4 columns (col-3)
    if (legCount >= 5) return 2; // 5 or more columns (col-2)
    return 12; // Default: full width (col-12)
  }

  selectedIndex: number | null = null;
  selectedRoundTripFlights: any[] = [];
  selectedTrip: 'departure' | 'return' = 'departure';
  selectedMultiCityFlights: any[] = [];
  selectedTab: string = 'flight'; // Default tab is 'Flight Details'
  searchFormData: any = null;
  receivedOneWayFormData: any;
  receivedRoundTripFormData: any;
  receivedMultiCityFormData: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private searchFormService: SearchFormService,
    private cdr: ChangeDetectorRef,
    private airPriceParser: AirPriceParserService
  ) {}

  getAirportByIata(iata: string): any {
    return this.searchFormService.getAirportByIata(iata);
  }
  ngOnInit(): void {
    this.isLoading = true;
    const storedForm = localStorage.getItem('flightFormData');
    if (storedForm) {
    const searchFormData = JSON.parse(storedForm);
    console.log('Search Form Data:', searchFormData);

    // You can assign it to a property to show on template if needed
    this.searchFormData = searchFormData;
  } else {
    console.warn('No search form data found in localStorage');
  }
    this.route.queryParams.subscribe((params) => {
      this.formData = {
        ...params,
        students: params['students'] || '0',
        armedForces: params['armedForces'] || '0',
        seniorCitizens: params['seniorCitizens'] || '0',
        medicalProfessionals: params['medicalProfessionals'] || '0'
      };
      if (params['legs']) {
        this.formData.legs = JSON.parse(params['legs']);
      }
      this.formType = params['formType'];

      if (this.formType === 'one-way') {
        this.receivedOneWayFormData = this.formData;
        this.handleOneWayResults();
      } else if (this.formType === 'round-trip') {
        this.receivedRoundTripFormData = this.formData;
        this.handleRoundTripResults();
      } else if (this.formType === 'multi-city') {
        this.receivedMultiCityFormData = this.formData;
        this.handleMultiCityResults();
      }
      this.lowFareSearch();
    });
  
  const departureIata = this.formData.origin;  // for one-way or round-trip
  const arrivalIata = this.formData.destination;
  if (this.formType === 'multi-city' && this.formData.legs) {
    // For multi-city, process each leg to get origin and destination airports
    this.formData.legs.forEach((leg: { origin: any; destination: any; }, index: number) => {
      const legDepartureIata = leg.origin;
      const legArrivalIata = leg.destination;

      this.searchFormService.airportList$.subscribe((airports) => {
        if (!airports.length) return; // wait until data is loaded

        const departureAirport = airports.find(a => a.iataCode === legDepartureIata);
        const arrivalAirport = airports.find(a => a.iataCode === legArrivalIata);

        console.log(`Leg ${index + 1} - Departure Airport:`, departureAirport);
        console.log(`Leg ${index + 1} - Arrival Airport:`, arrivalAirport);

        // Store airports for each leg if needed
        this.departureAirport = departureAirport;
        this.arrivalAirport = arrivalAirport;
      });
    });
  } else {
    // Handle one-way or round-trip
    this.searchFormService.airportList$.subscribe((airports) => {
      if (!airports.length) return; // wait until data is loaded

      this.departureAirport = airports.find(a => a.iataCode === departureIata);
      this.arrivalAirport = airports.find(a => a.iataCode === arrivalIata);

      console.log('Departure Airport:', this.departureAirport);
      console.log('Arrival Airport:', this.arrivalAirport);
    });
  }

  }
  computePriceRange(): void {
    if (this.formType === 'one-way') {
      if (this.cardData && this.cardData.length > 0) {
        const prices = this.cardData.map(f => Number(f.price));
        this.minPrice = Math.min(...prices);
        this.maxPrice = Math.max(...prices);
        this.currentPrice = this.maxPrice; // Set initial position to max
      }
    } else if (this.formType === 'round-trip') {
      let allPrices: number[] = [];
      if (this.onwardFlights && this.onwardFlights.length > 0) {
        allPrices = allPrices.concat(this.onwardFlights.map(f => Number(f.price)));
      }
      if (this.returnFlights && this.returnFlights.length > 0) {
        allPrices = allPrices.concat(this.returnFlights.map(f => Number(f.price)));
      }
      if (allPrices.length > 0) {
        this.minPrice = Math.min(...allPrices);
        this.maxPrice = Math.max(...allPrices);
        this.currentPrice = this.maxPrice; // Set initial position to max
      }
    } else if (this.formType === 'multi-city') {
      let allPrices: number[] = [];
      if (this.cardData && this.cardData.length > 0) {
        this.cardData.forEach(leg => {
          if (leg.flights && leg.flights.length > 0) {
            allPrices = allPrices.concat(leg.flights.map((flight: any) => Number(flight.price)));
          }
        });
        if (allPrices.length > 0) {
          this.minPrice = Math.min(...allPrices);
          this.maxPrice = Math.max(...allPrices);
          this.currentPrice = this.maxPrice; // Set initial position to max
        }
      }
    }
  }
  

  // Helper to check if a time string (e.g. "08:30") is within a given range string ("06:00-12:00")
  isTimeWithinRange(time: string, range: string): boolean {
    const [startStr, endStr] = range.split('-');
    const [timeH, timeM] = time.split(':').map(Number);
    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);

    const timeMinutes = timeH * 60 + timeM;
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    // Handle ranges that span midnight
    if (startMinutes <= endMinutes) {
      return timeMinutes >= startMinutes && timeMinutes < endMinutes;
    } else {
      return timeMinutes >= startMinutes || timeMinutes < endMinutes;
    }
  }


  // UI Methods
  formatToDepartureDate(day: string, time: string): string {
    const date = new Date(day); // this will parse "Fri, Apr 25, 2025"
    const isoDate = date.toISOString().split('T')[0]; // gets "2025-04-25"
    return `${isoDate}T${time}`; // combine with time
  }

  // getFormattedBaggageDetail(baggageArray: string[]): string {
  //   if (!Array.isArray(baggageArray)) return 'N/A';
  
  //   const weight = baggageArray.find((item) => /^[0-9]+k$/i.test(item.trim()));
  //   if (!weight) return 'N/A';
  
  //   const formattedWeight = weight.trim().replace(/k$/i, 'Kgs');
  //   return `${formattedWeight} (1 Piece * ${formattedWeight})`;
  // }
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
  
      // Extract weight like 23KG, 25K, 7KG, 8KG etc (prioritize KG/K)
      if (!weightInKg) {
        const kgMatch = trimmed.match(/([0-9]+)(K(G)?)/i);
        if (kgMatch) {
          weightInKg = `${kgMatch[1]}Kgs`;
        }
      }
    }
  
    if (weightInKg) {
      const pcs = pieces !== null ? pieces : 1;
      return `${weightInKg} (${pcs} Piece${pcs > 1 ? 's' : ''} * ${weightInKg})`;
    }
  
    return 'N/A';
  }    
  
  getTotalPiecesAllowed(checked: string[], carryOn: string[]): string {
    let totalPieces = 0;
  
    const extractPieces = (baggageArray: string[]) => {
      if (!Array.isArray(baggageArray)) return;
  
      let foundPiece = false;
      let foundWeight = false;
  
      for (const text of baggageArray) {
        const cleanText = text.trim().toUpperCase();
  
        // Match "1P", "2P", etc.
        const pieceMatch = cleanText.match(/^([0-9]+)\s*P$/);
        if (pieceMatch) {
          totalPieces += parseInt(pieceMatch[1], 10);
          foundPiece = true;
        }
  
        // Match "7K", "23KG", etc.
        const weightMatch = cleanText.match(/([0-9]+)(K(G)?)?/);
        if (weightMatch) {
          foundWeight = true;
        }
      }
  
      // If no "pieces" found but weight exists, assume 1 piece
      if (!foundPiece && foundWeight) {
        totalPieces += 1;
      }
    };
  
    extractPieces(checked);
    extractPieces(carryOn);
  
    return totalPieces > 0 ? `${totalPieces} Bag${totalPieces > 1 ? 's' : ''} Allowed` : 'N/A';
  }     
  
  toggleDetails(legIndex: number, e: any, subIndex: number = 0): void {
    // Toggle logic based on legIndex and subIndex
    const currentExpanded = this.expandedIndices[legIndex];
    this.expandedIndices[legIndex] = currentExpanded === subIndex ? null : subIndex;
  
    if (this.expandedIndices[legIndex] === subIndex) {
      const flights = (e.flights || [e]).map((flight: any) => {
        const departureDate = this.formatToDepartureDate(
          flight.departure_day || this.formatDateTime(flight.departureTime).date,
          flight.departure_time || this.formatDateTime(flight.departureTime).time
        );
  
        return {
          flightKey: flight.key,
          origin: flight.origin || flight.departure || '',
          destination: flight.destination || flight.arrival || '',
          departureDate: departureDate,
          carrier: flight.airline,
          flightNumber: flight.flightNumber,
          providerCode: flight.providerCode,
        };
      });
  
      const formData = {
        flights,
        adults: 1,
        children: 0,
        infants: 0,
        students: 0,
        seniors: 0,
      };

      this.searchFormService.getAirPrice(formData).subscribe({
        next: (response) => {
          const parser = new DOMParser();
          const xmlString = response as string;
          const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
          const parsed = this.airPriceParser.parseAirPriceXML(xmlString);
  
          if (this.formType === 'multi-city') {
            const selectedFlight = this.cardData[legIndex]?.flights?.[subIndex];
            if (selectedFlight) {
              selectedFlight.baggageChecked = parsed.baggageInfo.checked;
              selectedFlight.baggageCarryOn = parsed.baggageInfo.carryOn;
              selectedFlight.refundability = parsed.refundability;
            }
          } else {
            if (this.cardData && this.cardData[legIndex]) {
              this.cardData[legIndex].baggageChecked = parsed.baggageInfo.checked;
              this.cardData[legIndex].baggageCarryOn = parsed.baggageInfo.carryOn;
              this.cardData[legIndex].refundability = parsed.refundability;
            }
          }
  
          console.log('Air Price response:', response);
          console.log('baggage', parsed.baggageInfo);
          console.log('refundability', parsed.refundability);
        },
        error: (error) => {
          console.error('Error fetching air price:', error);
        },
      });
    }
  }
    
  toggleSelectedCardsDetails(): void {
    this.expanded = !this.expanded;
    if (!this.expanded) return;
  
    // ✅ Pick only the return flight (second card in round trip)
    const roundTripCards = this.selectedRoundTripFlights || [];

    const allSelectedCards = [
      ...roundTripCards,
      ...(this.selectedMultiCityFlights || [])
    ];    
  
    // ✅ Skip if no cards at all
    if (!allSelectedCards.length) return;
  
    const allFlights: any[] = [];
  
    allSelectedCards.forEach((card: any) => {
      if (!card) return;
  
      const cardFlights = (card.flights || [card]).map((flight: any) => {
        const departureDate = this.formatToDepartureDate(
          flight.departure_day || this.formatDateTime(flight.departureTime).date,
          flight.departure_time || this.formatDateTime(flight.departureTime).time
        );
  
        return {
          flightKey: flight.key,
          origin: flight.origin || flight.departure || '',
          destination: flight.destination || flight.arrival || '',
          departureDate: departureDate,
          carrier: flight.airline,
          flightNumber: flight.flightNumber,
          providerCode: flight.providerCode,
        };
      });
  
      card._flightKeyMap = cardFlights.map((f: { flightKey: any }) => f.flightKey);
      allFlights.push(...cardFlights);
    });
  
    const formData = {
      flights: allFlights,
      adults: 1,
      children: 0,
      infants: 0,
      students: 0,
      seniors: 0,
    };
  
    this.searchFormService.getAirPrice(formData).subscribe({
      next: (response) => {
        const xmlString = response as string;
        const parsed = this.airPriceParser.parseAirPriceXML(xmlString);
  
        allSelectedCards.forEach((card: any) => {
          if (!card) return;
          card.baggageChecked = parsed.baggageInfo.checked;
          card.baggageCarryOn = parsed.baggageInfo.carryOn;
          card.refundability = parsed.refundability;
        });
  
        console.log('Air Price response for return flight only:', response);
      },
      error: (error) => {
        console.error('Error fetching air price for return flight:', error);
      },
    });
  }         

  closeExpandedSection(): void {
    this.expanded = false;
  }

  selectButton(index: number): void {
    this.selectedIndex = index;
  }

  toggleSelectRoundTrip(index: number, tripType: 'departure' | 'return') {
    if (!this.selectedRoundTripFlights) {
      this.selectedRoundTripFlights = [null, null];
    }
  
    if (tripType === 'departure' && this.filteredOnwardFlights) {
      const selectedFlight = this.filteredOnwardFlights[index];
      if (selectedFlight.isSelected) {
        selectedFlight.isSelected = false;
        this.selectedRoundTripFlights[0] = null;
      } else {
        this.filteredOnwardFlights.forEach(f => f.isSelected = false);
        selectedFlight.isSelected = true;
        this.selectedRoundTripFlights[0] = selectedFlight;
      }
    }
    if (tripType === 'return' && this.filteredReturnFlights) {
      const selectedFlight = this.filteredReturnFlights[index];
      if (selectedFlight.isSelected) {
        selectedFlight.isSelected = false;
        this.selectedRoundTripFlights[1] = null;
      } else {
        this.filteredReturnFlights.forEach(f => f.isSelected = false);
        selectedFlight.isSelected = true;
        this.selectedRoundTripFlights[1] = selectedFlight;
      }
    }
    // Clean and ensure structure is consistent
    const first = this.selectedRoundTripFlights?.[0] || null;
    const second = this.selectedRoundTripFlights?.[1] || null;
    this.selectedRoundTripFlights = [first, second];
  
    // ✅ Close expanded view if nothing is selected
    if (!first && !second) {
      this.expanded = false;
    }
  }

  getTotalSelectedRoundTripPrice(): number {
    return this.selectedRoundTripFlights
      .filter((flight) => flight) // Ensure we don't include null values
      .reduce((total, flight) => total + Number(flight.price) || 0, 0);
  }
  isSelectedMultiCityDetailsExpanded: boolean = false;

  toggleSelectedMultiCityDetails() {
    this.isSelectedMultiCityDetailsExpanded =
      !this.isSelectedMultiCityDetailsExpanded;
  }
  toggleSelectMultiCity(index: number) {
    const selectedFlight = this.cardData[this.selectedLeg].flights[index];

    const isAlreadySelected = selectedFlight.isSelected;

    if (isAlreadySelected) {
      // Deselect this flight
      selectedFlight.isSelected = false;

      // Remove from selectedMultiCityFlights
      this.selectedMultiCityFlights = this.selectedMultiCityFlights.filter(
        (flight) => !(flight.leg === this.selectedLeg)
      );
    } else {
      // Deselect all flights in this leg
      this.cardData[this.selectedLeg].flights.forEach(
        (flight: { isSelected: boolean }) => (flight.isSelected = false)
      );

      // Mark new selection
      selectedFlight.isSelected = true;

      // Check if a flight for this leg already exists
      const existingIndex = this.selectedMultiCityFlights.findIndex(
        (flight) => flight.leg === this.selectedLeg
      );

      if (existingIndex !== -1) {
        // Replace the old selection
        this.selectedMultiCityFlights[existingIndex] = {
          ...selectedFlight,
          leg: this.selectedLeg,
        };
      } else {
        if (this.selectedMultiCityFlights.length < this.cardData.length) {
          this.selectedMultiCityFlights.push({
            ...selectedFlight,
            leg: this.selectedLeg,
          });
        } else {
          alert(
            `You can only select ${this.cardData.length} flights in total!`
          );
          return;
        }
      }
    }
  }
  get totalSelectedMulticityFlightPrice(): number {
    return this.selectedMultiCityFlights.reduce(
      (sum, flight) => sum + Number(flight.price),
      0
    );
  }
  closeisSelectedMultiCityDetailsExpandedSection(): void {
    this.isSelectedMultiCityDetailsExpanded = false;
  }

  // ---------------- Search & Timing Helpers ----------------
  lowFareSearch() {
    this.isLoading = true;

    this.searchFormService.getAllLowCostCarrier(this.formData).subscribe(
      (res: any) => {        
        if (this.formType === 'one-way') {
          this.handleXMLResponse(res, this.formData.origin, this.formData.destination);
        } else if (this.formType === 'round-trip' || this.formType === 'multi-city') {
          this.handleXMLResponse1(res, this.formData);
        }

        setTimeout(() => {
          this.computePriceRange();
          this.applyFilters();
          this.isLoading = false;
        }, 3000);
      },
      (error) => {
        console.error('Error in lowFareSearch:', error);
        this.isLoading = false;
      }
    );
  }


  calculateDuration(
    departureTime: string,
    arrivalTime: string,
    departureDay: string,
    arrivalDay: string
  ): string {
    const parseDate = (day: string, time: string): Date | null => {
      try {
        const formattedDate = new Date(`${day} ${time}`);
        return isNaN(formattedDate.getTime()) ? null : formattedDate;
      } catch {
        return null;
      }
    };
    const departureDateTime = parseDate(departureDay, departureTime);
    const arrivalDateTime = parseDate(arrivalDay, arrivalTime);
    if (!departureDateTime || !arrivalDateTime) return 'Invalid time format';
    const diffInMs = arrivalDateTime.getTime() - departureDateTime.getTime();
    if (diffInMs < 0) return 'Invalid time calculation';
    const hours = Math.floor(diffInMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
    const isNextDay = arrivalDateTime.getDate() > departureDateTime.getDate();
    return `${hours}h ${minutes}m${isNextDay ? '+1' : ''}`;
  }

  getLayoverText(layovers: { [key: string]: number }): string {
    if (!layovers || Object.keys(layovers).length === 0) return 'No layover';
    const [airport, minutes] = Object.entries(layovers)[0];
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${airport} - ${hours} hrs ${mins} mins Layover`;
  }

  private buildSegmentPriceMap(
    airPricePointElements: Element[]
  ): Map<
    string,
    {
      totalPrice: string;
      basePrice: string;
      taxes: string;
      bookingCode: string;
    }[]
  > {
    const segmentPriceMap = new Map<
      string,
      {
        totalPrice: string;
        basePrice: string;
        taxes: string;
        bookingCode: string;
      }[]
    >();

    airPricePointElements.forEach((pricePoint) => {
      const airPricingInfos = Array.from(
        pricePoint.getElementsByTagName('air:AirPricingInfo')
      );

      airPricingInfos.forEach((api) => {
        const totalPrice = api.getAttribute('TotalPrice') || '0';
        const basePrice = api.getAttribute('BasePrice') || '0';
        const taxes = api.getAttribute('Taxes') || '0';

        const bookingInfos = Array.from(
          api.getElementsByTagName('air:BookingInfo')
        );

        bookingInfos.forEach((bi) => {
          const segRef = bi.getAttribute('SegmentRef');
          const bookingCode = bi.getAttribute('BookingCode') || '';

          if (segRef) {
            const entry = { totalPrice, basePrice, taxes, bookingCode };
            const existing = segmentPriceMap.get(segRef) || [];
            existing.push(entry);

            // Sort by numeric value of totalPrice (e.g., remove currency and sort)
            existing.sort((a, b) => {
              const numA = parseFloat(a.totalPrice.replace(/[^\d.]/g, ''));
              const numB = parseFloat(b.totalPrice.replace(/[^\d.]/g, ''));
              return numA - numB;
            });

            segmentPriceMap.set(segRef, existing);
          }
        });
      });
    });

    return segmentPriceMap;
  }

  private extractFlights(
    pricingMap: Map<
      string,
      {
        totalPrice: string;
        basePrice: string;
        taxes: string;
        bookingCode: string;
      }[]
    >,
    segments: Element[],
    flightDetails: Element[]
  ): any[] {
    const flights = [];

    // Build a map of FlightDetails by Key
    const flightDetailsMap = new Map<string, Element>();
    for (const detail of flightDetails) {
      const key = detail.getAttribute('Key');
      if (key) flightDetailsMap.set(key, detail);
    }

    // Build a map of segments by Key
    const segmentMap = new Map<string, Element>();
    for (const segment of segments) {
      const key = segment.getAttribute('Key');
      if (key) segmentMap.set(key, segment);
    }

    // Now iterate over pricingMap entries (which are the flight keys)
    for (const [segKey, priceArray] of pricingMap.entries()) {
      const segment = segmentMap.get(segKey);
      if (!segment) continue; // Skip if no matching segment found
      const carrier = segment.getAttribute('Carrier') || '';
      const flightNumber = segment.getAttribute('FlightNumber') || '';
      const airAvailInfo = segment.querySelector('AirAvailInfo');
      const providerCode = airAvailInfo
        ? airAvailInfo.getAttribute('ProviderCode') || 'Unknown Provider Code'
        : 'Unknown Provider Code';
      const flightDetailsRef = segment.getElementsByTagName(
        'air:FlightDetailsRef'
      )[0];
      const flightDetailsKey = flightDetailsRef?.getAttribute('Key') || '';
      const flight = flightDetailsMap.get(flightDetailsKey);
      const priceInfo = Array.isArray(priceArray) ? priceArray[0] : priceArray;
      const priceStr = priceInfo.totalPrice?.replace(/[^\d.]/g, '');
      const basePriceStr = priceInfo.basePrice?.replace(/[^\d.]/g, '');
      const taxesStr = priceInfo.taxes?.replace(/[^\d.]/g, '');
      const departureTimeStr = flight?.getAttribute('DepartureTime') || '';
const arrivalTimeStr = flight?.getAttribute('ArrivalTime') || '';

const dep = this.formatDateTime(departureTimeStr);
const arr = this.formatDateTime(arrivalTimeStr);

const duration = this.calculateDuration(
  dep.time,
  arr.time,
  dep.date,
  arr.date
);

      flights.push({
        key: segKey,
        origin: flight?.getAttribute('Origin') || '',
        destination: flight?.getAttribute('Destination') || '',
        duration,
        departureTime: new Date(flight?.getAttribute('DepartureTime') || ''),
        arrivalTime: new Date(flight?.getAttribute('ArrivalTime') || ''),
        flightTime: parseInt(flight?.getAttribute('FlightTime') || '0', 10),
        equipment: flight?.getAttribute('Equipment') || '',
        originTerminal: flight?.getAttribute('OriginTerminal') || 'N/A',
        destinationTerminal:
          flight?.getAttribute('DestinationTerminal') || 'N/A',
        price: priceStr ? `${Math.floor(parseFloat(priceStr))}` : '0',
        basePrice: basePriceStr
          ? `${Math.floor(parseFloat(basePriceStr))}`
          : '0',
        taxes: taxesStr ? `${Math.floor(parseFloat(taxesStr))}` : '0',
        priceArray: priceArray,
        airline: carrier,
        providerCode: providerCode,
        flightNumber: flightNumber,
      });
    }

    return flights;
  }

  private extractSeatsInfoFromPricePoint(
    airPricePointElements: Element[]
  ): Map<string, string> {
    const seatsMap = new Map<string, string>();
    airPricePointElements.forEach((pricePoint) => {
      const airPricingInfos = Array.from(
        pricePoint.getElementsByTagName('air:AirPricingInfo')
      );
      airPricingInfos.forEach((api) => {
        const bookingInfos = Array.from(
          api.getElementsByTagName('air:BookingInfo')
        );
        bookingInfos.forEach((bi) => {
          const bookingCount = bi.getAttribute('BookingCount');
          const segRef = bi.getAttribute('SegmentRef') || '';
          if (bookingCount) {
            const availableSeats = `${bookingCount}`;
            seatsMap.set(segRef, availableSeats); // Map the price point key to seats info
          }
        });
      });
    });
    return seatsMap;
  }

  // Process direct flight segments using a filter function.
  private processDirectFlights(
    pricingMap: Map<
      string,
      {
        totalPrice: string;
        basePrice: string;
        taxes: string;
        bookingCode: string;
      }[]
    >,
    seatsMap: Map<string, string>,
    segments: Element[],
    flightDetails: Element[],
    fareInfoElements: Element[],
    filterFn: (origin: string, destination: string) => boolean,
    type: string
  ): any[] {
    const flights = [];

    // Create a Map of FlightDetails by Key
    const flightDetailsMap = new Map<string, Element>();
    for (const detail of flightDetails) {
      const key = detail.getAttribute('Key');
      if (key) flightDetailsMap.set(key, detail);
    }

    // Create a Map of AirSegments by Key
    const segmentMap = new Map<string, Element>();
    for (const segment of segments) {
      const key = segment.getAttribute('Key');
      if (key) segmentMap.set(key, segment);
    }

    // Iterate over pricingMap (not segments)
    for (const [segKey, priceArray] of pricingMap.entries()) {
      const segment = segmentMap.get(segKey);
      if (!segment) continue; // Skip if segment not found
      const flightNumber =
        segment.getAttribute('FlightNumber') || 'Unknown Flight Number';
      const airAvailInfo = segment.querySelector('AirAvailInfo');
      const providerCode = airAvailInfo
        ? airAvailInfo.getAttribute('ProviderCode') || 'Unknown Provider Code'
        : 'Unknown Provider Code';

      const airline = segment.getAttribute('Carrier') || 'Unknown Airline';
      const departure = segment.getAttribute('Origin') || 'N/A';
      const arrival = segment.getAttribute('Destination') || 'N/A';
      const departureTime = segment.getAttribute('DepartureTime') || 'N/A';
      const arrivalTime = segment.getAttribute('ArrivalTime') || 'N/A';
      const seatsLeft = seatsMap.get(segKey) || 'N/A';

      // Get prices
      const priceInfo = Array.isArray(priceArray) ? priceArray[0] : priceArray;
      const priceStr = priceInfo.totalPrice?.replace(/[^\d.]/g, '');
      const basePriceStr = priceInfo.basePrice?.replace(/[^\d.]/g, '');
      const taxesStr = priceInfo.taxes?.replace(/[^\d.]/g, '');

      // Get flight detail ref key
      const flightDetailsRef = segment.getElementsByTagName(
        'air:FlightDetailsRef'
      )[0];
      const flightDetailsKey = flightDetailsRef?.getAttribute('Key') || '';
      const flightDetail = flightDetailsMap.get(flightDetailsKey);

      const flightOrigin = flightDetail?.getAttribute('Origin') || 'N/A';
      const flightDestination =
        flightDetail?.getAttribute('Destination') || 'N/A';

      if (filterFn(flightOrigin, flightDestination)) {
        const duration = this.calculateDuration(
          this.formatDateTime(departureTime).time,
          this.formatDateTime(arrivalTime).time,
          this.formatDateTime(departureTime).date,
          this.formatDateTime(arrivalTime).date
        );        
        flights.push({
          key: segKey,
          logo: `assets/flight-logo/${airline}.png`,
          flight_img: '../../../assets/svgs/la_plane.svg',
          departure,
          duration,
          departure_time: this.formatDateTime(departureTime).time,
          departure_day: this.formatDateTime(departureTime).date,
          arrival_time: this.formatDateTime(arrivalTime).time,
          arrival_day: this.formatDateTime(arrivalTime).date,
          arrival,
          price: priceStr ? `${Math.floor(parseFloat(priceStr))}` : '0',
          basePrice: basePriceStr
            ? `${Math.floor(parseFloat(basePriceStr))}`
            : '0',
          taxes: taxesStr ? `${Math.floor(parseFloat(taxesStr))}` : '0',
          formattedPrice: priceStr
            ? `${Math.floor(parseFloat(priceStr))}`
            : '0',
          originTerminal: flightDetail?.getAttribute('OriginTerminal') || 'N/A',
          destinationTerminal:
            flightDetail?.getAttribute('DestinationTerminal') || 'N/A',
          seatsLeft,
          airline,
          isSelected: false,
          type,
          priceArray: priceArray,
          providerCode: providerCode,
          flightNumber: flightNumber,
        });
      }
    }

    return flights;
  }

  // Process connecting routes by summing prices of individual segments.
  private processConnectingRoutes(
    routes: any[],
    seatsMap: Map<string, string>,
    segments: Element[],
    flightDetails: Element[],
    type: string
  ): any[] {
    // Create a map of FlightDetails by Key
    const flightDetailsMap = new Map<string, Element>();
    for (const detail of flightDetails) {
      const key = detail.getAttribute('Key');
      if (key) flightDetailsMap.set(key, detail);
    }

    // Create a map of AirSegments by Key
    const airSegmentMap = new Map<string, Element>();
    for (const seg of segments) {
      const key = seg.getAttribute('Key');
      if (key) airSegmentMap.set(key, seg);
    }

    return routes.map((route) => {
      const firstFlight = route.flights[0];
      const lastFlight = route.flights[route.flights.length - 1];

      const totalPrice = route.flights.reduce(
        (sum: number, flight: any) => sum + parseFloat(flight.price || '0'),
        0
      );
      const totalBasePrice = route.flights.reduce(
        (sum: number, flight: any) => sum + parseFloat(flight.basePrice || '0'),
        0
      );
      const totalTaxes = route.flights.reduce(
        (sum: number, flight: any) => sum + parseFloat(flight.taxes || '0'),
        0
      );
      const flightsWithSeats = route.flights.map((flight: any) => {
        const seats = parseInt(seatsMap.get(flight.key) || '0', 10);
        return {
          ...flight,
          seatsLeft: seats,
        };
      });
      const minSeatsLeft = Math.min(
        ...flightsWithSeats.map((flight: any) => flight.seatsLeft)
      );

      const flightsWithDetails = route.flights.map((flight: any) => {
        const segment = airSegmentMap.get(flight.key);
        const flightDetailsRef = segment?.getElementsByTagName(
          'air:FlightDetailsRef'
        )[0];
        const flightDetailKey = flightDetailsRef?.getAttribute('Key') || '';
        const detail = flightDetailsMap.get(flightDetailKey);

        return {
          ...flight,
          origin: detail?.getAttribute('Origin') || flight.origin || 'N/A',
          destination:
            detail?.getAttribute('Destination') || flight.destination || 'N/A',
          originTerminal: detail?.getAttribute('OriginTerminal') || 'N/A',
          destinationTerminal:
            detail?.getAttribute('DestinationTerminal') || 'N/A',
          departureTime:
            segment?.getAttribute('DepartureTime') || flight.departureTime,
          arrivalTime:
            segment?.getAttribute('ArrivalTime') || flight.arrivalTime,
          flightTime:
            detail?.getAttribute('FlightTime') || flight.flightTime || '0',
          equipment:
            detail?.getAttribute('Equipment') || flight.equipment || '',
          seatsLeft: seatsMap.get(flight.key) || 'N/A',
        };
      });

      return {
        flights: flightsWithSeats,
        totalTravelTime: route.totalTravelTime,
        totalStops: route.totalStops,
        departure: firstFlight.origin,
        departure_time: this.formatDateTime(firstFlight.departureTime).time,
        departure_day: this.formatDateTime(firstFlight.departureTime).date,
        arrival: lastFlight.destination,
        arrival_time: this.formatDateTime(lastFlight.arrivalTime).time,
        arrival_day: this.formatDateTime(lastFlight.arrivalTime).date,
        layovers: route.layovers,
        price: totalPrice.toFixed(2),
        basePrice: totalBasePrice.toFixed(2),
        taxes: totalTaxes.toFixed(2),
        formattedPrice: `${Math.floor(totalPrice)}`,
        airlines: route.flights.map((f: any) => f.airline).join(' '),
        flight_img: '../../../assets/svgs/la_plane.svg',
        logo: `assets/flight-logo/${firstFlight.airline}.png`,
        isSelected: false,
        type,
        seatsLeft: minSeatsLeft,
        airline: firstFlight.airline,
        providerCode: firstFlight.providerCode,
        flightNumber: flightsWithSeats
          .map((f: any) => f.flightNumber)
          .join(','),
      };
    });
  }

  // ----------------- Handlers for Search Results -----------------
  handleOneWayResults() {
    // Add any one-way specific logic here
  }

  handleRoundTripResults() {
    // Add any round-trip specific logic here
  }

  handleMultiCityResults() {
    // Add any multi-city specific logic here
  }
  filterMultiCityFlights(): void {
    // Create a new filtered result for each leg in cardData.
    this.filteredCardData = this.cardData.map(leg => {
      const filteredFlights = leg.flights.filter((flight: any) => {
        return this.filterFlightConditions(flight);
      });      
      return {...leg, filteredFlights};
    });
  }
  filterRoundTripFlights(): void {
    // Filter onward flights
    this.filteredOnwardFlights = (this.onwardFlights || []).filter(flight => {
      return this.filterFlightConditions(flight);
    });
  
    // Filter return flights
    this.filteredReturnFlights = (this.returnFlights || []).filter(flight => {
      return this.filterFlightConditions(flight);
    });
  }
  
  // A helper method to avoid duplicating filter logic
  filterFlightConditions(flight: any): boolean {
    const flightPrice = Number(flight.price);    
    const priceOk = flightPrice <= this.currentPrice; // Only check against currentPrice
    
    let departureOk = true;
    if (this.selectedDepartureIndex !== null) {
      const timeRange = this.timeFrames[this.selectedDepartureIndex].timePeriod;
      departureOk = this.isTimeWithinRange(flight.departure_time, timeRange);
    }
  
    let arrivalOk = true;
    if (this.selectedArrivalIndex !== null) {
      const timeRange = this.timeFrames[this.selectedArrivalIndex].timePeriod;    
      arrivalOk = this.isTimeWithinRange(flight.arrival_time, timeRange);
    }
  
    let transitOk = true;
    if (this.transitFilter === 'nonStop') {
      transitOk = flight.type ==='direct' || flight.type === 'direct-return' && (!flight.totalStops || flight.totalStops === 0);
    } else if (this.transitFilter === 'oneStop') {
      const stops = flight.totalStops !== undefined ? flight.totalStops : (flight.type === 'direct' || flight.type === 'direct-return'? 0 : 1);
      transitOk = stops === 1;
    } else if (this.transitFilter === 'twoStop') {
      const stops = flight.totalStops !== undefined ? flight.totalStops : 0;
      transitOk = stops === 2;
    }
    return priceOk && departureOk && arrivalOk && transitOk;
  }
  filterOneWayFlights(): void {
    this.filteredCardData = this.cardData.filter(flight => {
      const flightPrice = Number(flight.price);
      const priceOk = flightPrice >= this.minPrice && flightPrice <= this.currentPrice;
      
      let departureOk = true;
      if (this.selectedDepartureIndex !== null) {
        const timeRange = this.timeFrames[this.selectedDepartureIndex].timePeriod;
        departureOk = this.isTimeWithinRange(flight.departure_time, timeRange);
      }
    
      let arrivalOk = true;
      if (this.selectedArrivalIndex !== null) {
        const timeRange = this.timeFrames[this.selectedArrivalIndex].timePeriod;
        arrivalOk = this.isTimeWithinRange(flight.arrival_time, timeRange);
      }
    
      let transitOk = true;
      if (this.transitFilter === 'nonStop') {
        transitOk = flight.type.includes('direct') && (!flight.totalStops || flight.totalStops === 0);
      } else if (this.transitFilter === 'oneStop') {
        const stops = flight.totalStops !== undefined ? flight.totalStops : (flight.type === 'direct' ? 0 : 1);
        transitOk = stops === 1;
      } else if (this.transitFilter === 'twoStop') {
        const stops = flight.totalStops !== undefined ? flight.totalStops : 0;
        transitOk = stops === 2;
      }
      return priceOk && departureOk && arrivalOk && transitOk;
    });
  }
      
  applyFilters(): void {
    this.isLoading = true;
    
    setTimeout(() => {
      if (this.formType === 'one-way') {
        this.filterOneWayFlights();
      } else if (this.formType === 'round-trip') {
        this.filterRoundTripFlights();
      } else if (this.formType === 'multi-city') {
        this.filterMultiCityFlights();
      }      
  
      // Check if flights are available
      this.checkFlightsAvailability();
      this.isLoading = false;
  
      // Auto-select Morning filter if not manually selected and a flight exists in that range
      // if (this.formType === 'one-way' && this.filteredCardData.length > 0 && this.selectedDepartureIndex === null) {
      //   const morningIndex = this.timeFrames.findIndex(tf => tf.name === 'Morning');
      //   if (morningIndex !== -1) {
      //     const hasMorning = this.filteredCardData.some(flight =>
      //       this.isTimeWithinRange(flight.departure_time, this.timeFrames[morningIndex].timePeriod)
      //     );
      //     if (hasMorning) {
      //       this.selectedDepartureIndex = morningIndex;
      //       // Reapply filters now that a departure filter is in place.
      //       this.filterOneWayFlights();
      //     }
      //   }
      // }
    }, 1000); // timeout as per your original code
  }
  
  // Called when the price slider changes
  onPriceSliderChange(): void {
    // Don't modify maxPrice here, just apply filters
    this.applyFilters();
  }

  // Called when a departure time button is clicked
  selectDepartureButton(index: number): void {
    this.selectedDepartureIndex = index;
    this.applyFilters();
  }

  // Called when an arrival time button is clicked
  selectArrivalButton(index: number): void {
    this.selectedArrivalIndex = index;
    this.applyFilters();
  }
  onTransitFilterChange(): void {
    this.applyFilters();
  }

  // Optimized XML handler for one-way flights (direct + connecting)
  handleXMLResponse(response: string, origin: string, destination: string) {
    this.isLoading = true;
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(response, 'application/xml');
      if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
        console.error('Error parsing XML');
        throw new Error('Error parsing XML');
      }
      // Build pricing map using AirPricePoint elements.
      const airPricePointElements = Array.from(
        xmlDoc.getElementsByTagName('air:AirPricePoint')
      );
      const pricingMap = this.buildSegmentPriceMap(airPricePointElements);
      const seatsMap = this.extractSeatsInfoFromPricePoint(airPricePointElements);
      const airSegments = Array.from(
        xmlDoc.getElementsByTagName('air:AirSegment')
      );
      const airFlightDetails = Array.from(
        xmlDoc.getElementsByTagName('air:FlightDetails')
      );
      const fareInfoElements = Array.from(
        xmlDoc.getElementsByTagName('air:FareInfo')
      );

      const flightsFromDetails = this.extractFlights(
        pricingMap,
        airSegments,
        airFlightDetails
      );
      const connectingRoutes = this.findConnectingFlights(
        flightsFromDetails,
        origin,
        destination
      );

      const directFlights = this.processDirectFlights(
        pricingMap,
        seatsMap,
        airSegments,
        airFlightDetails,
        fareInfoElements,
        (flightOrigin: string, flightDestination: string) =>
          flightOrigin === origin && flightDestination === destination,
        'direct'
      ).map((flight) => ({
        ...flight,
        // baggage: baggageInfoMap.get(flight.key) || 'No Baggage Info',
      }));

      const connectingFlights = this.processConnectingRoutes(
        connectingRoutes,
        seatsMap,
        airSegments,
        airFlightDetails,
        'connecting'
      ).map((flight) => ({
        ...flight,
        // baggage: baggageInfoMap.get(flight.flights[0]?.key) || 'No Baggage Info',
      }));

      this.cardData = [...directFlights, ...connectingFlights];
      console.log(this.cardData)
      this.filteredCardData = this.cardData;
      this.checkFlightsAvailability();
    } catch (error) {
      console.error('Error parsing flights:', error);
      this.showNoFlightsMessage = true;
    } finally {
      this.isLoading = false;
    }
  }

  // Optimized XML handler for round-trip/multi-city (onward & return)
  handleXMLResponse1(response: string, requestData: any) {
    this.isLoading = true;
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(response, 'application/xml');
      if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
        console.error('Error parsing XML');
        throw new Error('Error parsing XML');
      }
      // For round-trip/multi-city, use namespace for AirSegment.
      const airSegments = Array.from(
        xmlDoc.getElementsByTagNameNS('*', 'AirSegment')
      );
      const airFlightDetails = Array.from(
        xmlDoc.getElementsByTagName('air:FlightDetails')
      );
      const fareInfoElements = Array.from(
        xmlDoc.getElementsByTagName('air:FareInfo')
      );
      // Build pricing map.
      const airPricePointElements = Array.from(
        xmlDoc.getElementsByTagName('air:AirPricePoint')
      );
      const pricingMap = this.buildSegmentPriceMap(airPricePointElements);
      const seatsMap = this.extractSeatsInfoFromPricePoint(airPricePointElements);

      this.cardData = []; // Reset previous data

      if (requestData.formType === 'round-trip') {
        // Round Trip Logic
        this.onwardFlights = [];
        this.returnFlights = [];
        const { origin, destination } = requestData;
        const flightsFromDetails = this.extractFlights(
          pricingMap,
          airSegments,
          airFlightDetails
        );
        const onwardRoutes = this.findConnectingFlights(
          flightsFromDetails,
          origin,
          destination
        );
        const returnRoutes = this.findConnectingFlights(
          flightsFromDetails,
          destination,
          origin
        );

        const directOnwardFlights = this.processDirectFlights(
          pricingMap,
          seatsMap,
          airSegments,
          airFlightDetails,
          fareInfoElements,
          (flightOrigin: string, flightDestination: string) =>
            flightOrigin === origin && flightDestination === destination,
          'direct'
        );

        const directReturnFlights = this.processDirectFlights(
          pricingMap,
          seatsMap,
          airSegments,
          airFlightDetails,
          fareInfoElements,
          (flightOrigin: string, flightDestination: string) =>
            flightOrigin === destination && flightDestination === origin,
          'direct-return'
        );

        const connectingOnwardFlights = this.processConnectingRoutes(
          onwardRoutes,
          seatsMap,
          airSegments,
          airFlightDetails,

          'connecting'
        );
        const connectingReturnFlights = this.processConnectingRoutes(
          returnRoutes,
          seatsMap,
          airSegments,
          airFlightDetails,

          'connecting-return'
        );

        this.onwardFlights = [...directOnwardFlights, ...connectingOnwardFlights];
        this.returnFlights = [...directReturnFlights, ...connectingReturnFlights];
        if (this.onwardFlights.length > 0 && this.returnFlights.length > 0) {
          this.cardData = [
            {
              departure: this.onwardFlights[0].departure,
              arrival: this.onwardFlights[0].arrival,
              departure_day: this.onwardFlights[0].departure_day,
              return_day: this.returnFlights[0].departure_day,
            },
          ];
        }
      } else if (requestData.formType === 'multi-city') {
        // Multi-City Logic: Process each leg separately
        this.receivedMultiCityFormData = []; // Reset multi-city data
        for (let i = 0; i < requestData.legs.length; i++) {
          const { origin, destination } = requestData.legs[i];
          const directFlights = this.processDirectFlights(
            pricingMap,
            seatsMap,
            airSegments,
            airFlightDetails,
            fareInfoElements,
            (flightOrigin: string, flightDestination: string) =>
              flightOrigin === origin && flightDestination === destination,
            `multi-city-leg-${i + 1}`
          ).map((flight) => ({ ...flight, type: 'direct' }));

          const flightsFromDetails = this.extractFlights(
            pricingMap,
            airSegments,
            airFlightDetails
          );
          const connectingRoutes = this.findConnectingFlights(
            flightsFromDetails,
            origin,
            destination
          );
          const connectingFlights = this.processConnectingRoutes(
            connectingRoutes,
            seatsMap,
            airSegments,
            airFlightDetails,
            `multi-city-leg-${i + 1}`
          ).map((flight) => ({ ...flight, type: 'connecting' }));

          this.receivedMultiCityFormData.push({
            leg: i + 1,
            origin,
            destination,
            flights: [...directFlights, ...connectingFlights],
          });

          this.cardData = requestData.legs.map(
            (
              leg: { origin: any; destination: any; fromDate: any },
              index: string | number
            ) => ({
              id: index,
              departure: leg.origin,
              arrival: leg.destination,
              departure_day: leg.fromDate || 'N/A',
              flights: this.receivedMultiCityFormData[index]?.flights || [],
            })
          );
        }
      }
      this.checkFlightsAvailability();
    } catch (error) {
      console.error('Error parsing flights:', error);
      this.showNoFlightsMessage = true;
    } finally {
      this.isLoading = false;
    }
  }

  // ---------------- Helper to Format Date & Time ----------------
  formatDateTime(dateTime: string | Date): { time: string; date: string } {
    const date = new Date(dateTime);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const time = `${hours}:${minutes}`;
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    };
    const formattedDate = date.toLocaleDateString('en-US', options);
    return { time, date: formattedDate };
  }

  // ---------------- Recursively Search for Connecting Flights ----------------
  findConnectingFlights(flights: any[], origin: string, destination: string) {
    const routes: any[] = [];
    function findRoute(currentRoute: any[], lastArrivalTime: Date) {
      const lastFlight = currentRoute[currentRoute.length - 1];
      const nextFlights = flights.filter(
        (f) =>
          f.origin === lastFlight.destination &&
          f.arrivalTime > lastArrivalTime &&
          (f.departureTime.getTime() - lastArrivalTime.getTime()) /
            (1000 * 60) >=
            30 &&
          (f.departureTime.getTime() - lastArrivalTime.getTime()) /
            (1000 * 60) <=
            300
      );
      for (const nextFlight of nextFlights) {
        const newRoute = [...currentRoute, nextFlight];
        if (nextFlight.destination === destination) {
          let totalTravelTime = 0;
          const layoverDetails: Record<string, number> = {};
          for (let i = 0; i < newRoute.length; i++) {
            totalTravelTime += newRoute[i].flightTime;
            if (i > 0) {
              const layover =
                (newRoute[i].departureTime.getTime() -
                  newRoute[i - 1].arrivalTime.getTime()) /
                (1000 * 60);
              layoverDetails[newRoute[i - 1].destination] = layover;
              totalTravelTime += layover;
            }
          }
          routes.push({
            flights: newRoute,
            totalTravelTime,
            totalStops: newRoute.length - 1,
            originalOrigin: origin,
            originalDestination: destination,
            layovers: layoverDetails,
          });
        } else {
          findRoute(newRoute, nextFlight.arrivalTime);
        }
      }
    }
    const initialFlights = flights.filter((f) => f.origin === origin);
    for (const flight of initialFlights) {
      findRoute([flight], flight.arrivalTime);
    }
    routes.sort((a, b) => a.totalTravelTime - b.totalTravelTime);
    return routes;
  }

  // Add this method to check if there are flights available
  private checkFlightsAvailability() {
    if (this.formType === 'one-way') {
      this.showNoFlightsMessage = this.filteredCardData.length === 0;
    } else if (this.formType === 'round-trip') {
      this.showNoOnwardFlightsMessage = !this.filteredOnwardFlights?.length;
      this.showNoReturnFlightsMessage = !this.filteredReturnFlights?.length;
    } else if (this.formType === 'multi-city') {
      this.showNoFlightsMessagePerLeg = this.filteredCardData.map(leg =>
        !leg.filteredFlights?.length
      );
    }
  }
  

  // Add this method to get the airline logo

}
