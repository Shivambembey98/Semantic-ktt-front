import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModifySearchComponent } from './modify-search.component';

describe('ModifySearchComponent', () => {
  let component: ModifySearchComponent;
  let fixture: ComponentFixture<ModifySearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModifySearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModifySearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
