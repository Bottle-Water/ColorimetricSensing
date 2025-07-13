import { Experiment } from "@/types/experiment";
import { StyleSheet, Text, View } from "react-native";
import { faCalendarCheck,faCommentDots } from "@fortawesome/free-regular-svg-icons";
import { faFlask } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { checkReadiness, isComplete } from "@/components/canvas";


export function Summary({experiment}: {experiment: Experiment}) {


  const formatedDate = new Date(experiment.date).toDateString();
  const truncatedDescription = experiment.description;


  let status = "Complete";
  if (experiment.data.length === 0) {
    status = "Not Performed";
  }
  for (const dataPoint of experiment.data) {
    const readiness = checkReadiness(dataPoint.spots);
    if (readiness.errors.length > 0 || !isComplete(readiness.sampleSpots)) {
      status = "In Progress";
    }
  }


  return (
    <View style={styles.card}>
      <View style={styles.info}>


        <Text style={styles.type}>{`${experiment.type} (#${experiment.id})`}</Text>

        <Text style={styles.name}>
          <Text> <FontAwesomeIcon icon={faFlask} size={15}/> </Text>
          {experiment.name}
        </Text>

        <Text style={styles.date}>
          <Text> <FontAwesomeIcon icon={faCalendarCheck} size={15}/> </Text>
          {formatedDate}
        </Text>

        <Text style={styles.description}>
          <Text> <FontAwesomeIcon icon={faCommentDots} size={15}/> </Text>
          {truncatedDescription}
        </Text>


      </View>


      <View style={styles.status}>
        <Text style={{fontStyle: "italic"}}>{status}</Text>
      </View>


    </View>
  );
}


const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFC904",
    borderColor: "black",
    borderRadius: 5,
    borderWidth: 2,
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
  },
  type: {
    fontSize: 15,         
    fontWeight: 'bold',   
    fontFamily: 'Arial',
    color: '#333', 
    margin: 2 
  },
  name:{
    fontSize: 14,
    margin: 2 
  },
  date:{
    fontSize: 14,
    margin: 2 
  },
  description:{
    fontSize: 13,
    fontStyle: "italic",
    margin: 2 
  },
  status: {
    alignItems: "center",
    backgroundColor: "#F9F9ED",
    borderRadius: 10,
    flex: 1,
    justifyContent: "center"
  }
});
