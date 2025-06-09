import { Concentration, DataPoint } from '@/types/data';


export type Experiment = {
  id: number,
  name: string,
  date: string,
  type: ExperimentType,
  description: string,
  notes: string,
  data: DataPoint[],
  result: Concentration | null
}


export type ExperimentType = 'Ammonia' | 'IgG'
