import { Component, OnInit } from '@angular/core';
import mapboxgl, { LngLatLike, MapboxGeoJSONFeature } from 'mapbox-gl';
import polylabel from 'polylabel';
import { environment } from 'src/environments/environment';
import dataSource from '../assets/dataSource.json';
import { IFeature, IField, IFieldArea, IProperty } from '../@types/interface';

const MAP_STYLE = 'mapbox://styles/mapbox/streets-v11';
const MAP_NAME = 'fields';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  map: mapboxgl.Map | null = null;
  popup: mapboxgl.Popup = new mapboxgl.Popup({
    closeButton: false,
  });
  hoveredStateId: string | number | undefined = undefined;
  showFields: boolean = true;
  masterSelected: boolean = false;
  areaSizeFilter: any[] = ['any'];
  formattedSource: any[] = [];
  filteredFields: any[] = [];
  checkedList: IFieldArea[] = [];

  fieldSizeFilter: IFieldArea[] = [
    {
      id: 1,
      areaSizeMapFilter: [
        'all',
        ['>', ['get', 'acres'], 0],
        ['<=', ['get', 'acres'], 20],
      ],
      displayText: 'less than 20 acres',
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
      displayText: 'between 20 and 50 acres',
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
      displayText: 'between 50 and 80 acres',
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
      displayText: 'between 80 and 120 acres',
      isSelected: true,
      minArea: 80,
      maxArea: 120,
    },
    {
      id: 5,
      areaSizeMapFilter: ['>', ['get', 'acres'], 120],
      displayText: 'more than 120 acres',
      isSelected: true,
      minArea: 120,
    },
  ];

  constructor() {
    this.formattedSource = this.combineFeaturesToSingleSource();
    this.filteredFields = [...this.formattedSource];

    this.updateMasterSelectedState();
  }

  checkUncheckAll() {
    for (let i = 0; i < this.fieldSizeFilter?.length; i++) {
      this.fieldSizeFilter[i].isSelected = this.masterSelected;
    }
    this.updateCheckedItems();
  }

  updateMasterSelectedState() {
    this.masterSelected = this.fieldSizeFilter.every(function (
      areaFilter: IFieldArea
    ) {
      return areaFilter.isSelected == true;
    });
    this.updateCheckedItems();
  }

  updateCheckedItems() {
    this.checkedList = [];

    for (let i = 0; i < this.fieldSizeFilter.length; i++) {
      if (this.fieldSizeFilter[i].isSelected)
        this.checkedList.push(this.fieldSizeFilter[i]);
    }

    this.areaSizeFilter = [
      'any',
      ...this.checkedList.map((item: IFieldArea) => item.areaSizeMapFilter),
    ];

    this.filteredFields = this.formattedSource.filter((feature) => {
      return this.checkedList.some((item: IFieldArea) =>
        item?.maxArea
          ? feature?.properties?.acres > item?.minArea &&
            feature?.properties?.acres < item?.maxArea
          : feature?.properties?.acres > item?.minArea
      );
    });

    this.map?.setFilter(MAP_NAME, this.areaSizeFilter);
  }

  toggleFieldsVisibility() {
    if (this.showFields) {
      this.map?.setLayoutProperty(MAP_NAME, 'visibility', 'visible');
    } else {
      this.map?.setLayoutProperty(MAP_NAME, 'visibility', 'none');
    }
  }

  navigateToField(field: IFeature) {
    if (!this.map) return;

    const pointOfInaccessibility = polylabel(
      field?.geometry?.coordinates?.[0],
      1.0
    ) as LngLatLike;

    const popupBody: string = `<div style="color: rgb(161, 161, 161); padding: 0 10px; display: flex; flex-direction: column;"><span>State: ${field?.properties?.state.toUpperCase()}</span><span>Area: ${
      field?.properties?.acres
    } acres</span></div>`;

    this.popup
      .setLngLat(pointOfInaccessibility)
      .setHTML(popupBody)
      .addTo(this.map);

    this.map?.setZoom(13.5);
    this.map?.flyTo({
      center: pointOfInaccessibility,
    });
  }

  highlightField(features: MapboxGeoJSONFeature[]) {
    if (this.hoveredStateId) {
      this.map?.removeFeatureState({
        source: MAP_NAME,
        id: this.hoveredStateId,
      });
    }

    this.hoveredStateId = features[0].id;

    this.map?.setFeatureState(
      {
        source: MAP_NAME,
        id: this.hoveredStateId,
      },
      {
        hover: true,
      }
    );
  }

  combineFeaturesToSingleSource = () => {
    const features: IFeature[] = [];

    dataSource?.fields?.forEach((field: IField) => {
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
      style: MAP_STYLE,
      center: [-88.4205588686028, 40.124084947779],
      zoom: 13,
    });

    this.map.on('load', () => {
      this.map?.addSource(MAP_NAME, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: this.formattedSource,
        },
      });

      this.map?.addLayer({
        id: MAP_NAME,
        type: 'fill',
        source: MAP_NAME,
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

      this.map?.setFilter(MAP_NAME, this.areaSizeFilter);

      this.map?.on('mousemove', MAP_NAME, (event) => {
        if (!event.features?.length) return;

        this.highlightField(event.features);
      });

      this.map?.on('mouseleave', MAP_NAME, () => {
        if (this.hoveredStateId) {
          this.map?.setFeatureState(
            { source: MAP_NAME, id: this.hoveredStateId },
            { hover: false }
          );
        }
        this.hoveredStateId = undefined;
      });
    });
  }
}
