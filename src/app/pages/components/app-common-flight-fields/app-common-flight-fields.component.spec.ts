import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppCommonFlightFieldsComponent } from './app-common-flight-fields.component';

describe('AppCommonFlightFieldsComponent', () => {
  let component: AppCommonFlightFieldsComponent;
  let fixture: ComponentFixture<AppCommonFlightFieldsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppCommonFlightFieldsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppCommonFlightFieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
