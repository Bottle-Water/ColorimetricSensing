import Button from "@/components/button";
import Experiment, { ExperimentProps, newExperimentProps } from "@/components/experiment";
import { faUser } from "@fortawesome/free-regular-svg-icons";
import { faFlask, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";


const fakeExperimentData: ExperimentProps[] = [
  {
    id: 1,
    type: "IgG",
    name: "Experiment",
    date: "2025-03-24",
    description: "In this experiment we blah blah blah...",
    data: [],
    result: null,
    notes: "",
  },
  {
    id: 2,
    type: "Ammonia",
    name: "Experiment",
    date: "2025-04-13",
    description: "In this experiment we blah blah blah...",
    data: [],
    result: 24,
    notes: "",
  },
  {
    id: 3,
    type: "IgG",
    name: "Experiment",
    date: "2025-05-02",
    description: "In this experiment we blah blah blah...",
    data: [],
    result: null,
    notes: "",
  },
];


export default function LabBook() {

  const [selectedExperiment, setSelectedExperiment] = useState<null|ExperimentProps>(null);

  const [nextId, setNextId] = useState(0);
  const [allExperiments, setAllExperiments] = useState<ExperimentProps[]>([]);
  const [filteredExperiments, setFilteredExperiments] = useState<ExperimentProps[]>([]);

  useEffect(() => {
    setNextId(4);
    setAllExperiments(fakeExperimentData);
    setFilteredExperiments(fakeExperimentData);
  }, []);

  const filterExperiments = (searchKeyword: string) => {
    console.log(searchKeyword);
    const newFilteredExperiments = [];
    for (const experiment of allExperiments) {
      const estr = JSON.stringify(experiment).toLowerCase()
      const kstr = searchKeyword.toLowerCase()
      if (estr.includes(kstr)) {
        newFilteredExperiments.push(experiment);
      }
    }
    console.log(newFilteredExperiments)
    setFilteredExperiments(newFilteredExperiments);
  }

  const createNewExperiment = () => {
    const props = newExperimentProps(nextId);
    setNextId(nextId+1);
    setSelectedExperiment(props);
  }

  if (selectedExperiment != null) {
    return (
      <Experiment onBack={() => {setSelectedExperiment(null)}}
                  props={selectedExperiment} />
    );
  }

  return (
    <>

      <View style={styles.header}>
        <Button icon={faFlask} margin={10} onPress={() => {createNewExperiment()}} />
        <Text style={styles.title}>Lab Book</Text>
        <Button icon={faUser} margin={10} />
      </View>

      <ScrollView>
        {filteredExperiments.map((experiment) => (
          <Experiment key={experiment.id} props={experiment} summary onPress={setSelectedExperiment} />
        ))}
      </ScrollView>

      <View style={styles.searchbar}>
        <FontAwesomeIcon icon={faMagnifyingGlass} />
        <TextInput inputMode="search"
                   onSubmitEditing={(event) => {filterExperiments(event.nativeEvent.text)}}
                   placeholder="Search"
                   style={styles.searchinput} />
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
  title: {
    fontSize: 25,
    fontWeight: "bold",
  },
  searchbar: {
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
  },
  searchinput: {
    borderRadius: 15,
    borderWidth: 1,
    flex: 1,
    height: 40,
    marginLeft: 10,
    padding: 10,
  },
});
