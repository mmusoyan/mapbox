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

// todo:
// interfaces for
// properties: acre geom state
// geometry: type coordinates

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  map!: mapboxgl.Map;
  response = response;
  style = 'mapbox://styles/mapbox/streets-v11';

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
      this.map.addSource('states', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: this.combineFieldsToSingleLayer(),
        },
      });

      this.map.addLayer({
        id: 'draw-states',
        type: 'fill',
        source: 'states',
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
    });
  }
}
