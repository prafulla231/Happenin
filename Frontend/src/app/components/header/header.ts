import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface HeaderButton {
  text: string;
  action: string;
  icon?: string;
  style?: 'primary' | 'secondary' | 'default';
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class HeaderComponent {
  @Input() userName: string = '';
  @Input() title: string = 'Dashboard';
  @Input() buttons: HeaderButton[] = [];
  @Output() buttonClick = new EventEmitter<string>();

  onButtonClick(action: string): void {
    this.buttonClick.emit(action);
  }
}
