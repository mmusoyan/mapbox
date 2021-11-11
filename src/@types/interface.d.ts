export interface IField {
  acres: number;
  geometry: string;
  geometryId: number;
  state: string;
}

interface IGeometry {
  coordinates: any[];
  type: string;
}

interface IProperty {
  acres: number;
  geom_id: number | string;
  state: string;
}

export interface IFeature {
  id: string | number;
  type: string;
  geometry: IGeometry;
  properties: IProperty;
}

export interface IFieldArea {
  id: number;
  areaSizeMapFilter: any[];
  minArea: number;
  maxArea?: number;
  displayText: string;
  isSelected: boolean;
}
