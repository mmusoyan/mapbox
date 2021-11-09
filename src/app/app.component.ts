import { Component, OnInit } from '@angular/core';
import mapboxgl from 'mapbox-gl';
import { environment } from 'src/environments/environment';
import response from '../assets/response.json';

interface IField {
  state: string;
  geometryId: number;
  geometry: string;
  acres: number;
}

interface IFeature {
  type: string;
  geometry: any;
  id: string | number;
  properties: any;
}

interface IFieldArea {
  id: number;
  value: string;
  isSelected: boolean;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  map!: mapboxgl.Map;
  response = response;
  style = 'mapbox://styles/mapbox/streets-v11';
  showFields = true;
  masterSelected = false;
  checklist: IFieldArea[];
  checkedList: any;

  constructor() {
    this.checklist = [
      { id: 1, value: '<= 20>', isSelected: false },
      { id: 2, value: '<= 50', isSelected: false },
      { id: 3, value: '<= 80>', isSelected: false },
      { id: 4, value: '<= 120>', isSelected: false },
      { id: 5, value: '> 120', isSelected: false },
    ];
    this.getCheckedItemList();
  }

  checkUncheckAll() {
    for (let i = 0; i < this.checklist?.length; i++) {
      this.checklist[i].isSelected = this.masterSelected;
    }
    this.getCheckedItemList();
  }

  isAllSelected() {
    this.masterSelected = this.checklist.every(function (
      areaFilter: IFieldArea
    ) {
      return areaFilter.isSelected == true;
    });
    this.getCheckedItemList();
  }

  getCheckedItemList() {
    this.checkedList = [];
    for (let i = 0; i < this.checklist?.length; i++) {
      if (this.checklist[i].isSelected)
        this.checkedList.push(this.checklist[i]);
    }
    this.checkedList = JSON.stringify(this.checkedList);
    console.log(this.checkedList);
  }

  toggleFieldsVisibility() {
    if (this.showFields) {
      this.map.setLayoutProperty('fields', 'visibility', 'visible');
    } else {
      this.map.setLayoutProperty('fields', 'visibility', 'none');
    }
  }

  combineFieldsToSingleLayer = () => {
    const features: any[] = [];

    this.response?.fields?.forEach((field: IField) => {
      const fieldData = JSON.parse(field?.geometry);

      fieldData.features.forEach((feature: IFeature) => {
        features.push({
          ...feature,
          id: feature?.properties?.geom_id || '',
        });
      });
    });

    return features;
  };

  ngOnInit() {
    this.map = new mapboxgl.Map({
      accessToken: environment.mapbox.accessToken,
      container: 'map',
      style: this.style,
      center: [-88.4205588686028, 40.124084947779],
      zoom: 15,
    });

    this.map.on('load', () => {
      this.map.addSource('fields', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: this.combineFieldsToSingleLayer(),
        },
      });

      this.map.addLayer({
        id: 'fields',
        type: 'fill',
        source: 'fields',
        layout: {},
        paint: {
          'fill-color': [
            'case',
            ['all', ['>', ['get', 'acres'], 0], ['<=', ['get', 'acres'], 20]],
            '#E8474B',
            ['<=', ['get', 'acres'], 50],
            '#26B0F9',
            ['<=', ['get', 'acres'], 80],
            '#F4B939',
            ['<=', ['get', 'acres'], 120],
            '#01BC66',
            '#A39BFE',
          ],
          'fill-opacity': 0.5,
        },
      });

      // todo: generate the filter dynamically from checkboxes
      this.map.setFilter('fields', [
        'any',
        ['all', ['>', ['get', 'acres'], 0], ['<=', ['get', 'acres'], 20]],
        ['all', ['>', ['get', 'acres'], 20], ['<=', ['get', 'acres'], 50]],
        ['all', ['>', ['get', 'acres'], 50], ['<=', ['get', 'acres'], 80]],
        ['all', ['>', ['get', 'acres'], 80], ['<=', ['get', 'acres'], 120]],
        ['>', ['get', 'acres'], 120],
      ]);
    });

    this.map.on('idle', () => {});
  }
}
