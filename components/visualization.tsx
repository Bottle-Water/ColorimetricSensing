import { Experiment } from "@/types/experiment";
import { StyleSheet, Text, View } from "react-native";


export function Visualization({experiment}: {experiment: Experiment}) {


  let formatedResult = "N/A";
  if (experiment.result) {
    formatedResult = `${experiment.result.value} ${experiment.result.units}`;
  }


  return (
    <View style={styles.centeredcontainer}>
      <Text style={styles.resultvalue}>Result: {formatedResult}</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  centeredcontainer: {
    alignItems: "center",
    backgroundColor: "#239ED0",
    color:"white",
    flex: 1,
    justifyContent: "center"
  },
  resultvalue: {
    color: "white",
    fontSize: 18
  }
});
