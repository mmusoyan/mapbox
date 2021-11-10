import { Component, OnInit } from '@angular/core';
import mapboxgl, { LngLatLike } from 'mapbox-gl';
import { environment } from 'src/environments/environment';
import response from '../assets/response.json';
import polylabel from 'polylabel';

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
  areaSizeMapFilter: any[];
  minArea: number;
  maxArea?: number;
  displayText: string;
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
  features: any[];
  popup: mapboxgl.Popup = new mapboxgl.Popup({
    closeButton: false,
  });

  hoveredStateId: any = null;

  filteredFields: any[];
  style = 'mapbox://styles/mapbox/streets-v11';
  showFields = true;
  masterSelected = false;
  checklist: IFieldArea[];
  checkedList: any;
  areaSizeFilter = ['any'];

  constructor() {
    this.features = this.combineFieldsToSingleLayer();
    this.filteredFields = this.features;

    this.checklist = [
      {
        id: 1,
        areaSizeMapFilter: [
          'all',
          ['>', ['get', 'acres'], 0],
          ['<=', ['get', 'acres'], 20],
        ],
        displayText: '<= 20 acres',
        isSelected: true,
        minArea: 0,
        maxArea: 20,
      },
      {
        id: 2,
        areaSizeMapFilter: [
          'all',
          ['>', ['get', 'acres'], 20],
          ['<=', ['get', 'acres'], 50],
        ],
        displayText: '<= 50 acres',
        isSelected: true,
        minArea: 20,
        maxArea: 50,
      },
      {
        id: 3,
        areaSizeMapFilter: [
          'all',
          ['>', ['get', 'acres'], 50],
          ['<=', ['get', 'acres'], 80],
        ],
        displayText: '<= 80 acres',
        isSelected: true,
        minArea: 50,
        maxArea: 80,
      },
      {
        id: 4,
        areaSizeMapFilter: [
          'all',
          ['>', ['get', 'acres'], 80],
          ['<=', ['get', 'acres'], 120],
        ],
        displayText: '<= 120 acres',
        isSelected: true,
        minArea: 80,
        maxArea: 120,
      },
      {
        id: 5,
        areaSizeMapFilter: ['>', ['get', 'acres'], 120],
        displayText: '> 120 acres',
        isSelected: true,
        minArea: 120,
        maxArea: 1000,
      },
    ];
    this.isAllSelected();
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

    this.areaSizeFilter = [
      'any',
      ...this.checkedList.map((item: IFieldArea) => item.areaSizeMapFilter),
    ];

    this.filteredFields = this.features.filter((feature) => {
      return this.checkedList.some(
        (item: IFieldArea) =>
          feature.properties.acres > item.minArea &&
          item.maxArea &&
          feature.properties.acres < item.maxArea
      );
    });

    console.log(this.filteredFields);

    this.map?.setFilter('fields', this.areaSizeFilter);
  }

  toggleFieldsVisibility() {
    if (this.showFields) {
      this.map?.setLayoutProperty('fields', 'visibility', 'visible');
    } else {
      this.map?.setLayoutProperty('fields', 'visibility', 'none');
    }
  }

  navigateToField(field: any) {
    const pointOfInaccessibility = polylabel(
      field?.geometry?.coordinates?.[0],
      1.0
    ) as LngLatLike;

    this.popup
      .setLngLat(pointOfInaccessibility)
      .setHTML(
        `<div style="color: rgb(161, 161, 161); padding: 0 10px; display: flex; flex-direction: column;"><span>State: ${field?.properties.state.toUpperCase()}</span><span>Area: ${
          field?.properties.acres
        } acres</span></div>`
      )
      .addTo(this.map);

    this.map?.setZoom(13.5);
    this.map?.flyTo({
      center: pointOfInaccessibility,
    });
  }

  highlightField(features: any) {
    console.log(features);

    if (this.hoveredStateId) {
      this.map.removeFeatureState({
        source: 'fields',
        id: this.hoveredStateId,
      });
    }

    this.hoveredStateId = features[0].id;

    this.map.setFeatureState(
      {
        source: 'fields',
        id: this.hoveredStateId,
      },
      {
        hover: true,
      }
    );
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
      zoom: 13,
    });

    this.map.on('load', () => {
      this.map.addSource('fields', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: this.features,
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
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            1,
            0.5,
          ],
        },
      });

      this.map.setFilter('fields', this.areaSizeFilter);

      this.map.on('mousemove', 'fields', (event) => {
        if (!event.features?.length) return;

        this.highlightField(event.features);
      });

      this.map.on('mouseleave', 'fields', () => {
        if (this.hoveredStateId) {
          this.map.setFeatureState(
            { source: 'fields', id: this.hoveredStateId },
            { hover: false }
          );
        }
        this.hoveredStateId = null;
      });
    });

    this.map.on('idle', () => {});
  }
}
