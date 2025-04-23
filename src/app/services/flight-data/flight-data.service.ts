import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Flight {
  key: string;
  origin: string;
  destination: string;
  departure_time: string; // e.g., "08:30"
  arrival_time: string;   // e.g., "12:45"
  price: string;
  type: string;           // "direct" or "connecting"
  totalStops?: number;
  // ... add additional properties if needed
}

@Injectable({
  providedIn: 'root'
})
export class FlightDataService {
  constructor(private http: HttpClient) {}

  /**
   * Fetch flights via the low-fare search endpoint.
   * Adjust the URL and parameters as per your back-end API.
   */
  fetchFlights(formData: any): Observable<string> {
    return this.http.get('YOUR_API_ENDPOINT', {
      params: formData,
      responseType: 'text'
    });
  }

  /**
   * PRIVATE HELPER METHODS
   */

  /**
   * Builds a map of segment pricing from a list of AirPricePoint elements.
   */
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
      const airPricingInfos = Array.from(pricePoint.getElementsByTagName('air:AirPricingInfo'));
      airPricingInfos.forEach((api) => {
        const totalPrice = api.getAttribute('TotalPrice') || '0';
        const basePrice = api.getAttribute('BasePrice') || '0';
        const taxes = api.getAttribute('Taxes') || '0';

        const bookingInfos = Array.from(api.getElementsByTagName('air:BookingInfo'));
        bookingInfos.forEach((bi) => {
          const segRef = bi.getAttribute('SegmentRef');
          const bookingCode = bi.getAttribute('BookingCode') || '';
          if (segRef) {
            const entry = { totalPrice, basePrice, taxes, bookingCode };
            const existing = segmentPriceMap.get(segRef) || [];
            existing.push(entry);
            // Sort by the numeric total price in ascending order.
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

  /**
   * Extracts a map of available seats for each segment.
   */
  private extractSeatsInfoFromPricePoint(airPricePointElements: Element[]): Map<string, string> {
    const seatsMap = new Map<string, string>();
    airPricePointElements.forEach((pricePoint) => {
      const airPricingInfos = Array.from(pricePoint.getElementsByTagName('air:AirPricingInfo'));
      airPricingInfos.forEach((api) => {
        const bookingInfos = Array.from(api.getElementsByTagName('air:BookingInfo'));
        bookingInfos.forEach((bi) => {
          const bookingCount = bi.getAttribute('BookingCount');
          const segRef = bi.getAttribute('SegmentRef') || '';
          if (bookingCount) {
            seatsMap.set(segRef, bookingCount);
          }
        });
      });
    });
    return seatsMap;
  }

  /**
   * Extracts flights from the given pricing map, segments and flight details.
   */
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
  ): Flight[] {
    const flights: Flight[] = [];

    // Build a map of FlightDetails by key.
    const flightDetailsMap = new Map<string, Element>();
    flightDetails.forEach((detail) => {
      const key = detail.getAttribute('Key');
      if (key) {
        flightDetailsMap.set(key, detail);
      }
    });

    // Build a map of segments by key.
    const segmentMap = new Map<string, Element>();
    segments.forEach((segment) => {
      const key = segment.getAttribute('Key');
      if (key) {
        segmentMap.set(key, segment);
      }
    });

    // Iterate over each pricing key to create flight objects.
    for (const [segKey, priceArray] of pricingMap.entries()) {
      const segment = segmentMap.get(segKey);
      if (!segment) continue;
      const carrier = segment.getAttribute('Carrier') || '';
      const flightNumber = segment.getAttribute('FlightNumber') || '';
      // Get provider code from AirAvailInfo if available.
      const airAvailInfo = segment.querySelector('AirAvailInfo');
      // Obtain flight details reference.
      const flightDetailsRef = segment.getElementsByTagName('air:FlightDetailsRef')[0];
      const flightDetailsKey = flightDetailsRef ? flightDetailsRef.getAttribute('Key') || '' : '';
      const flightDetail = flightDetailsMap.get(flightDetailsKey);
      const priceInfo = Array.isArray(priceArray) ? priceArray[0] : priceArray;
      const priceStr = priceInfo.totalPrice?.replace(/[^\d.]/g, '');
      flights.push({
        key: segKey,
        origin: flightDetail ? flightDetail.getAttribute('Origin') || '' : '',
        destination: flightDetail ? flightDetail.getAttribute('Destination') || '' : '',
        departure_time: flightDetail
          ? new Date(flightDetail.getAttribute('DepartureTime') || '')
              .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '',
        arrival_time: flightDetail
          ? new Date(flightDetail.getAttribute('ArrivalTime') || '')
              .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '',
        price: priceStr ? Math.floor(parseFloat(priceStr)).toString() : '0',
        type: '', // To be set based on further processing.
        totalStops: 0,
      });
    }
    return flights;
  }

  /**
   * Processes direct flights from the pricing map using a filter function.
   * The filter function here checks if the flight’s origin and destination match.
   */
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
  ): Flight[] {
    const flights: Flight[] = [];

    // Build a map for flight details.
    const flightDetailsMap = new Map<string, Element>();
    flightDetails.forEach((detail) => {
      const key = detail.getAttribute('Key');
      if (key) flightDetailsMap.set(key, detail);
    });

    // Build a map for segments.
    const segmentMap = new Map<string, Element>();
    segments.forEach((seg) => {
      const key = seg.getAttribute('Key');
      if (key) segmentMap.set(key, seg);
    });

    for (const [segKey, priceArray] of pricingMap.entries()) {
      const segment = segmentMap.get(segKey);
      if (!segment) continue;
      const flightNumber = segment.getAttribute('FlightNumber') || 'Unknown Flight Number';
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

      // Get flight details reference.
      const flightDetailsRef = segment.getElementsByTagName('air:FlightDetailsRef')[0];
      const flightDetailsKey = flightDetailsRef ? flightDetailsRef.getAttribute('Key') || '' : '';
      let flightOrigin = departure;
      let flightDestination = arrival;
      const flightDetail = flightDetailsMap.get(flightDetailsKey);
      if (flightDetail) {
        flightOrigin = flightDetail.getAttribute('Origin') || departure;
        flightDestination = flightDetail.getAttribute('Destination') || arrival;
      }
      if (!filterFn(flightOrigin, flightDestination)) {
        continue;
      }
      flights.push({
        key: segKey,
        origin: flightOrigin,
        destination: flightDestination,
        departure_time: new Date(departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        arrival_time: new Date(arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        price: (() => {
          const priceInfo = Array.isArray(priceArray) ? priceArray[0] : priceArray;
          const priceStr = priceInfo.totalPrice?.replace(/[^\d.]/g, '');
          return priceStr ? Math.floor(parseFloat(priceStr)).toString() : '0';
        })(),
        type: type,
        totalStops: type === 'direct' ? 0 : 1,
      });
    }
    return flights;
  }

  /**
   * Processes connecting routes by summing prices of individual segments.
   */
  private processConnectingRoutes(
    routes: any[],
    seatsMap: Map<string, string>,
    segments: Element[],
    flightDetails: Element[],
    type: string
  ): Flight[] {
    // Build maps for flight details and segments.
    const flightDetailsMap = new Map<string, Element>();
    flightDetails.forEach((detail) => {
      const key = detail.getAttribute('Key');
      if (key) flightDetailsMap.set(key, detail);
    });
    const airSegmentMap = new Map<string, Element>();
    segments.forEach((seg) => {
      const key = seg.getAttribute('Key');
      if (key) airSegmentMap.set(key, seg);
    });
    const flights: Flight[] = [];
    routes.forEach(route => {
      const firstFlight = route.flights[0];
      const lastFlight = route.flights[route.flights.length - 1];
      const totalPrice = route.flights.reduce((sum: number, flight: any) => sum + parseFloat(flight.price || '0'), 0);
      const totalStops = route.flights.length - 1;
      // Compute minimum available seats among the segments.
      const flightsWithSeats = route.flights.map((flight: any) => {
        const seats = parseInt(seatsMap.get(flight.key) || '0', 10);
        return { ...flight, seatsLeft: seats };
      });
      const minSeatsLeft = Math.min(...flightsWithSeats.map((f: { seatsLeft: any; }) => f.seatsLeft));
      // Map detailed flight info from segments.
      const flightsWithDetails = route.flights.map((flight: any) => {
        const segment = airSegmentMap.get(flight.key);
        const flightDetailsRef = segment ? segment.getElementsByTagName('air:FlightDetailsRef')[0] : null;
        const flightDetailKey = flightDetailsRef ? flightDetailsRef.getAttribute('Key') || '' : '';
        const detail = flightDetailsMap.get(flightDetailKey);
        return {
          ...flight,
          origin: detail ? detail.getAttribute('Origin') || flight.origin : flight.origin,
          destination: detail ? detail.getAttribute('Destination') || flight.destination : flight.destination,
          departure_time: segment ? segment.getAttribute('DepartureTime') || flight.departure_time : flight.departure_time,
          arrival_time: segment ? segment.getAttribute('ArrivalTime') || flight.arrival_time : flight.arrival_time,
          totalStops: totalStops,
        };
      });
      flights.push({
        key: firstFlight.key, // Use the key of the first segment (or combine keys as needed)
        origin: firstFlight.origin,
        destination: lastFlight.destination,
        departure_time: flightsWithDetails[0].departure_time,
        arrival_time: flightsWithDetails[flightsWithDetails.length - 1].arrival_time,
        price: Math.floor(totalPrice).toString(),
        type: type,
        totalStops: totalStops,
      });
    });
    return flights;
  }

  /**
   * Recursively searches for connecting flights.
   * Returns an array of routes with each route containing an array of Flight objects,
   * the total travel time, and layover details.
   */
  public findConnectingFlights(flights: Flight[], origin: string, destination: string): any[] {
    const routes: any[] = [];

    function findRoute(currentRoute: Flight[], lastArrivalTime: Date) {
      const lastFlight = currentRoute[currentRoute.length - 1];
      // Filter for next possible flights with a layover of 30 to 300 minutes.
      const nextFlights = flights.filter(f => {
        const flightDeparture = new Date(`1970-01-01T${f.departure_time}:00`);
        const flightArrival = new Date(`1970-01-01T${lastFlight.arrival_time}:00`);
        const diffMinutes = (flightDeparture.getTime() - flightArrival.getTime()) / (1000 * 60);
        return f.origin === lastFlight.destination &&
               flightDeparture > lastArrivalTime &&
               diffMinutes >= 30 &&
               diffMinutes <= 300;
      });
      for (const nextFlight of nextFlights) {
        const newRoute = [...currentRoute, nextFlight];
        if (nextFlight.destination === destination) {
          let totalTravelTime = 0;
          const layoverDetails: Record<string, number> = {};
          for (let i = 0; i < newRoute.length; i++) {
            // (Optionally) add flight times if available.
            if (i > 0) {
              const prevArrival = new Date(`1970-01-01T${newRoute[i - 1].arrival_time}:00`);
              const currDeparture = new Date(`1970-01-01T${newRoute[i].departure_time}:00`);
              const layover = (currDeparture.getTime() - prevArrival.getTime()) / (1000 * 60);
              layoverDetails[newRoute[i - 1].destination] = layover;
              totalTravelTime += layover;
            }
          }
          routes.push({
            flights: newRoute,
            totalTravelTime,
            totalStops: newRoute.length - 1,
            layovers: layoverDetails
          });
        } else {
          findRoute(newRoute, new Date(`1970-01-01T${nextFlight.arrival_time}:00`));
        }
      }
    }

    const initialFlights = flights.filter(f => f.origin === origin);
    for (const flight of initialFlights) {
      findRoute([flight], new Date(`1970-01-01T${flight.arrival_time}:00`));
    }
    routes.sort((a, b) => a.totalTravelTime - b.totalTravelTime);
    return routes;
  }

  /**
   * PUBLIC METHOD
   * Parses the XML response and returns an array of Flight objects.
   * Combines multiple helper methods to extract both direct and connecting flights.
   */
  public parseFlightXML(response: string): Flight[] {
    const flights: Flight[] = [];
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(response, 'application/xml');
    if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
      console.error('Error parsing XML');
      return flights;
    }

    // Retrieve AirPricePoint elements.
    const airPricePointElements = Array.from(
      xmlDoc.getElementsByTagName('air:AirPricePoint')
    );
    const pricingMap = this.buildSegmentPriceMap(airPricePointElements);
    const seatsMap = this.extractSeatsInfoFromPricePoint(airPricePointElements);

    // Retrieve segment and flight detail elements.
    const airSegments = Array.from(xmlDoc.getElementsByTagName('air:AirSegment'));
    const airFlightDetails = Array.from(xmlDoc.getElementsByTagName('air:FlightDetails'));
    const fareInfoElements = Array.from(xmlDoc.getElementsByTagName('air:FareInfo'));

    // Extract direct flights.
    const directFlights = this.processDirectFlights(
      pricingMap,
      seatsMap,
      airSegments,
      airFlightDetails,
      fareInfoElements,
      // Simple filter function – adjust if needed.
      (flightOrigin: string, flightDestination: string) => true,
      'direct'
    );

    // Extract all flights (unsorted) from the pricing data.
    const allFlights = this.extractFlights(pricingMap, airSegments, airFlightDetails);
    // Assume the first flight’s origin and destination define the search. You may pass parameters here.
    const connectingRoutes = this.findConnectingFlights(
      allFlights,
      allFlights[0]?.origin || '',
      allFlights[0]?.destination || ''
    );
    const connectingFlights = this.processConnectingRoutes(
      connectingRoutes,
      seatsMap,
      airSegments,
      airFlightDetails,
      'connecting'
    );

    return [...directFlights, ...connectingFlights];
  }

  /**
   * Computes and returns the price range (minimum and maximum) from a set of flights.
   */
  public computePriceRange(cardData: Flight[]): { min: number; max: number } {
    if (cardData.length === 0) {
      return { min: 0, max: 0 };
    }
    const prices = cardData.map(f => Number(f.price));
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }
}
