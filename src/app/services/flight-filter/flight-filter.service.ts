import { Injectable } from '@angular/core';

export interface FlightFilterCriteria {
  minPrice: number;                       // Computed minimum price from flight data.
  currentPrice: number;                   // Upper bound price selected on slider.
  selectedDepartureIndex: number | null;  // Index into the timeFrames array for departure.
  selectedArrivalIndex: number | null;    // Index into the timeFrames array for arrival.
  transitFilter: string;                  // 'direct', 'connecting', or 'both'
  timeFrames: { name: string; timePeriod: string }[];  // e.g. [ { name:'Morning', timePeriod:'06:00-12:00' }, ... ]
}

@Injectable({
  providedIn: 'root'
})
export class FlightFilterService {
  /**
   * Checks if a time string (format "HH:mm") falls within the provided time range ("HH:mm-HH:mm").
   * Handles ranges that span midnight.
   */
  isTimeWithinRange(time: string, range: string): boolean {
    const [startStr, endStr] = range.split('-');
    const [timeH, timeM] = time.split(':').map(Number);
    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);

    const timeMinutes = timeH * 60 + timeM;
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes <= endMinutes) {
      return timeMinutes >= startMinutes && timeMinutes < endMinutes;
    } else {
      // When the range spans midnight, e.g., "18:00-00:00"
      return timeMinutes >= startMinutes || timeMinutes < endMinutes;
    }
  }

  /**
   * Generic filtering method which applies price, departure time, arrival time,
   * and transit (flight type) filters against an array of flight data.
   *
   * For transitFilter:
   * - If 'direct': only include flights whose type property (in lowercase) exactly equals 'direct'.
   * - If 'connecting': only include flights whose type equals 'connecting'.
   * - If 'both': no filtering is applied on the flight type.
   */
  filterFlights(cardData: any[], criteria: FlightFilterCriteria): any[] {
    return cardData.filter(flight => {
      // Price filter: ensure flight.price falls within the selected range.
      const flightPrice = Number(flight.price);
      const priceOk = flightPrice >= criteria.minPrice && flightPrice <= criteria.currentPrice;

      // Departure time filter.
      let departureOk = true;
      if (criteria.selectedDepartureIndex !== null) {
        const timeRange = criteria.timeFrames[criteria.selectedDepartureIndex].timePeriod;
        departureOk = this.isTimeWithinRange(flight.departure_time, timeRange);
      }

      // Arrival time filter.
      let arrivalOk = true;
      if (criteria.selectedArrivalIndex !== null) {
        const timeRange = criteria.timeFrames[criteria.selectedArrivalIndex].timePeriod;
        arrivalOk = this.isTimeWithinRange(flight.arrival_time, timeRange);
      }

      // Transit filter: check for direct or connecting. If criteria transit is 'both', then no filtering.
      let transitOk = true;
      if (criteria.transitFilter === 'direct') {
        transitOk = flight.type.toLowerCase() === 'direct';
      } else if (criteria.transitFilter === 'connecting') {
        transitOk = flight.type.toLowerCase() === 'connecting';
      }

      return priceOk && departureOk && arrivalOk && transitOk;
    });
  }

  /**
   * Filter one-way flight data.
   * This method assumes the data comes as a single array of flight objects.
   */
  filterOneWayFlights(cardData: any[], criteria: FlightFilterCriteria): any[] {
    return this.filterFlights(cardData, criteria);
  }

  /**
   * Filter round-trip flight data.
   * Expected input: two arrays of flight objects, one for onward flights and one for return flights.
   * Returns an object with filtered results for onward and return flights.
   */
  filterRoundTripFlights(onwardFlights: any[], returnFlights: any[], criteria: FlightFilterCriteria): { filteredOnward: any[], filteredReturn: any[] } {
    const filteredOnward = this.filterFlights(onwardFlights, criteria);
    const filteredReturn = this.filterFlights(returnFlights, criteria);
    return { filteredOnward, filteredReturn };
  }

  /**
   * Filter multi-city flight data.
   * Expected input: an array of leg objects, where each leg contains a 'flights' array.
   * This method applies the filter to each leg independently, storing the filtered flights as a new property.
   */
  filterMultiCityFlights(legs: any[], criteria: FlightFilterCriteria): any[] {
    return legs.map(leg => {
      const filteredFlights = this.filterFlights(leg.flights, criteria);
      return {
        ...leg,
        filteredFlights
      };
    });
  }
}
