import { Experiment } from "@/types/experiment";
import { StyleSheet, Text, View } from "react-native";


export function Summary({experiment}: {experiment: Experiment}) {
  return (
    <View style={styles.summarycard}>
      <View style={styles.summaryinfo}>
        <Text>{experiment.type}</Text>
        <Text>(#{experiment.id}) {experiment.name}</Text>
        <Text>{new Date(experiment.date).toDateString()}</Text>
        <Text>Description: {'\n'}
        {experiment.description}
        </Text>
      </View>
      <View style={styles.summaryresult}>
        <Text>Result:</Text>
        <View style={styles.summaryresultvalue}>
          <Text style={{ color: "white", fontSize: 18}}>{experiment.result != null ? `${experiment.result} ppm` : "N/A"}</Text>
        </View>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  summarycard: {
    backgroundColor: "#f0f0f0",
    borderColor: "#c7c6c1",
    flexDirection: "row",
    borderWidth: 2,
    borderRadius: 5,
    marginLeft: 10,
    marginRight: 10,
    marginTop: 10,
    padding: 10,
  },
  summaryinfo: {
    flex: 2,
    paddingRight: 10,
  },
  summaryresult: {
    flex: 1,
  },
  summaryresultvalue: {
    backgroundColor: "#289eb5",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  }
});
