import { Button } from "@/components/button";
import { Experiment } from "@/types/experiment";
import { getExperiment } from "@/utilities/storage";
import { faArrowLeft, faQuestion } from "@fortawesome/free-solid-svg-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';


export default function CaptureScreen() {


  const router = useRouter();
  const {experimentId} = useLocalSearchParams<{experimentId:string}>();
  const [experiment, setExperiment] = useState<Experiment>();


  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const {hasPermission, requestPermission} = useCameraPermission();
  const [torchState, setTorchState] = useState<'on'|'off'>('off');


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
      }
      fun();

      return () => {
        // Clean up async.
        console.log(`Experiment ${experimentId} out of focus.`);
      };

    }, [router, experimentId])
  );


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


  console.log(experiment);


  const capture = async () => {
    const dataId = Math.round(Math.random() * 5);
    const image = await cameraRef.current?.takePhoto({flash: 'off'});
    if (image) {
      // Is file:// needed and is it cross platform?
      const file_path = `file://${image.path}`;
      console.log(file_path);
    }
    router.replace(`/experiment/${experimentId}/canvas/${dataId}`);
  };


  const nextTorchState = torchState === 'on' ? 'off' : 'on';


  return (
    <>

      <View style={styles.header}>
        <Button icon={faArrowLeft} margin={10} onPress={()=>router.back()} />
        <Text style={styles.title}>Capture</Text>
        <Button icon={faQuestion} margin={10} />
      </View>

      <Camera
        style={styles.camera}
        ref={cameraRef}
        device={device}
        isActive={true}
        photo={true}
        {...(device.hasTorch && { torch: torchState })}
        onInitialized={() => {Alert.alert('Camera is Ready!');}}
      />

      <View style={styles.actionbar}>

        <View style={styles.actionbarleftpanel}></View>

        <View style={styles.actionbarcenterpanel}>
          <Button margin={10} onPress={capture} />
        </View>

        <View style={styles.actionbarrightpanel}>
          { device.hasTorch &&
          <Button margin={10} onPress={() => {setTorchState(nextTorchState);}} />
          }
        </View>
      </View>

    </>
  );
}


const styles = StyleSheet.create({
  dialog: {
    flex: 1,
    justifyContent: 'center',
  },
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
  camera: {
    flex: 1,
  },
  actionbar: {
    flexDirection: "row"
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
