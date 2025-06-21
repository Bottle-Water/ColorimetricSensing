import { calcConc } from '@/utilities/analysis';
import { drawEdges } from '@/utilities/imgproc';
import { Canvas, Fill, Image, useImage } from '@shopify/react-native-skia';
import { useRef, useState } from 'react';
import { Alert, Button, Dimensions, StyleSheet, Text, View } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';


export default function Scanner({
  onBack=()=>{}
}: {
  onBack: ()=>void,
}) {

  /* Hooks */

  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const [torchState, setTorchState] = useState<'on'|'off'>('off');

  const [imageURI, setImageURI] = useState('');
  const [concentration, setConcentration] = useState<null|number>(null);

  const {hasPermission, requestPermission} = useCameraPermission();

  const image = useImage(imageURI);

  /* Check Support and Permissions */

  if (device == null) {
    return (
      <View style={styles.dialogContainer}>
        <Text>
          Wait...
          If this message does not disappear.
          It may be because this device ({`${device}`}) is not supported.
        </Text>
      </View>
    );
  }

  /* Request Camera Permissions */

  if (!hasPermission) {
    return (
      <View style={styles.dialogContainer}>
        <Text>Can we access your camera?</Text>
        <Button onPress={requestPermission} title="Ok" />
      </View>
    );
  }

  /* Capture Image */

  const captureImage = async () => {
    const image = await cameraRef.current?.takePhoto({flash: 'off'});
    if (image) {
      // Is file:// needed and is it cross platform?
      const file_path = `file://${image.path}`;
      setImageURI(file_path);
    }
  };

  if (imageURI) {

    let grayImage = null;
    if (image) {
      grayImage = drawEdges(image);
      //const circles = detectCircles(image);
      //if (circles) {
      //  grayImage = drawCircles(image, circles);
      //}
    }

    const dim = Dimensions.get('window')

    return (
      <View style={styles.container}>
        {grayImage &&
        <Canvas style={{flex: 1}} >
          <Fill color="lightblue" />
          <Image image={grayImage} fit="scaleDown" x={0} y={0} width={dim.width} height={dim.height/2} />
        </Canvas>
        }
        { concentration!==null &&
        <Text>Concentration: {`${concentration}`} ppm</Text>
        }
        <View style={styles.imageButtonsContainer}>
          <Button
            title="Analyse Image"
            onPress={() => {setConcentration(calcConc())}}
          />
          <Button
            title="Back to Camera"
            onPress={() => {
              setImageURI('');
              setConcentration(null);
            }}
          />
        </View>
      </View>
    );
  }

  /* Render Camera View */

  const nextTorchState = torchState === 'on' ? 'off' : 'on';

  return (
    <View style={styles.container}>
      <Camera
        style={styles.cameraContainer}
        ref={cameraRef}
        device={device}
        isActive={true}
        photo={true}
        {...(device.hasTorch && { torch: torchState })}
        onInitialized={() => {Alert.alert('Camera is Ready!');}}
      />
      <View style={styles.cameraButtonsContainer}>
        { device.hasTorch &&
        <Button
          title={`Toggle Torch ${nextTorchState}`}
          onPress={() => {setTorchState(nextTorchState);}}
        />
        }
        <Button
          title="Capture Image"
          onPress={captureImage}
        />
        <Button
          title="Back"
          onPress={onBack}
        />
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dialogContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  imageContainer: {
    flex: 4,
  },
  imageButtonsContainer: {
    flex: 1,
  },
  cameraContainer: {
    flex: 4,
  },
  cameraButtonsContainer: {
    flex: 1,
  },
});
