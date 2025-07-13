import { Button } from "@/components/button";
import { Experiment } from "@/types/experiment";
import { createDataPoint, getExperiment, serialize } from "@/utilities/storage";
import { faFileImage, faLightbulb } from "@fortawesome/free-regular-svg-icons";
import { faArrowLeft, faCamera, faCheck, faQuestion, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from 'react';
import { Alert, Dimensions, Image, StyleSheet, Text, View, Modal, Pressable } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';


export default function CaptureScreen() {


  const router = useRouter();
  const {experimentId} = useLocalSearchParams<{experimentId:string}>();


  const [experiment, setExperiment] = useState<Experiment>();


  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const {hasPermission, requestPermission} = useCameraPermission();
  const [torchState, setTorchState] = useState<'on'|'off'>('off');
  const [helpModalVisible, setHelpModalVisible] = useState(false);


  const [imageURI, setImageURI] = useState("");
  const [isFilled, setIsFilled] = useState(false);
  const [isImageFromPicker, setIsImageFromPicker] = useState(false); // Track if image came from picker

  // For cropping
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;
  const headerHeight = 60;
  const actionbarHeight = 60; 
  const usableHeight = windowHeight - headerHeight - actionbarHeight;
  const maxPreviewWidth = windowWidth * 0.95;
  const maxPreviewHeight = usableHeight * 0.9;
  // Camera size
  const previewWidth = maxPreviewWidth;
  const previewHeight = maxPreviewHeight;

  const [imageDimensions, setImageDimensions] = useState<{width: number, height: number} | null>(null);

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


  const help_ = () => { 
    setHelpModalVisible(true);
  };


  const pick = async () => {
    const image = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4], // overlay/ test strip ratio
      quality: 1,
      allowsMultipleSelection: false,
    });
    
    if (image.assets && image.assets[0]) {
      const selectedImage = image.assets[0];
      
      try {
        // save the cropped image and navigate straight to location picking
        const dataId = await createDataPoint(experiment!.id, selectedImage.uri);
        if (!dataId) {
          Alert.alert("Save was unsuccessful.");
          return;
        }
        
        console.log("Picked image saved directly:", selectedImage.uri);
        router.replace(`/experiment/${experimentId}/canvas/${dataId}`);
      } catch (error) {
        console.error("Error saving picked image:", error);
        Alert.alert("Error", "Failed to save the image.");
      }
    }
  };


  const capture = async () => {
    const image = await cameraRef.current?.takePhoto({flash: 'off'});
    if (image?.path) {
      const uri = `file://${image.path}`; // prepend file://
      setImageURI(uri);
      setIsImageFromPicker(false); // Mark as camera image
      Image.getSize(uri, (width, height) => {
        setImageDimensions({ width, height });
      });
    }
  };


  const confirm = async () => {
    if (!imageURI || !imageDimensions) return;

    try {
      let finalImageUri = imageURI;

      // Only apply auto-cropping for camera images, not picked images
      if (!isImageFromPicker) {
        // Auto-crop camera images to the overlay area
        const containerAspectRatio = previewWidth / previewHeight;
        const imageAspectRatio = imageDimensions.width / imageDimensions.height;

        let displayedImageWidth, displayedImageHeight;
        let offsetX = 0, offsetY = 0;

        if (imageAspectRatio > containerAspectRatio) {
          // crop horizontally, shrink to fit height
          displayedImageHeight = imageDimensions.height;
          displayedImageWidth = imageDimensions.height * containerAspectRatio;
          offsetX = (imageDimensions.width - displayedImageWidth) / 2;
        } else {
          // crop vertically, shrink to fit width
          displayedImageWidth = imageDimensions.width;
          displayedImageHeight = imageDimensions.width / containerAspectRatio;
          offsetY = (imageDimensions.height - displayedImageHeight) / 2;
        }

        // Overlay size
        const overlayLeftPercent = 0.10; 
        const overlayTopPercent = 0.125; 
        const overlayWidthPercent = 0.80; 

        // find overlay dimensions in the preview container
        const overlayWidthInContainer = previewWidth * overlayWidthPercent;
        const overlayHeightInContainer = overlayWidthInContainer * (4 / 3); // 4/3 ratio of test strip
        const overlayLeftInContainer = previewWidth * overlayLeftPercent;
        const overlayTopInContainer = previewHeight * overlayTopPercent;

        // map overlay position to image coordinates
        const cropX = offsetX + (overlayLeftInContainer / previewWidth) * displayedImageWidth;
        const cropY = offsetY + (overlayTopInContainer / previewHeight) * displayedImageHeight;
        const cropWidth = (overlayWidthInContainer / previewWidth) * displayedImageWidth;
        const cropHeight = (overlayHeightInContainer / previewHeight) * displayedImageHeight;

        // Clamp to bounds
        const finalCropX = Math.max(0, Math.min(cropX, imageDimensions.width - cropWidth));
        const finalCropY = Math.max(0, Math.min(cropY, imageDimensions.height - cropHeight));
        const finalCropWidth = Math.min(cropWidth, imageDimensions.width - finalCropX);
        const finalCropHeight = Math.min(cropHeight, imageDimensions.height - finalCropY);

        const croppedResult = await ImageManipulator.manipulateAsync(
          imageURI,
          [
            {
              crop: {
                originX: finalCropX,
                originY: finalCropY,
                width: finalCropWidth,
                height: finalCropHeight,
              },
            },
          ],
          { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
        );

        finalImageUri = croppedResult.uri;
        console.log("using auto-cropped camera image:", finalImageUri);
      } else {
        console.log("using picked image:", finalImageUri);
      }

      // Save the final image
      const dataId = await createDataPoint(experiment!.id, finalImageUri);
      if (!dataId) {
        Alert.alert("Confirm was unsuccessful.");
        return;
      }
      router.replace(`/experiment/${experimentId}/canvas/${dataId}`);
    } catch (e: any) {
      console.error("Cropping error:", e);
    }
  };


  const nextTorchState = torchState === 'on' ? 'off' : 'on';


  return (
    <>
    

      <View style={styles.header}>
        <Button icon={faArrowLeft} margin={10} onPress={()=>router.back()} />
        <Text style={styles.title}>Capture</Text>
        <Button icon={faQuestion} margin={10} onPress={help_} />
      </View>

    {imageURI ? (
      <View style={{ 
        flex: 1, 
        backgroundColor: '#A9A9A9',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <View
          style={{
            width: previewWidth,
            height: previewHeight,
            backgroundColor: '#A9A9A9',
            borderRadius: 12,
            overflow: 'hidden',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >

            <Image
              source={{ uri: imageURI }}
              style={{
                width: '100%',
                height: '100%',
                resizeMode: 'cover',
              }}
            />
        </View>


        {/* overlay box */}
        <View pointerEvents="none"
          style={[
            styles.overlayBox,
            { borderColor: isFilled ? 'lime' : 'lightgrey' }
          ]}
        />

        {/* overlay box border (for accessibility) */}
        <View style={styles.overlayBorder} />
      </View>
    ) : (
      <View
        style={{
          flex: 1,
          backgroundColor: '#A9A9A9',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <View
          style={{
            width: previewWidth,
            height: previewHeight,
            backgroundColor: '#A9A9A9',
            borderRadius: 12,
            overflow: 'hidden',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {device && hasPermission && (
            <Camera
              ref={cameraRef}
              style={{
                width: '100%',
                height: '100%',
              }}
              device={device}
              isActive={true}
              photo={true}
              {...(device.hasTorch && { torch: torchState })}
              onInitialized={() => { Alert.alert('Camera is Ready!'); }}
            />
          )}
        </View>
        {/* Overlay box/border absolutely positioned (see overlayBox style) btw*/}
        <View
          style={[
            styles.overlayBox,
            { borderColor: isFilled ? 'lime' : 'lightgrey' }
          ]}
        /> 

        {/* Overlay box border (for accessibility) */}
        <View style={styles.overlayBorder} />

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
            onPress={()=>{setImageURI(""); setIsImageFromPicker(false);}}
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

      <Modal
        animationType="slide"
        transparent={true}
        visible={helpModalVisible}
        onRequestClose={() => setHelpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Capture Page Help</Text>
            <Text style={styles.modalText}>
              This is the capture page, where you take a capture of a test strip for analysis
              {'\n\n'}
              • Align the test strip in the guide box, then press the camera button to capture
              {'\n\n'}
              • Alternatively, upload a previously taking image of a test strip for analysis with the image icon (note: Uploading unguided scans may affect analysis)
              {'\n\n'}
              • Tap the lightbulb icon to turn on the phone flashlight (for low light scans)
              {'\n\n'}
              • Accept the scan after taking it with the green check, or retake by pressing the red x.
              {'\n\n'}
            </Text>
            <Pressable
              style={styles.modalButton}
              onPress={() => setHelpModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Got it!</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      

    </>
  );
}


const styles = StyleSheet.create({
  overlayBox: {
  position: 'absolute',
  color: 'white',
  opacity: 0.7,
  top: '12.5%',
  left: '10%',
  width: '80%',
  aspectRatio: 3 / 4,
  borderWidth: 7,
  borderRadius: 8,
  borderColor: 'black',
  pointerEvents: 'none',
  },
  overlayBorder: {
  position: 'absolute',
  top: '12.5%',
  left: '10%',
  width: '80%',
  aspectRatio: 3 / 4,
  opacity: 0.7,
  borderWidth: 3,
  borderColor: 'black',
  borderRadius: 8,
  pointerEvents: 'none',
  },
  dialog: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    zIndex: 10,
    alignItems: "center",
    backgroundColor: "black",
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomColor: "#FFC904",
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
    backgroundColor: "black",
    borderTopColor: "#FFC904",
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
  },
    modal: {
    alignItems: "center",
    backgroundColor: "black",
    bottom: 0,
    flex: 1,
    justifyContent: "center",
    left: 0,
    opacity: 0.5,
    position: "absolute",
    right: 0,
    top: 0,
  },
    modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)"
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    margin: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    borderRadius : 15,
    padding: 15,
    borderColor: "black",
    borderWidth: 2,
    backgroundColor: "#FFC904",
    textAlign: "center",
    marginBottom: 20
  },
  modalText: {
    fontSize: 15,
    lineHeight: 24,
  },
  modalButton: {
    backgroundColor: "#FFC904",
    borderRadius: 15,
    padding: 15,
    alignItems: "center"
  },
  modalButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold"
  },
});
