import { useRef, useState, useEffect } from 'react';
import { Platform, View, Image, Text, Button, Alert, StyleSheet } from 'react-native';
import { PermissionStatus, RESULTS, PERMISSIONS, check, request } from 'react-native-permissions';
import { useCameraDevice, Camera } from 'react-native-vision-camera';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { launchImageLibrary } from 'react-native-image-picker';

enum PermissionType { CAMERA, READ_PHOTO, WRITE_PHOTO }

export default function App() {

  /* Hooks */

  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const [torchState, setTorchState] = useState<'on'|'off'>('off');

  const [imageURI, setImageURI] = useState('');
  const [concentration, setConcentration] = useState<null|Number>(null);

  const [cameraPermission, setCameraPermission] = useState<PermissionStatus>();
  const [readPhotoPermission, setReadPhotoPermission] = useState<PermissionStatus>();
  const [writePhotoPermission, setWritePhotoPermission] = useState<PermissionStatus>();

  // These temporarily added to bypass permissions during prototyping.
  const [ignoreCameraPermission, setIgnoreCameraPermission] = useState(false);
  const [ignoreReadPhotoPermission, setIgnoreReadPhotoPermission] = useState(false);
  const [ignoreWritePhotoPermission, setIgnoreWritePhotoPermission] = useState(false);

  useEffect(() => {
    doPermission(PermissionType.CAMERA);
  }, []);

  useEffect(() => {
    doPermission(PermissionType.READ_PHOTO);
  }, []);

  useEffect(() => {
    doPermission(PermissionType.WRITE_PHOTO);
  }, []);

  const doPermission = async (type : PermissionType) => {
    if (Platform.OS === 'android') {
      switch (type) {
        case PermissionType.CAMERA:
          setCameraPermission(await check(PERMISSIONS.ANDROID.CAMERA));
          break;
        case PermissionType.READ_PHOTO:
          setReadPhotoPermission(RESULTS.GRANTED);
          break;
        case PermissionType.WRITE_PHOTO:
          setWritePhotoPermission(await check(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE));
          break;
      }
    } else if (Platform.OS === 'ios') {
      switch (type) {
        case PermissionType.CAMERA:
          setCameraPermission(await check(PERMISSIONS.IOS.CAMERA));
          break;
        case PermissionType.READ_PHOTO:
          setReadPhotoPermission(await check(PERMISSIONS.IOS.PHOTO_LIBRARY));
          break;
        case PermissionType.WRITE_PHOTO:
          setWritePhotoPermission(await check(PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY));
          break;
      }
    }
  };

  const requestPermission = async (type : PermissionType) => {
    if (Platform.OS === 'android') {
      switch (type) {
        case PermissionType.CAMERA:
          setCameraPermission(await request(PERMISSIONS.ANDROID.CAMERA));
          break;
        case PermissionType.READ_PHOTO:
          setReadPhotoPermission(RESULTS.GRANTED);
          break;
        case PermissionType.WRITE_PHOTO:
          setWritePhotoPermission(await request(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE));
          break;
      }
    } else if (Platform.OS === 'ios') {
      switch (type) {
        case PermissionType.CAMERA:
          setCameraPermission(await request(PERMISSIONS.IOS.CAMERA));
          break;
        case PermissionType.READ_PHOTO:
          setReadPhotoPermission(await request(PERMISSIONS.IOS.PHOTO_LIBRARY));
          break;
        case PermissionType.WRITE_PHOTO:
          setWritePhotoPermission(await request(PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY));
          break;
      }
    }
  };

  const isGranted = (status : PermissionStatus) => {
    return status === RESULTS.GRANTED || status === RESULTS.LIMITED;
  };

  /* Check Support and Permissions */

  if (device == null
    || (Platform.OS !== 'android' && Platform.OS !== 'ios')) {
    return (
      <View style={styles.dialogContainer}>
        <Text>
          Wait...
          If this message does not disappear.
          It may be because this device ({`${device}`}) ({Platform.OS}) is not supported.
        </Text>
      </View>
    );
  }

  if (!cameraPermission
    || !readPhotoPermission
    || !writePhotoPermission) {
    return <View />;
  }

  console.log(`Torch State: ${torchState}`);
  console.log(`Image URI: ${imageURI}`);
  console.log(`Camera Permission: ${cameraPermission}`);
  console.log(`Read Photo Permission: ${readPhotoPermission}`);
  console.log(`Write Photo Permission: ${writePhotoPermission}`);
  console.log(`Ignore Camera Permission: ${ignoreCameraPermission}`);
  console.log(`Ignore Read Photo Permission: ${ignoreReadPhotoPermission}`);
  console.log(`Ignore Write Photo Permission: ${ignoreWritePhotoPermission}`);

  if (!ignoreCameraPermission) {
  if (cameraPermission === RESULTS.UNAVAILABLE
    || cameraPermission === RESULTS.BLOCKED) {
    return (
      <View style={styles.dialogContainer}>
        <Text>
          Please check the settings of this device.
          The camera permissions on this device show ({cameraPermission}).
        </Text>
        <Button onPress={() => {}} title="Try Again" />
        <Button onPress={() => {setIgnoreCameraPermission(true);}} title="Ignore" />
      </View>
    );
  }
  }

  if (!ignoreReadPhotoPermission) {
  if (readPhotoPermission === RESULTS.UNAVAILABLE
    || readPhotoPermission === RESULTS.BLOCKED) {
    return (
      <View style={styles.dialogContainer}>
        <Text>
          Please check the settings of this device.
          The media permissions on this device show ({readPhotoPermission}).
        </Text>
        <Button onPress={() => {}} title="Try Again" />
        <Button onPress={() => {setIgnoreReadPhotoPermission(true);}} title="Ignore" />
      </View>
    );
  }
  }

  if (!ignoreWritePhotoPermission) {
  if (writePhotoPermission === RESULTS.UNAVAILABLE
    || writePhotoPermission === RESULTS.BLOCKED) {
    return (
      <View style={styles.dialogContainer}>
        <Text>
          Please check the settings of this device.
          The media permissions on this device show ({writePhotoPermission}).
        </Text>
        <Button onPress={() => {}} title="Try Again" />
        <Button onPress={() => {setIgnoreWritePhotoPermission(true);}} title="Ignore" />
      </View>
    );
  }
  }

  /* Request Camera Permissions */

  if (!ignoreCameraPermission) {
  if (!isGranted(cameraPermission)) {
    // When RESULTS.DENIED
    return (
      <View style={styles.dialogContainer}>
        <Text>Can we access your camera?</Text>
        <Button onPress={() => {requestPermission(PermissionType.CAMERA);}} title="Ok" />
      </View>
    );
  }
  }

  /* Request Media Library Permissions */

  if (!ignoreReadPhotoPermission) {
  if (!isGranted(readPhotoPermission)) {
    // When RESULTS.DENIED
    return (
      <View style={styles.dialogContainer}>
        <Text>Can we access your media library?</Text>
        <Button onPress={() => {requestPermission(PermissionType.READ_PHOTO);}} title="Ok" />
      </View>
    );
  }
  }

  if (!ignoreWritePhotoPermission) {
  if (!isGranted(writePhotoPermission)) {
    // When RESULTS.DENIED
    return (
      <View style={styles.dialogContainer}>
        <Text>Can we access your media library?</Text>
        <Button onPress={() => {requestPermission(PermissionType.WRITE_PHOTO);}} title="Ok" />
      </View>
    );
  }
  }

  /* Capture and Save Image to Photos */

  const captureImage = async () => {
    const image = await cameraRef.current?.takePhoto({flash: 'off'});
    if (image) {
      // Is file:// needed and is it cross platform?
      const file_path = `file://${image.path}`;
      await CameraRoll.saveAsset(file_path, {type: 'photo'});
      setImageURI(file_path);
    }
  };

  /* Display Image from Photos */

  const pickImage = async () => {
    const image = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: false,
    });
    if (image.errorCode) {
      Alert.alert('Error picking image.');
    } else if (!image.didCancel && image.assets && image.assets[0].uri) {
      setImageURI(image.assets[0].uri);
    }
  };

  /* Image Analysis */

  const imageAnalysis = (imageURI : string) => {
    const concentration = Math.round(Math.random() * 100);
    imageURI;
    setConcentration(concentration);
  };

  if (imageURI) {
    return (
      <View style={styles.container}>
        <Image
          style={styles.imageContainer}
          source={{ uri: imageURI }}
        />
        { concentration!==null &&
        <Text>Concentration: {`${concentration}`} ppm</Text>
        }
        <View style={styles.imageButtonsContainer}>
          <Button
            title="Analyse Image"
            onPress={() => {imageAnalysis(imageURI);}}
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
          title="Pick Image"
          onPress={pickImage}
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
