export type Calculation = {
  distance: number,
  concentration: Concentration
}


export type Circle = {
  x: number,
  y: number,
  r: number
}


export type Concentration = {
  value: number,
  units: Units
}


export type DataPoint = {
  id: number,
  image: string,
  spots: Spot[]
}


export type ReferenceSpot = {
  type: ReferenceType,
  area: Circle,
  color: RGBcolor
}


export type ReferenceType = "baseline" | "black" | "white"


export type RGBcolor = {
  red: number,
  green: number,
  blue: number
}


export type SampleSpot = {
  type: SampleType,
  area: Circle,
  color: RGBcolor,
  calculation?: Calculation
}


export type SampleType = "sample"


export type Spot = ReferenceSpot | SampleSpot


export type SpotType = ReferenceType | SampleType


export type Units = "mg/mL"
