import { Component } from '@angular/core';
import { HeaderComponent } from '../../pages/header/header.component';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FooterComponent } from "../../pages/footer/footer.component";
import { LandingComponent } from "../landing/landing.component";

@Component({
  selector: 'app-layout',
  imports: [HeaderComponent, RouterOutlet, FooterComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
  standalone: true,
})
export class LayoutComponent {}
