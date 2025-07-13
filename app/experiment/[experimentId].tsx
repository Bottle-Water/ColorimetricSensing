import { Button } from "@/components/button";
import { DataPoint, RGBcolor, SampleSpot } from "@/types/data";
import { Experiment } from "@/types/experiment";
import { deleteDataPoint, deleteExperiment, getExperiment, isUnsavedExperiment, saveExperiment, serialize, tempImage } from "@/utilities/storage";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faImage, faSave } from "@fortawesome/free-regular-svg-icons";
import { faArrowLeft, faPenToSquare, faQuestion, faShare, faTrash, faTriangleExclamation, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { RefObject, useCallback, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Canvas, checkReadiness, isComplete, performCalculations } from "@/components/canvas";
import { SampleTable } from "@/components/table";
import * as Sharing from "expo-sharing";
import { makeImageFromView } from "@shopify/react-native-skia";


export default function ExperimentScreen() {


  const router = useRouter();
  const {experimentId} = useLocalSearchParams<{experimentId:string}>();


  const [isSpinning, setIsSpinning] = useState(false);
  const exportRef = useRef<View>(null);


  const [newMode, setNewMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);



  const [experiment, setExperiment] = useState<Experiment>();


  const [currentNameValue, setCurrentNameValue] = useState("");
  const [currentDateValue, setCurrentDateValue] = useState("");
  const [currentDescriptionValue, setCurrentDescriptionValue] = useState("");
  const [currentNotesValue, setCurrentNotesValue] = useState("");
  


  const [dataMarkedDeleted, setDataMarkedDeleted] = useState<number[]>([]);


  const [firstRender, setFirstRender] = useState(true);
  useFocusEffect(
    useCallback(() => {
      const fun = async () => {


        // Need to fetch experiment everytime screen
        // is focused because data may have changed.
        console.log(`Experiment ${experimentId} in focus.`);
        const experiment = await getExperiment(parseInt(experimentId));
        if (!experiment) {
          Alert.alert(`Experiment ${experimentId} was not found.`);
          router.back();
          return;
        }
        setExperiment(experiment);
        console.log(`Experiment: ${serialize(experiment)}`);


        if (await isUnsavedExperiment(experiment.id)) {
          setNewMode(true);
        }


        // Don't know a better way. Only want current
        // values to be set once at the beginning.
        // After that only during save and revert.
        if (firstRender) {
          setFirstRender(false);
          setCurrentValues(experiment);
        }
      }
      fun();
      return () => {
        console.log(`Experiment ${experimentId} out of focus.`);
      };
    }, [router, experimentId, firstRender])
  );


  const setCurrentValues = (experiment: Experiment) => {
    setCurrentNameValue(experiment.name);
    setCurrentDateValue(experiment.date);
    setCurrentDescriptionValue(experiment.description);
    setCurrentNotesValue(experiment.notes);
  }


  if (!experiment) {
    return <View></View>
  }


  const help_ = () => { 
    setHelpModalVisible(true);
  };



  // Simple export and share of the screen as a png image.
  // Better than exporting as a PDF which requires extra
  // formatting logic and can result in poor placement of
  // page breaks.
  const export_ = async () => {
    setIsSpinning(true);

    if (exportRef.current !== null) {

      const exportImage = await makeImageFromView(exportRef as RefObject<View>);
      if (exportImage !== null) {

        const uri = await tempImage(exportImage);
        if (uri !== null) {
          if (await Sharing.isAvailableAsync()) {

            await Sharing.shareAsync(uri);
            setIsSpinning(false);
            return;

          }
        }
      }
    }

    Alert.alert("Unable to export and share");

    setIsSpinning(false);
  };


  const save_ = async () => {
    setIsSpinning(true);

    let success = true;

    for (const dataPoint of experiment.data) {
      if (dataMarkedDeleted.includes(dataPoint.id)) {
        success &&= await deleteDataPoint(experiment.id, dataPoint.id);
      }
    }

    // Need refreshed experiment
    // after deleting data points.
    let newExperiment = await getExperiment(parseInt(experimentId));
    if (!newExperiment) {
      Alert.alert(`Experiment ${experimentId} was not found.`);
      router.back();
      setIsSpinning(false);
      return;
    }

    newExperiment = {
      ...newExperiment,
      name: currentNameValue,
      date: currentDateValue,
      description: currentDescriptionValue,
      notes: currentNotesValue
    };
    success &&= await saveExperiment(newExperiment)

    if (!success) {
      Alert.alert("Save was unsuccessful.");
      setIsSpinning(false);
      return;
    }

    setNewMode(false);
    setExperiment(newExperiment);
    setCurrentValues(newExperiment);
    setDataMarkedDeleted([]);
    console.log(`Experiment: ${serialize(experiment)}`);

    setIsSpinning(false);
  };


  const calculate_ = async (readiness: {whiteColor: RGBcolor, blackColor: RGBcolor, baselineColor: RGBcolor, sampleSpots: SampleSpot[]}) => {
    setIsSpinning(true);

    let success = true;

    performCalculations(readiness.whiteColor, readiness.blackColor, readiness.baselineColor, readiness.sampleSpots);

    const newExperiment = {...experiment};

    success &&= await saveExperiment(newExperiment)
    if (!success) {
      Alert.alert("Save was unsuccessful.");
      setIsSpinning(false);
      return;
    }

    setExperiment(newExperiment);

    setIsSpinning(false);
  }


  const delete_ = async () => {
    setIsSpinning(true);

    if (!await deleteExperiment(experiment.id)) {
      Alert.alert("Delete was unsuccessful.");
    }

    setIsSpinning(false);
    router.back();
  };


  const mark_ = async (dataPoint: DataPoint) => {
    let newDataMarkedDeleted = [...dataMarkedDeleted];
    if (dataMarkedDeleted.includes(dataPoint.id)) {
      newDataMarkedDeleted = dataMarkedDeleted.filter((element)=>{return element !== dataPoint.id});
    } else {
      newDataMarkedDeleted.push(dataPoint.id);
    }
    setDataMarkedDeleted(newDataMarkedDeleted);
    console.log(`Data Marked Deleted: ${newDataMarkedDeleted}`);
  }


  const baseInputStyle = editMode?styles.activebox:styles.inactivebox;

  const isNameModified = currentNameValue !== experiment.name;
  const nameInputStyle = newMode||isNameModified?styles.modifiedbox:baseInputStyle;

  const isDateModified = currentDateValue !== experiment.date;
  const dateInputStyle = newMode||isDateModified?styles.modifiedbox:baseInputStyle;

  const isDescriptionModified = currentDescriptionValue !== experiment.description;
  const descriptionInputStyle = newMode||isDescriptionModified?styles.modifiedbox:baseInputStyle;

  const isNotesModified = currentNotesValue !== experiment.notes;
  const notesInputStyle = newMode||isNotesModified?styles.modifiedbox:baseInputStyle;

  const isModified = isNameModified || isDateModified || isDescriptionModified || isNotesModified || dataMarkedDeleted.length > 0;


  return (
    <>


      <View style={styles.header}>
        <Button
          icon={faArrowLeft}
          onPress={()=>router.back()}
          margin={10}
        />
        <Text style={styles.title}>Experiment</Text>
        <Button
          icon={faQuestion}
          onPress={help_}
          margin={10}
        />
      </View>


      <ScrollView style={styles.content}>
      {/* Export View */}
      <View ref={exportRef} collapsable={false}>


        <View style={styles.field}>
          <Text style={styles.label}>Name:</Text>
          <TextInput
            defaultValue={currentNameValue}
            editable={newMode||editMode}
            onEndEditing={(event)=>setCurrentNameValue(event.nativeEvent.text)}
            style={nameInputStyle}
          />
        </View>


        <View style={styles.splitpanel}>
          <View style={styles.splitpanelleft}>


            <View style={styles.field}>
              <Text style={styles.label}>Type:</Text>
              <Text style={styles.inactivebox}>{experiment.type}</Text>
            </View>


          </View>
          <View style={styles.splitpanelright}>


            <View style={styles.field}>
              <Text style={styles.label}>Date:</Text>
              <Pressable
                disabled={!newMode&&!editMode}
                onPress={()=>setDatePickerVisibility(true)}
              >
                <Text style={dateInputStyle}>{new Date(currentDateValue).toDateString()}</Text>
              </Pressable>
              <DateTimePickerModal
                date={new Date(currentDateValue)}
                isVisible={isDatePickerVisible}
                mode="date"
                onCancel={()=>setDatePickerVisibility(false)}
                onConfirm={(date: Date) => {
                  setCurrentDateValue(date.toISOString());
                  setDatePickerVisibility(false);
                }}
              />
            </View>


          </View>
        </View>


        <View style={styles.datapanel}>
          <ScrollView style={styles.images} horizontal>


            {experiment.data.map((dataPoint) => (
            <Pressable
              key={dataPoint.id}
              onLongPress={newMode||editMode?()=>mark_(dataPoint):()=>{}}
              onPress={()=>router.navigate(`/experiment/${experimentId}/canvas/${dataPoint.id}`)}
            >
              <Image
                source={{
                  uri: dataPoint.image
                }}
                style={
                  (newMode||editMode)&&dataMarkedDeleted.includes(dataPoint.id)?
                  {...styles.thumbnail,...styles.deleted}:
                  styles.thumbnail
                }
              />
            </Pressable>
            ))}

            {experiment.data.length === 0 &&
            <Text style={styles.label}>Please take an image or choose an image...</Text>
            }


          </ScrollView>


          <Button
            icon={faImage}
            onPress={()=>router.navigate(`/experiment/${experiment.id}/capture`)}
            margin={10}
          />


        </View>


        <View style={styles.field}>
          <Text style={styles.label}>Description:</Text>
          <TextInput
            defaultValue={currentDescriptionValue}
            editable={newMode||editMode}
            multiline
            onEndEditing={(event)=>setCurrentDescriptionValue(event.nativeEvent.text)}
            style={descriptionInputStyle}
          />
        </View>


        <View style={styles.field}>
          <Text style={styles.label}>Notes:</Text>
          <TextInput 
            defaultValue={currentNotesValue}
            editable={newMode||editMode}
            multiline
            onEndEditing={(event)=>setCurrentNotesValue(event.nativeEvent.text)}
            style={notesInputStyle}
          />
        </View>


        {experiment.data.map((dataPoint)=>{
          return {dataPoint: dataPoint, readiness: checkReadiness(dataPoint.spots)}
        }).map(({dataPoint, readiness}, index)=>
        <View key={`vis-${dataPoint.id}-${index+1}`} style={styles.resultpanel}>

          {index === 0 &&
          <View>
            <Text style={styles.analysistitle}>Analysis Results</Text> 
          </View>
          }

          <Canvas data={dataPoint} />

          {readiness.errors.length > 0 ?


          <View style={[styles.scrollcontainer, styles.verticalcontainer,styles.errorBox]}>
            <Text>
              <FontAwesomeIcon icon={faTriangleExclamation} size={15} style={{ color: 'red' }}/>
            </Text>
            {readiness.errors.map((error, index) =>
              <Text style={{ color: 'red' }} key={`error-${dataPoint.id}-${index+1}`}>{error}</Text>
            )}
          </View>


          : !isComplete(readiness.sampleSpots) ?


          <View style={styles.scrollcontainer}>
          <Pressable style={styles.button} onPress={()=>{calculate_(readiness)}}>
            <Text> Results are ready, Press to generate!</Text>
          </Pressable>
          </View>


          :


          <SampleTable spots={readiness.sampleSpots} />


          }
        </View>
        )}



      </View>
      </ScrollView>


      <View style={styles.actionbar}>
        <View style={styles.actionbarleftpanel}>


          {newMode||editMode?
          <Button
            icon={faTrash}
            backgroundColor="red"
            margin={10}
            onPress={delete_}
          />
          :
          <Button
            icon={faShare}
            margin={10}
            onPress={export_}
          />
          }


        </View>
        <View style={styles.actionbarrightpanel}>


          {newMode?

          <Button
            icon={faSave}
            backgroundColor="green"
            margin={10}
            onPress={save_}
          />

          :editMode?

          <>
          <Button
            icon={faSave}
            backgroundColor={isModified?"green":"lightgray"}
            margin={10}
            onPress={isModified?save_:()=>{}}
          />
          <Button
            icon={faXmark}
            margin={10}
            onPress={() => {
              setEditMode(false);
              setCurrentValues(experiment);
            }}
          />
          </>

          :

          <Button
            icon={faPenToSquare}
            margin={10}
            onPress={()=>setEditMode(true)}
          />

          }


        </View>
      </View>


      <Modal visible={isSpinning} transparent={true} animationType="fade">
      <View style={styles.modal}>
        <ActivityIndicator animating={isSpinning} size="large" color="white" />
      </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={helpModalVisible}
        onRequestClose={() => setHelpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Experiment Page Help</Text>
            <Text style={styles.modalText}>
              This is the experiment page, where you manage data for a single experiment
              {'\n\n'}
              • Set a name for your experiment in the name field to organize experiments
              {'\n\n'}
              • Tap the type to change the colorimetric analysis algorithm depending on experiment target (*note*: IgG is currently the only experiment type supported)
              {'\n\n'}
              • Tap the picture icon to add or take scans of the test strip
              {'\n\n'}
              • Tap the arrow icon to export the data
              {'\n\n'}
              • Tap the pencil icon to enable editing on the experiment page
              {'\n\n'}
              • After scanning and marking points, press analyze to see results
              {'\n\n'}
              • To delete a scan, while in edit mode, press and hold on a thumbnail of a scan until outlined, then click save.
              {'\n\n'}
            </Text>
            <Pressable
              style={styles.modalButton}
              onPress={() => setHelpModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Got it!</Text>
            </Pressable>
          </View>
        </View>
      </Modal>



    </>
  );
}


const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    backgroundColor: "black",
    borderBottomColor: "#FFC904",
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
    margin: 10,
    backgroundColor: "#F9F9ED",
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
    flex: 1
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
  thumbnail: {
    borderRadius: 5,
    height: 60,
    margin: 10,
    width: 60
  },
  deleted: {
    borderColor: "red",
    borderWidth: 2
  },
  field: {
    margin: 10
  },
  label: {
    fontStyle: "italic",
    fontWeight: "light",
    marginBottom: 5
  },
  modifiedbox: {
    backgroundColor: "lightgray",
    borderColor: "#FFC904",
    borderRadius: 5,
    borderStyle: "solid",
    borderWidth: 3,
    padding: 5
  },
  activebox: {
    backgroundColor: "#FFC904",
    borderColor: "gray",
    borderRadius: 5,
    borderStyle: "dashed",
    borderWidth: 1,
    padding: 5
  },
  inactivebox: {
    backgroundColor: "lightgray",
    borderColor: "gray",
    borderRadius: 5,
    borderStyle: "dashed",
    borderWidth: 1,
    padding: 5
  },
  actionbar: {
    alignItems: "center",
    backgroundColor: "black",
    borderTopColor: "#FFC904",
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
  },
  resultpanel: {
    margin: 10
  },
  button: {
    backgroundColor: "#FFC904",
    padding: 10,
    borderWidth: 2,
    borderColor: "black",
    borderRadius:10
  },
  scrollcontainer: {
    alignItems: "center",
    flex: 1,
    marginTop: 10
  },
  verticalcontainer: {
    flexDirection: "column",
  },
  analysistitle:{
    alignSelf: "center",
    fontSize: 20,
    fontWeight: "bold",
    padding: 10,
  },
  errorBox: {
    borderWidth: 1,
    borderColor: 'red',
    backgroundColor: '#ffe6e6',
    padding: 10,
    borderRadius: 8,
    marginVertical: 8
  },
  modal: {
    alignItems: "center",
    backgroundColor: "black",
    bottom: 0,
    flex: 1,
    justifyContent: "center",
    left: 0,
    opacity: 0.5,
    position: "absolute",
    right: 0,
    top: 0,
  },
    modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)"
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    margin: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    borderRadius : 15,
    padding: 15,
    borderColor: "black",
    borderWidth: 2,
    backgroundColor: "#FFC904",
    textAlign: "center",
    marginBottom: 20
  },
  modalText: {
    fontSize: 15,
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: "#FFC904",
    borderRadius: 15,
    padding: 15,
    alignItems: "center"
  },
  modalButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold"
  },
});
