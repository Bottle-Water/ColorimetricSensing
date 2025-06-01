import Button from "@/components/button";
import Scanner from "@/components/scanner";
import { faArrowLeft, faArrowUpFromBracket, faCheck, faPenToSquare, faPlus, faRotateLeft, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";


export type ExperimentalDataPoint = {
  imguri: string;
  reference: number[];
  samples: number[];
}


export type ExperimentProps = {
  id: number;
  type: "IgG"|"Ammonia";
  name: string;
  date: string;
  description: string;
  data: ExperimentalDataPoint[];
  result: number|null;
  notes: string;
}


export function newExperimentProps(id: number): ExperimentProps {
  return {
    id: id,
    type: "IgG",
    name: "New Experiment",
    date: "",
    description: "",
    data: [],
    result: null,
    notes: "",
  }
}


export default function Experiment({
  props,
  summary=false,
  onBack=()=>{},
  onPress=()=>{}
}: {
  props: ExperimentProps,
  summary?: boolean,
  onBack?: ()=>void,
  onPress?: (props: ExperimentProps)=>void
}) {

  const [editMode, setEditMode] = useState(false);
  const [captureImage, setCaptureImage] = useState(false);

  if (summary) {
    return (
      <Pressable onPress={() => {onPress(props)}} style={styles.summarycard}>
        <View style={styles.summaryinfo}>
          <Text>{props.type}</Text>
          <Text>(#{props.id}) {props.name}</Text>
          <Text>{new Date(props.date).toDateString()}</Text>
          <Text>Description: {props.description}</Text>
        </View>
        <View style={styles.summaryresult}>
          <Text>Result:</Text>
          <View style={styles.summaryresultvalue}>
            <Text>{props.result != null ? `${props.result} ppm` : "N/A"}</Text>
          </View>
        </View>
      </Pressable>
    );
  }

  if (captureImage) {
    return <Scanner onBack={() => {setCaptureImage(false);}} />;
  }

  return (
    <>

      <View style={styles.header}>
        <Button icon={faArrowLeft} margin={10} onPress={onBack} />
        <Text style={styles.title}>Experiment</Text>
        <Button icon={editMode ? faTrash : faArrowUpFromBracket} margin={10} />
      </View>

      <ScrollView style={{margin: 10}}>

        <Text>Name:</Text>
        <TextInput style={{flex: 1, backgroundColor: "#f0f0f0", marginBottom: 10}} defaultValue={props.name} editable={editMode} />

        <Text>Type:</Text>
        <Text>{props.type}</Text>

        <Button icon={faPlus} margin={10} onPress={() => {setCaptureImage(true)}} />

      </ScrollView>

      <View style={styles.footer}>
        <View style={{flexDirection: "row", alignItems: "center"}}>
          {editMode &&
          <>
            <Button icon={faCheck} margin={10} />
            <Button icon={faRotateLeft} />
          </>
          }
        </View>
        <Button icon={editMode ? faXmark : faPenToSquare} margin={10} onPress={() => {setEditMode(!editMode)}} />
      </View>
    </>
  );

}


const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footer: {
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
  },
  summarycard: {
    backgroundColor: "#f0f0f0",
    flexDirection: "row",
    marginLeft: 10,
    marginRight: 10,
    marginTop: 10,
    padding: 10,
  },
  summaryinfo: {
    flex: 2,
    paddingRight: 10,
  },
  summaryresult: {
    flex: 1,
  },
  summaryresultvalue: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    flex: 1,
    justifyContent: "center",
  }
});
