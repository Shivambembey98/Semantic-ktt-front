import { TestBed } from '@angular/core/testing';

import { AirPriceParserService } from './air-price-parser.service';

describe('AirPriceParserService', () => {
  let service: AirPriceParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AirPriceParserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
