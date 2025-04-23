import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchFormComponent } from '../../feature/search-form/search-form.component';
import { FooterComponent } from '../../pages/footer/footer.component';
import { HeaderComponent } from '../../pages/header/header.component';
import { ActivatedRoute } from '@angular/router';
import { Router, RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    SearchFormComponent,
    RouterModule,
    CommonModule
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent implements OnInit {
  constructor(private routes: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {}
}
