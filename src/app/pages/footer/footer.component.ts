import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  quickLinksSections = [
    {
      title: 'Quick links',
      links: ['Home', 'About', 'FAQ', 'Get Started', 'Videos'],
    },
    {
      title: 'Quick links',
      links: ['Home', 'About', 'FAQ', 'Get Started', 'Videos'],
    },
    {
      title: 'Quick links',
      links: ['Home', 'About', 'FAQ', 'Get Started', 'Videos'],
    },
  ];
  

}
