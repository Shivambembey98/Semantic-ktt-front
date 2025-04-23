import { TestBed } from '@angular/core/testing';

import { FlightFilterService } from './flight-filter.service';

describe('FlightFilterService', () => {
  let service: FlightFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FlightFilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
