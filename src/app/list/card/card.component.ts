import { Component, Input, OnInit } from '@angular/core';

interface field {
  state: string;
  geometryId: number;
  acres: number;
}

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css'],
})
export class CardComponent implements OnInit {
  @Input() field!: field;

  constructor() {}

  ngOnInit(): void {}
}
