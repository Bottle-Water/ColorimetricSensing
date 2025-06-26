export type Circle = {
  x: number,
  y: number,
  r: number
}


export type Color = {
  format: ColorFormat,
  values: number[]
}


export type ColorFormat = "rgb"


export type Concentration = {
  value: number,
  units: Units
}


export type DataPoint = {
  id: number,
  image: string,
  spots: Spot[],
  concentration: Concentration | null
}


export type Spot = {
  type: SpotType,
  area: Circle,
  color?: Color
}


export type SpotType = "reference" | "sample"


export type Units = "ppm"
