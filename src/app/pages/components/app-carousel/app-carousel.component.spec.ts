import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppCarouselComponent } from './app-carousel.component';

describe('AppCarouselComponent', () => {
  let component: AppCarouselComponent;
  let fixture: ComponentFixture<AppCarouselComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppCarouselComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppCarouselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
