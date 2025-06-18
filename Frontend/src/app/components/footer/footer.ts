import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss']
})
export class FooterComponent {
  @Input() brandName: string = "Happenin'";
  @Input() contactEmail: string = 'happenin.events.app@gmail.com';
  @Input() showSocials: boolean = false;
  @Input() customMessage: string = '';
}
