import { Experiment } from "@/types/experiment";
import { StyleSheet, Text, View } from "react-native";


export function Visualization({experiment}: {experiment: Experiment}) {


  let formatedResult = "N/A";
  let sum = 0;
  let num = 0;
  //if (experiment.result) {
  for (const dataPoint of experiment.data) {
    //formatedResult = `${experiment.result.value} ${experiment.result.units}`;
    if (dataPoint.concentration !== null) {
      sum += dataPoint.concentration.value;
      num += 1;
    }
  }
  if (num > 0) {
    formatedResult = `${(sum/num).toFixed(2)} ppm`;
  }
  //}


  return (
    <View style={styles.centeredcontainer}>
      <Text style={styles.resultvalue}>{formatedResult}</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  centeredcontainer: {
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 5,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center"
  },
  resultvalue: {
    fontSize: 16
  }
});
