import { Component, Input, OnInit } from '@angular/core';

// interface IField {
//   state: string;
//   geometryId: number;
//   acres: number;
// }

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css'],
})
export class CardComponent implements OnInit {
  @Input() feature!: any;

  constructor() {}

  ngOnInit(): void {}
}
