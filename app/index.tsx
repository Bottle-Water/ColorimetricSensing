import { Button } from "@/components/button";
import { Summary } from "@/components/experiment";
import { Experiment } from "@/types/experiment";
import { createExperiment, getExperiments } from "@/utilities/storage";
import { faUser } from "@fortawesome/free-regular-svg-icons";
import { faFlask, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";


export default function LabBookScreen() {

  const router = useRouter();
  const [allExperiments, setAllExperiments] = useState<Experiment[]>();
  const [filteredExperiments, setFilteredExperiments] = useState<Experiment[]>();

  useFocusEffect(
    useCallback(() => {

      const fun = async () => {
        console.log("Lab Book in focus.");
        const experiments = await getExperiments();
        console.log(experiments);
        setAllExperiments(experiments);
        setFilteredExperiments(experiments);
      }
      fun();

      return () => {
        // Clean up async.
        console.log("Lab Book out of focus.");
      };

    }, [])
  );

  if (!allExperiments || !filteredExperiments) {
    return <View></View>
  }

  // useCallback()?
  const create = async () => {
    const experimentId = await createExperiment();
    router.navigate(`/experiment/${experimentId}`);
  }

  // useCallback()?
  const select = (experimentId: number) => {
    router.navigate(`/experiment/${experimentId}`)
  }

  // useCallback()?
  const filter = (searchKeyword: string) => {
    console.log(searchKeyword);
    const newFilteredExperiments = [];
    for (const experiment of allExperiments) {
      const estr = JSON.stringify(experiment).toLowerCase()
      const kstr = searchKeyword.toLowerCase()
      if (estr.includes(kstr)) {
        newFilteredExperiments.push(experiment);
      }
    }
    console.log(newFilteredExperiments);
    setFilteredExperiments(newFilteredExperiments);
  }

  return (
    <>

      <View style={styles.header}>
        <Button icon={faFlask} margin={10} onPress={create} />
        <Text style={styles.title}>Lab Book</Text>
        <Button icon={faUser} margin={10} />
      </View>

      <ScrollView>
        {filteredExperiments.map((experiment) => (
          <Pressable key={experiment.id} onPress={()=>select(experiment.id)}>
            <Summary experiment={experiment} />
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.searchbar}>
        <FontAwesomeIcon icon={faMagnifyingGlass} />
        <TextInput inputMode="search"
                   onSubmitEditing={(event) => {filter(event.nativeEvent.text)}}
                   placeholder="Search"
                   style={styles.searchinput} />
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
  searchbar: {
    alignItems: "center",
    backgroundColor: "#c7c6c1",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
  },
  searchinput: {
    backgroundColor: "white",
    borderRadius: 15,
    borderWidth: 1,
    flex: 1,
    height: 40,
    marginLeft: 10,
    padding: 10,
  },
});
