import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-flight-type-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="nav nav-pills form-type">
      <div class="nav-item">
        <button 
          [class.active]="activeTab === 'oneWay'"
          (click)="onTabClick('oneWay')"
          class="nav-link">
          One Way
        </button>
      </div>
      <div class="nav-item">
        <button 
          [class.active]="activeTab === 'roundTrip'"
          (click)="onTabClick('roundTrip')"
          class="nav-link">
          Round Trip
        </button>
      </div>
      <div class="nav-item">
        <button 
          [class.active]="activeTab === 'multiCity'"
          (click)="onTabClick('multiCity')"
          class="nav-link">
          Multi City
        </button>
      </div>
    </div>
  `,
  styles: [`
    .form-type {
      border-bottom: 5px solid #007191;
      display: flex;
      gap: 10px;
      padding-bottom: 2px;
    }
    .nav-link {
      cursor: pointer;
      color: black;
    }
    .nav-link.active {
      background-color: #007191;
      color: white;
    }
  `]
})
export class AppFlightTypeTabsComponent {
  @Input() activeTab: string = 'oneWay';
  @Output() tabChange = new EventEmitter<string>();

  onTabClick(tabName: string): void {
    this.tabChange.emit(tabName);
  }
}
