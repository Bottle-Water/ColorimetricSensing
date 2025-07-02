import { Button } from "@/components/button";
import { Summary } from "@/components/summary";
import { Experiment } from "@/types/experiment";
import { createExperiment, debugStorage, deletedUnsavedExperiments, getExperiments, serialize } from "@/utilities/storage";
import { faUser } from "@fortawesome/free-regular-svg-icons";
import { faFlaskVial,faSearch} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputSubmitEditingEventData, View } from "react-native";


export default function LabBookScreen() {


  const router = useRouter();


  const [allExperiments, setAllExperiments] = useState<Experiment[]>();
  const [filteredExperiments, setFilteredExperiments] = useState<Experiment[]>();


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


  const help_ = () => { /* TODO */ };


  const create_ = async () => {
    const experimentId = await createExperiment();
    router.navigate(`/experiment/${experimentId}`);
  };


  const filter_ = (event: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
    const searchKeyword = event.nativeEvent.text;
    console.log(`Searching Keyword: ${searchKeyword}`);
    const newFilteredExperiments = [];
    for (const experiment of allExperiments) {
      const estr = JSON.stringify(experiment).toLowerCase()
      const kstr = searchKeyword.toLowerCase()
      if (estr.includes(kstr)) {
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
          icon={faUser}
          margin={10}
          onPress={help_}
        />
      </View>


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


      <View style={styles.searchbar}>
        <FontAwesomeIcon icon={faSearch} style={{ color: '#FFC904' }} size={20}/>
        <TextInput
          inputMode="search"
          onSubmitEditing={filter_}
          placeholder="Search"
          style={styles.searchinput}
        />
      </View>


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
});
