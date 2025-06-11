import { Visualization } from "@/components/visualization";
import { Experiment } from "@/types/experiment";
import { StyleSheet, Text, View } from "react-native";


export function Summary({experiment}: {experiment: Experiment}) {


  const formatedDate = new Date(experiment.date).toDateString();
  const truncatedDescription = experiment.description;


  return (
    <View style={styles.card}>
      <View style={styles.info}>


        <Text>{experiment.type}</Text>
        <Text>(#{experiment.id}) {experiment.name}</Text>
        <Text>{formatedDate}</Text>
        <Text>{truncatedDescription}</Text>


      </View>


      <Visualization experiment={experiment} />


    </View>
  );
}


const styles = StyleSheet.create({
  card: {
    backgroundColor: "#D3D3D3",
    borderColor: "#E5E5E5",
    borderRadius: 5,
    borderWidth: 10,
    flexDirection: "row",
    marginLeft: 10,
    marginRight: 10,
    marginTop: 10,
    padding: 10
  },
  info: {
    color:"White",
    flex: 2,
    paddingRight: 10
  }
});
