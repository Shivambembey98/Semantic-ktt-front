import { TestBed } from '@angular/core/testing';

import { AirCreateReservationService } from './air-create-reservation.service';

describe('AirCreateReservationService', () => {
  let service: AirCreateReservationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AirCreateReservationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
