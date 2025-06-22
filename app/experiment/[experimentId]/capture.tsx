import { Button } from "@/components/button";
import { Experiment } from "@/types/experiment";
import { createDataPoint, getExperiment, serialize } from "@/utilities/storage";
import { faFileImage, faLightbulb } from "@fortawesome/free-regular-svg-icons";
import { faArrowLeft, faCamera, faCheck, faQuestion, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import * as ImagePicker from 'expo-image-picker';


export default function CaptureScreen() {


  const router = useRouter();
  const {experimentId} = useLocalSearchParams<{experimentId:string}>();


  const [experiment, setExperiment] = useState<Experiment>();


  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const {hasPermission, requestPermission} = useCameraPermission();
  const [torchState, setTorchState] = useState<'on'|'off'>('off');


  const [imageURI, setImageURI] = useState("");
  const [isFilled, setIsFilled] = useState(false);



  useFocusEffect(
    useCallback(() => {

      const fun = async () => {
        console.log(`Experiment ${experimentId} in focus.`);
        const experiment = await getExperiment(parseInt(experimentId));
        if (!experiment) {
          Alert.alert(`Experiment ${experimentId} was not found.`);
          router.back();
          return;
        }
        setExperiment(experiment);
        console.log(`Experiment: ${serialize(experiment)}`);
      }
      fun();

      return () => {
        // Clean up async.
        console.log(`Experiment ${experimentId} out of focus.`);
      };

    }, [router, experimentId])
  );


  if (!experiment) {
    return <View></View>
  }


  if (!device) {
    return (
      <View style={styles.dialog}>
        <Text>
          Wait...
          If this message does not disappear.
          It may be because this device ({`${device}`}) is not supported.
        </Text>
      </View>
    );
  }


  if (!hasPermission) {
    return (
      <View style={styles.dialog}>
        <Text>Can we access your camera?</Text>
        <Button margin={10} onPress={requestPermission} />
      </View>
    );
  }


  const help_ = () => { /* TODO */ };


  const pick = async () => {
    const image = await ImagePicker.launchImageLibraryAsync();
    if (image.assets) {
      setImageURI(image.assets[0].uri);
    }
  };


  const capture = async () => {
    const image = await cameraRef.current?.takePhoto({flash: 'off'});
    if (image) {
      setImageURI(image.path);
    }
  };


  const confirm = async () => {
    const dataId = await createDataPoint(experiment.id, imageURI);
    if (!dataId) {
      Alert.alert(`Confirm was unsuccessful.`);
      return;
    }
    router.replace(`/experiment/${experimentId}/canvas/${dataId}`);
  };


  const nextTorchState = torchState === 'on' ? 'off' : 'on';

  // outline guide


  return (
    <>
    

      <View style={styles.header}>
        <Button icon={faArrowLeft} margin={10} onPress={()=>router.back()} />
        <Text style={styles.title}>Capture</Text>
        <Button icon={faQuestion} margin={10} onPress={help_} />
      </View>

    {imageURI ? (
      <Image
        source={{ uri: imageURI }}
        style={styles.image}
      />
    ) : (
      <View style={{ flex: 1 }}>
        <Camera
          style={StyleSheet.absoluteFill}
          ref={cameraRef}
          device={device}
          isActive={true}
          photo={true}
          {...(device.hasTorch && { torch: torchState })}
          onInitialized={() => { Alert.alert('Camera is Ready!'); }}
        />

        <View
          style={[
            styles.overlayBox,
            { borderColor: isFilled ? 'limegreen' : 'red' }
          ]}
        />
      </View>
    )}


      <View style={styles.actionbar}>

        <View style={styles.actionbarleftpanel}>
          {!imageURI &&
          <Button icon={faFileImage} margin={10} onPress={pick} />
          }
        </View>

        <View style={styles.actionbarcenterpanel}>
          {imageURI?
          <>
          <Button
            backgroundColor="green"
            icon={faCheck}
            margin={10}
            onPress={confirm}
          />
          <Button
            backgroundColor="red"
            icon={faXmark}
            margin={10}
            onPress={()=>setImageURI("")}
          />
          </>
          :
          <Button icon={faCamera} margin={10} onPress={capture} />
          }
        </View>

        <View style={styles.actionbarrightpanel}>
          {device.hasTorch && !imageURI &&
          <Button icon={faLightbulb} margin={10} onPress={() => {setTorchState(nextTorchState);}} />
          }
        </View>
      </View>

    </>
  );
}


const styles = StyleSheet.create({
  overlayBox: {
  position: 'absolute',
  top: '35%',
  left: '25%',
  width: '50%',
  height: '30%',
  borderWidth: 3,
  borderRadius: 8,
  },
  dialog: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: "center",
    backgroundColor: "#A9A9A9",
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomColor: "black",
    borderBottomWidth: 3
  },
  title: {
    color:"white",
    fontSize: 25,
    fontWeight: "bold",
  },
  image: {
    flex: 1
  },
  camera: {
    flex: 1,
  },
  actionbar: {
    flexDirection: "row",
    backgroundColor: "#A9A9A9",
    borderTopColor: "black",
    borderTopWidth: 3
  },
  actionbarleftpanel: {
    flex: 1
  },
  actionbarcenterpanel: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center"
  },
  actionbarrightpanel: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end"
  }
});
