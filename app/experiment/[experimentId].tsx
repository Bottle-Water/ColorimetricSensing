import { Button } from "@/components/button";
import { Visualization } from "@/components/visualization";
import { Experiment } from "@/types/experiment";
import { deleteExperiment, getExperiment } from "@/utilities/storage";
import { faImage, faPaperPlane, faSave } from "@fortawesome/free-regular-svg-icons";
import { faArrowLeft, faPenToSquare, faQuestion, faRotateLeft, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";


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


  const delete_ = async () => {
    await deleteExperiment(experiment.id);
    router.back();
  }


  const preview = () => {
    router.navigate(`/experiment/${experiment.id}/capture`);
  }


  const formatedDate = new Date(experiment.date).toDateString();


  return (
    <>


      <View style={styles.header}>
        <Button icon={faArrowLeft} margin={10} onPress={()=>router.back()} />
        <Text style={styles.title}>Experiment</Text>
        <Button icon={faQuestion} margin={10} />
      </View>


      <ScrollView style={styles.content}>


        <View style={styles.field}>
          <Text style={styles.label}>Name:</Text>
          <TextInput style={styles.inputbox}
                     defaultValue={experiment.name}
                     editable={editMode} />
        </View>


        <View style={styles.splitpanel}>
          <View style={styles.splitpanelleft}>


            <View style={styles.field}>
              <Text style={styles.label}>Type:</Text>
              <Text style={styles.inputbox}>{experiment.type}</Text>
            </View>


            <View style={styles.field}>
              <Text style={styles.label}>Date:</Text>
              <Text style={styles.inputbox}>{formatedDate}</Text>
            </View>


          </View>
          <View style={styles.splitpanelright}>


            <Visualization experiment={experiment} />


          </View>
        </View>


        <View style={styles.datapanel}>
          <ScrollView style={styles.images}>
            {experiment.data.length > 0?
            <Image></Image>
            :
            <Text style={styles.label}>No Data...</Text>
            }
          </ScrollView>
          <Button icon={faImage} margin={10} onPress={preview} />
        </View>


        <View style={styles.field}>
          <Text style={styles.label}>Description:</Text>
          <TextInput style={styles.inputbox}
                     defaultValue={experiment.description}
                     multiline
                     editable={editMode} />
        </View>


        <View style={styles.field}>
          <Text style={styles.label}>Notes:</Text>
          <TextInput style={styles.inputbox}
                     defaultValue={experiment.notes}
                     multiline
                     editable={editMode} />
        </View>


      </ScrollView>


      <View style={styles.actionbar}>
        <View style={styles.actionbarleftpanel}>


          {editMode?
          <Button icon={faTrash} margin={10} onPress={delete_} backgroundColor="red" />
          :
          <Button icon={faPaperPlane} margin={10} />
          }


        </View>
        <View style={styles.actionbarrightpanel}>


          {editMode?
          <>
          <Button icon={faSave} margin={10} backgroundColor="green" />
          <Button icon={faRotateLeft} margin={10} backgroundColor="yellow" />
          <Button icon={faXmark} margin={10} onPress={() => {setEditMode(!editMode)}} />
          </>
          :
          <Button icon={faPenToSquare} margin={10} onPress={() => {setEditMode(!editMode)}} />
          }


        </View>
      </View>


    </>
  );
}


const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    backgroundColor: "#A9A9A9",
    borderBottomColor: "black",
    borderBottomWidth: 3,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  title: {
    color:"white",
    fontSize: 25,
    fontWeight: "bold",
  },
  content: {
    margin: 10
  },
  name: {
    backgroundColor: "#f0f0f0",
    flex: 1,
    marginBottom: 10
  },
  splitpanel: {
    flexDirection: "row",
    margin: 10
  },
  splitpanelleft: {
    flex: 1
  },
  splitpanelright: {
    flex: 1,
    margin: 10
  },
  datapanel: {
    backgroundColor: "lightgray",
    borderColor: "gray",
    borderRadius: 5,
    borderStyle: "dashed",
    borderWidth: 1,
    flexDirection: "row",
    margin: 10
  },
  images: {},
  field: {
    margin: 10
  },
  label: {
    fontStyle: "italic",
    fontWeight: "light",
    marginBottom: 5
  },
  inputbox: {
    backgroundColor: "lightblue",
    borderColor: "gray",
    borderRadius: 5,
    borderStyle: "dashed",
    borderWidth: 1,
    padding: 5
  },
  actionbar: {
    alignItems: "center",
    backgroundColor: "#A9A9A9",
    borderTopColor: "black",
    borderTopWidth: 3,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  actionbarleftpanel: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-start"
  },
  actionbarrightpanel: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-end"
  }
});
