import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppFlightTypeTabsComponent } from './app-flight-type-tabs.component';

describe('AppFlightTypeTabsComponent', () => {
  let component: AppFlightTypeTabsComponent;
  let fixture: ComponentFixture<AppFlightTypeTabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppFlightTypeTabsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppFlightTypeTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
