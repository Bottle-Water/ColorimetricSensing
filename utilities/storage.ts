import { DataPoint } from "@/types/data";
import { Experiment } from "@/types/experiment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system/next";


export function serialize(object: any) {
  return JSON.stringify(object);
}


export function unserialize(object: any) {
  return JSON.parse(object);
}


export async function debugStorage() {
  const labbook = await loadLabBook();
  console.log(`Lab Book: ${serialize(labbook)}`);
  const images = [];
  for (const image of (new Directory(Paths.document, "images")).list()) {
    images.push(image.name);
  }
  console.log(`Images: ${images}`)
}


export async function deletedUnsavedExperiments() {
  const labbook = await loadLabBook();
  const experiments = [];
  for (const experiment of labbook.experiments) {
    if (labbook.unsaved.includes(experiment.id)) {
      await deleteExperiment(experiment.id);
      labbook.unsaved = labbook.unsaved.filter((element)=>{return element !== experiment.id});
      continue;
    }
    experiments.push(experiment);
  }
  labbook.experiments = experiments;
  await storeLabBook(labbook);
}


export async function getExperiments() {
  return (await loadLabBook()).experiments;
}


export async function createExperiment() {
  const labbook = await loadLabBook();
  const experiment: Experiment = {
    id: nextCount(labbook),
    name: "New Experiment",
    date: (new Date()).toISOString(),
    type: "IgG",
    description: "",
    notes: "",
    data: [],
    result: null
  };
  labbook.experiments.push(experiment);
  labbook.unsaved.push(experiment.id);
  await storeLabBook(labbook);
  return experiment.id;
}


export async function getExperiment(id: number) {
  const labbook = await loadLabBook();
  return await loadExperiment(labbook, id);
}


export async function isUnsavedExperiment(id: number) {
  const labbook = await loadLabBook();
  return labbook.unsaved.includes(id);
}


export async function saveExperiment(updates: Experiment) {
  const labbook = await loadLabBook();
  const experiment = await loadExperiment(labbook, updates.id);
  if (experiment === null) {
    return false;
  }
  experiment.name = updates.name;
  experiment.type = updates.type;
  experiment.date = updates.date;
  experiment.description = updates.description;
  experiment.notes = updates.notes;
  experiment.result = updates.result;
  labbook.unsaved = labbook.unsaved.filter((element)=>{return element !== updates.id});
  await storeLabBook(labbook);
  return true;
}


export async function deleteExperiment(id: number) {
  let deleted = false;
  const labbook = await loadLabBook();
  const experiments = [];
  for (const experiment of labbook.experiments) {
    if (experiment.id === id) {
      deleted = true;
      for (const dataPoint of experiment.data) {
        await deleteDataPoint(id, dataPoint.id);
      }
      continue;
    }
    experiments.push(experiment);
  }
  if (deleted) {
    labbook.experiments = experiments;
    await storeLabBook(labbook);
  }
  return deleted;
}


export async function createDataPoint(experimentId: number, image: string) {
  const labbook = await loadLabBook();
  const experiment = await loadExperiment(labbook, experimentId);
  if (experiment === null) {
    return null;
  }
  const id = nextCount(labbook);
  const dataPoint: DataPoint = {
    id: id,
    image: storeImage(id, image),
    spots: [],
    concentration: null
  };
  experiment.data.push(dataPoint);
  await storeLabBook(labbook);
  return dataPoint.id;
}


export async function getDataPoint(experimentId: number, id: number) {
  const labbook = await loadLabBook();
  return await loadDataPoint(labbook, experimentId, id);
}


export async function saveDataPoint(experimentId: number, updates: DataPoint) {
  const labbook = await loadLabBook();
  const dataPoint = await loadDataPoint(labbook, experimentId, updates.id);
  if (dataPoint === null) {
    return false;
  }
  dataPoint.spots = updates.spots;
  dataPoint.concentration = updates.concentration;
  await storeLabBook(labbook);
  return true;
}


export async function deleteDataPoint(experimentId: number, id: number) {
  let deleted = false;
  const labbook = await loadLabBook();
  const experiment = await loadExperiment(labbook, experimentId);
  if (experiment === null) {
    return deleted;
  }
  const data = [];
  for (const dataPoint of experiment.data) {
    if (dataPoint.id === id) {
      deleted = true;
      unstoreImage(dataPoint.image);
      continue;
    }
    data.push(dataPoint);
  }
  if (deleted) {
    experiment.data = data;
    await storeLabBook(labbook);
  }
  return deleted;
}


/* Internal */


type LabBook = {
  count: number,
  experiments: Experiment[],
  unsaved: number[]
}


function nextCount(labbook: LabBook) {
  const count = labbook.count;
  labbook.count += 1;
  return count;
}


async function loadLabBook(): Promise<LabBook> {
  const json = await AsyncStorage.getItem('labbook');
  if (json == null) {
    const labbook: LabBook = {
      count: 0,
      experiments: [],
      unsaved: []
    };
    await storeLabBook(labbook);
    return labbook;
  }
  return unserialize(json);
}


async function storeLabBook(labbook: LabBook) {
  await AsyncStorage.setItem('labbook', serialize(labbook));
  return;
}


async function loadExperiment(labbook: LabBook, id: number) {
  for (const experiment of labbook.experiments) {
    if (experiment.id === id) {
      return experiment;
    }
  }
  return null;
}


async function loadDataPoint(labbook: LabBook, experimentId: number, id: number) {
  const experiment = await loadExperiment(labbook, experimentId);
  if (experiment === null) {
    return null;
  }
  for (const dataPoint of experiment.data) {
    if (dataPoint.id === id) {
      return dataPoint;
    }
  }
  return null;
}


function storeImage(id: number, image: string) {
  const images = new Directory(Paths.document, "images");
  if (!images.exists) {
    images.create();
  }
  const tmp = new File(image);
  const prs = new File(images, `${id}${tmp.extension}`);
  tmp.copy(prs);
  return prs.uri;
}


function unstoreImage(image: string) {
  const file = new File(image);
  if (file.exists) {
    file.delete();
  }
  return;
}
