import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule, NgIf } from '@angular/common';
import { AirCreateReservationService } from '../../services/air-create-reservation/air-create-reservation.service';

@Component({
  selector: 'app-flight-confirm',
  standalone: true,
  imports: [RouterLink, CommonModule, NgIf],
  templateUrl: './flight-confirm.component.html',
  styleUrl: './flight-confirm.component.css'
})
export class FlightConfirmComponent {
showDetails = true;
toggleDetails() {
  this.showDetails = !this.showDetails;
}
}
