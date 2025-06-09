import { Button } from "@/components/button";
import { Experiment } from "@/types/experiment";
import { deleteExperiment, getExperiment } from "@/utilities/storage";
import { faSave } from "@fortawesome/free-regular-svg-icons";
import { faArrowLeft, faArrowUpFromBracket, faCamera, faPenToSquare, faRotateLeft, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";


export default function ExperimentScreen() {

  const router = useRouter();
  const {experimentId} = useLocalSearchParams<{experimentId:string}>();
  const [experiment, setExperiment] = useState<Experiment>();
  const [editMode, setEditMode] = useState(false);

  useFocusEffect(
    useCallback(() => {

      const fun = async () => {
        console.log(`Experiment ${experimentId} in focus.`);
        const experiment = await getExperiment(parseInt(experimentId));
        if (!experiment) {
          Alert.alert(`Experiment ${experimentId} was not found.`);
          router.back();
          return;
        }
        setExperiment(experiment);
      }
      fun();

      return () => {
        // Clean up async.
        console.log(`Experiment ${experimentId} out of focus.`);
      };

    }, [router, experimentId])
  );

  console.log(`Experiment ID: ${experimentId}`);
  console.log(`Experiment: ${experiment}`);
  console.log(`Edit Mode: ${editMode}`);

  if (!experiment) {
    return <View></View>
  }

  // useCallback()?
  const delete_ = async () => {
    await deleteExperiment(experiment.id);
    router.back();
  }

  // useCallback()?
  const preview = () => {
    router.navigate(`/experiment/${experiment.id}/capture`)
  }

  return (
    <>

      <View style={styles.header}>
        <Button icon={faArrowLeft} margin={10} onPress={()=>router.back()} />
        <Text style={styles.title}>Experiment</Text>
        {editMode?
        <Button icon={faTrash} margin={10} onPress={delete_} />
        :
        <Button icon={faArrowUpFromBracket} margin={10} />
        }
      </View>

      <ScrollView style={{margin: 10}}>

        <Text>Name:</Text>
        <TextInput style={{flex: 1, backgroundColor: "#f0f0f0", marginBottom: 10}} defaultValue={experiment.name} editable={editMode} />

        <Text>Type:</Text>
        <Text>{experiment.type}</Text>

        <Button icon={faCamera} margin={10} onPress={preview} />

      </ScrollView>

      <View style={styles.footer}>
        <View style={{flexDirection: "row", alignItems: "center"}}>
          {editMode &&
          <>
            <Button icon={faSave} margin={10} />
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
    backgroundColor: "#c7c6c1",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
  },
  footer: {
    alignItems: "center",
    backgroundColor: "#c7c6c1",
    flexDirection: "row",
    justifyContent: "space-between",
  }
});
