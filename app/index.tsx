import { Button } from "@/components/button";
import LabFlaskIcon from "@/components/flaskicon";
import SearchWarningIcon from "@/components/searchwarningicon";
import { Summary } from "@/components/summary";
import { Experiment } from "@/types/experiment";
import { createExperiment, debugStorage, deletedUnsavedExperiments, getExperiments, serialize } from "@/utilities/storage";
import { faFlaskVial, faQuestion,faSearch} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Modal, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputSubmitEditingEventData, View } from "react-native";


export default function LabBookScreen() {


  const router = useRouter();


  const [allExperiments, setAllExperiments] = useState<Experiment[]>();
  const [filteredExperiments, setFilteredExperiments] = useState<Experiment[]>();
  const [helpModalVisible, setHelpModalVisible] = useState(false);


  useFocusEffect(
    useCallback(() => {

      const fun = async () => {
        console.log("Lab Book in focus.");
        await debugStorage();
        await deletedUnsavedExperiments();
        const experiments = await getExperiments();
        setAllExperiments(experiments);
        setFilteredExperiments(experiments);
        console.log(`All Experiments: ${serialize(experiments)}`);
        await debugStorage();
      }
      fun();

      return () => {
        console.log("Lab Book out of focus.");
      };

    }, [])
  );


  if (!allExperiments || !filteredExperiments) {
    return <View></View>
  }


  const help_ = () => { 
    setHelpModalVisible(true);
  };


  const create_ = async () => {
    const experimentId = await createExperiment();
    router.navigate(`/experiment/${experimentId}`);
  };


  const filter_ = (event: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
    const searchKeyword = event.nativeEvent.text;
    console.log(`Searching Keyword: ${searchKeyword}`);
    const newFilteredExperiments = [];
    for (const experiment of allExperiments) {
      const kstr = searchKeyword.toLowerCase()
      if (experiment.name.toLowerCase().includes(kstr)) {
        newFilteredExperiments.push(experiment);
      } else if (experiment.type.toLowerCase().includes(kstr)) {
        newFilteredExperiments.push(experiment);
      } else if ((new Date(experiment.date)).toDateString().toLowerCase().includes(kstr)) {
        newFilteredExperiments.push(experiment);
      } else if (experiment.description.toLowerCase().includes(kstr)) {
        newFilteredExperiments.push(experiment);
      } else if (experiment.notes.toLowerCase().includes(kstr)) {
        newFilteredExperiments.push(experiment);
      }
    }
    setFilteredExperiments(newFilteredExperiments);
    console.log(`Filtered Experiments: ${serialize(filteredExperiments)}`);
  };


  return (
    <>


      <View style={styles.header}>
        <Button
          icon={faFlaskVial}
          margin={10}
          onPress={create_}
        />
        <Text style={styles.title}>Lab Book</Text>
        <Button
          icon={faQuestion}
          margin={10}
          onPress={help_}
        />
      </View>

      {allExperiments.length === 0 ?

      <View style={{flex: 1, flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
        <LabFlaskIcon />
        <Text style={{fontStyle:"italic", fontWeight:"thin",fontSize:20, color:"gray"}}>Welcome to your lab book!</Text>
      </View>

      : filteredExperiments.length === 0 ?

      <View style={{flex: 1, flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
        <SearchWarningIcon />
        <Text style={{fontStyle:"italic", fontWeight:"thin",fontSize:20, color:"gray"}}>No matching result found!</Text>
      </View>

      :

      <ScrollView>
        {filteredExperiments.map((experiment) => (
        <Pressable
          key={experiment.id}
          onPress={()=>router.navigate(`/experiment/${experiment.id}`)}
        >
          <Summary experiment={experiment} />
        </Pressable>
        ))}
      </ScrollView>
      }


      <View style={styles.searchbar}>
        <FontAwesomeIcon icon={faSearch} style={{ color: '#FFC904' }} size={20}/>
        <TextInput
          inputMode="search"
          onSubmitEditing={filter_}
          placeholder="Search"
          style={styles.searchinput}
        />
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={helpModalVisible}
        onRequestClose={() => setHelpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Lab Book Help</Text>
            <ScrollView>
            <Text style={styles.modalText}>
              Welcome to the Colorimetric Sensing Lab Book!
              {'\n\n'}
              This app helps you manage and analyze your colorimetric sensing experiments.
              {'\n\n'}
              • Tap the flask icon to create a new experiment
              {'\n\n'}
              • Tap the help icon for information on app functionality for your current page
              {'\n\n'}
              • Use the search bar to find specific experiments
              {'\n\n'}
              • Tap on any experiment to view details and capture data
              {'\n\n'}
              • Your experiments are automatically saved locally
              {'\n\n'}
            </Text>
            </ScrollView>
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
    fontWeight: "bold"
  },
  searchbar: {
    alignItems: "center",
    backgroundColor: "black",
    borderTopColor: "#FFC904",
    borderTopWidth: 3,
    color:"black",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10
  },
  searchinput: {
    backgroundColor: "#E5E5E5",
    borderRadius: 15,
    borderWidth: 1,
    color:"black",
    flex: 1,
    height: 40,
    marginLeft: 10,
    padding: 10
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
    lineHeight: 24,
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
