import { SampleSpot } from "@/types/data";
import { StyleSheet, Text, View } from "react-native";


export function SampleTable({spots}: {spots: SampleSpot[]}) {
  return (
    <View style={styles.table}>
      {/* Table Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerCell}>Sample</Text>
        <Text style={styles.headerCell}>Euclidian Distance</Text>
        <Text style={styles.headerCell}>Concentration</Text>
      </View>

      {/* Table Rows */}
      {spots.map((spot, index) => (
        <View key={index} style={styles.dataRow}>
          <Text style={styles.dataCell}>{`sample ${index+1}`}</Text>
          <Text style={styles.dataCell}>{spot.calculation?.distance.toFixed(3)}</Text>
          <Text style={styles.dataCell}>{`${spot.calculation?.concentration.value.toFixed(3)} ${spot.calculation?.concentration.units}`}</Text>
        </View>
      ))}
    </View>
  );
};


const styles = StyleSheet.create({
  table: {
    flex: 1,
    padding: 10
  },
  headerRow: {
    borderBottomWidth: 1,
    borderColor: "black",
    flexDirection: "row",
    marginBottom: 5,
    paddingBottom: 5
  },
  headerCell: {
    flex: 1,
    fontWeight: "bold",
    textAlign: "center"
  },
  dataRow: {
    borderBottomWidth: 0.5,
    borderColor: "black",
    flexDirection: "row",
    paddingVertical: 5
  },
  dataCell: {
    flex: 1,
    textAlign: "center"
  }
});