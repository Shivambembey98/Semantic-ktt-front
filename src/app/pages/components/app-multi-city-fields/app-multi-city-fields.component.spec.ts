import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppMultiCityFieldsComponent } from './app-multi-city-fields.component';

describe('AppMultiCityFieldsComponent', () => {
  let component: AppMultiCityFieldsComponent;
  let fixture: ComponentFixture<AppMultiCityFieldsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppMultiCityFieldsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppMultiCityFieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
