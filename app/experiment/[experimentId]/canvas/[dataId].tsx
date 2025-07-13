import { Button } from "@/components/button";
import { setSpotColor } from "@/components/canvas";
import { DataPoint, Spot, SpotType } from "@/types/data";
import { getDataPoint, saveDataPoint, serialize } from "@/utilities/storage";
import { faArrowLeft, faCheck, faQuestion, faWandMagicSparkles, faXmark } from "@fortawesome/free-solid-svg-icons";
import { Canvas, Circle, DashPathEffect, Fill, FontStyle, Group, Image, Paragraph, RoundedRect, useImage, Skia} from '@shopify/react-native-skia';
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue } from "react-native-reanimated";


export default function CanvasScreen() {


  const router = useRouter();
  const {experimentId, dataId} = useLocalSearchParams<{experimentId:string, dataId:string}>();


  const [isSpinning, setIsSpinning] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);



  const [data, setData] = useState<null|DataPoint>(null);
  useFocusEffect(
    useCallback(() => {

      const fun = async () => {
        console.log(`Experiment data ${experimentId} ${dataId} in focus.`);
        const data = await getDataPoint(parseInt(experimentId), parseInt(dataId));
        if (!data) {
          Alert.alert(`Experiment data ${experimentId} ${dataId} was not found.`);
          router.back();
          return;
        }

        // clear all existing calculations whenever canvas is opened, so users must regenerate analysis data after editing spots
        const newData = {...data};
        let hasCalculations = false;
        for (const spot of newData.spots) {
          if (spot.type === "sample" && spot.calculation !== undefined) {
            delete spot.calculation;
            hasCalculations = true; // mark that there was already data
          }
        }

        // save the cleared data if there were calculations to clear
        if (hasCalculations) {
          await saveDataPoint(parseInt(experimentId), newData);
        }

        setData(newData);
      }
      fun();

      return () => {
        // Clean up async.
        console.log(`Experiment data ${experimentId} ${dataId} out of focus.`);
      };

    }, [router, experimentId, dataId])
  );


  const canvasDimension = useSharedValue({width: 0, height: 0});
  const softZoneSize = useSharedValue(80);
  const shiftSize = useSharedValue(5);
  const zoomFactor = useSharedValue(0.025);


  // Number of horizontal image pixels on canvas.
  const frameSize = useSharedValue(20);
  const minFrameSize = useSharedValue(20);
  const maxFrameSize = useSharedValue(20);

  const framePositionX = useSharedValue(0);
  const framePositionY = useSharedValue(0);

  // calculateFrameScale
  // => canvasWidth / frameSize

  // convertToCanvasPosition
  // => (imagePosition + framePosition) * scale

  // convertToImagePosition
  // => canvasPosition / scale - framePosition

  // Number of canvas pixels that
  // fit within an image frame pixel.
  const frameScale = useDerivedValue(() => {
    return canvasDimension.value.width / frameSize.value;
  });


  const imageTransform = useDerivedValue(() => {
    return [
      {scale: frameScale.value},
      {translateX: framePositionX.value},
      {translateY: framePositionY.value}
    ]
  });


  const spotRadius = useSharedValue(100);
  const minSpotRadius = useSharedValue(10);
  const maxSpotRadius = useSharedValue(10);


  const [selectedOverlayId, setSelectedOverlayId] = useState<number>();
  const [selectedOverlayType, setSelectedOverlayType] = useState<SpotType>("baseline");

  const selectedOverlayX = useSharedValue(0);
  const selectedOverlayY = useSharedValue(0);
  const selectedOverlayR = useDerivedValue(() => {
    return spotRadius.value * frameScale.value;
  });

  const selectedBounds = useDerivedValue(() => {
    // Pad the edges of the screen
    // with an invisible border.
    const radius = selectedOverlayR.value;
    const width = canvasDimension.value.width;
    const height = canvasDimension.value.height;
    const offset = softZoneSize.value + radius;
    return {
      hard: {
        top: radius,
        left: radius,
        right: width - radius,
        bottom: height - radius
      },
      soft: {
        top: offset,
        left: offset,
        right: width - offset,
        bottom: height - offset
      }
    }
  });


  const pointer = useAnimatedStyle(() => {
    const radius = canvasDimension.value.width / 5;
    return {
      position: "absolute",
      top: -radius, // -radius
      left: -radius, // -radius
      width: radius * 2, // radius
      height: radius * 2, // radius
      borderColor: "red",
      borderWidth: 2,
      transform: [
        {translateX: selectedOverlayX.value},
        {translateY: selectedOverlayY.value}
      ]
    }
  });


  const image = useImage(data?.image);
  useEffect(() => {
    if (image) {
      const imageWidth = image.width();
      frameSize.value = imageWidth;
      maxFrameSize.value = imageWidth;
      maxSpotRadius.value = imageWidth / 4;
    }
  }, [image, frameSize, maxFrameSize, maxSpotRadius]);


  const fontFamily = Platform.select({ ios: "Helvetica", default: "serif" });


  // Ensures the data point and image are
  // acquired before the canvas is rendered.
  if (data === null
    || image === null) {
    return <View></View>
  }


  console.log(`Data: ${serialize(data)}`);
  console.log(`Selected Spot: ${selectedOverlayId}`);


  const help_ = () => { 
    setHelpModalVisible(true);
  };


  const add_ = () => {

    const newSpot: Spot = {
      type: "baseline",
      area: {
        x: image.width()/2,
        y: image.height()/2,
        r: 100
      },
      color: {
        red: 0,
        green: 0,
        blue: 0
      }
    }

    setSpotColor(newSpot, image);

    const newData = {...data};
    newData.spots.push(newSpot);

    setData(newData);
  }


  const select_ = (spotId: number) => {
    if (spotId === selectedOverlayId) {
      setSelectedOverlayId(undefined);
      return;
    }
    let selected = data.spots.filter((_, index)=>{return index === spotId});
    if (selected.length === 1) {
      const newSelectedSpot = selected[0];
      console.log(`Selected Spot: (${spotId}) ${newSelectedSpot}`);
      const scale = frameScale.value;
      selectedOverlayX.value = (newSelectedSpot.area.x + framePositionX.value) * scale;
      selectedOverlayY.value = (newSelectedSpot.area.y + framePositionY.value) * scale;
      spotRadius.value = newSelectedSpot.area.r;
      setSelectedOverlayType(newSelectedSpot.type);
      setSelectedOverlayId(spotId);
    }
  }


  const toggle_ = () => {
    setSelectedOverlayType(
      selectedOverlayType === "baseline" ? "sample":
      selectedOverlayType === "sample" ? "white":
      selectedOverlayType === "white" ? "black":
      "baseline"
    );
  }


  const save_ = async (spotId: number) => {
    setIsSpinning(true);

    const scale = frameScale.value;
    console.log(`Frame Position (X, Y): (${framePositionX.value}, ${framePositionY.value})`);
    console.log(`Frame Scale: ${scale}`);
    console.log(`Overlay Position (X, Y): (${selectedOverlayX.value}, ${selectedOverlayY.value})`);

    const newData = {...data};
    const spot = newData.spots[spotId];
    spot.type = selectedOverlayType;
    spot.area.x = Math.round(selectedOverlayX.value / scale - framePositionX.value);
    spot.area.y = Math.round(selectedOverlayY.value / scale - framePositionY.value);
    spot.area.r = spotRadius.value;

    console.log(`Data: ${serialize(newData)}`);

    console.log(`Spot Type: ${spot.type}`);
    console.log(`Spot X Coordinate: ${spot.area.x}`);
    console.log(`Spot Y Coordinate: ${spot.area.y}`);

    setSpotColor(spot, image);

    // If a reference spot has been updated
    // need to delete any sample spot results.

    if (spot.type !== "sample") {
      for (const spot_ of newData.spots) {
        if (spot_.type === "sample") {
          delete spot_.calculation;
        }
      }
    }

    await saveDataPoint(parseInt(experimentId), newData);

    setData(newData);
    setSelectedOverlayId(undefined);

    setIsSpinning(false);
  }


  const delete_ = async (spotId: number) => {
    setIsSpinning(true);

    const newData = {...data};
    newData.spots = newData.spots.filter((_, index)=>{return index !== spotId});

    await saveDataPoint(parseInt(experimentId), newData);

    setData(newData);
    setSelectedOverlayId(undefined);

    setIsSpinning(false);
  }


  const drag = Gesture.Pan().onChange((event) => {
    console.log(event);


    const shiftValue = shiftSize.value;
    const scaleValue = frameScale.value;

    const shift = () => {
      return shiftValue / scaleValue;
    }


    const newX = selectedOverlayX.value + event.changeX;
    const newY = selectedOverlayY.value + event.changeY;


    const bound = selectedBounds.value;

    if (newX < bound.hard.left) {
      selectedOverlayX.value = bound.hard.left;
      framePositionX.value += shift();
    } else if (newX < bound.soft.left) {
      selectedOverlayX.value = newX;
      framePositionX.value += shift();
    } else if (bound.hard.right < newX) {
      selectedOverlayX.value = bound.hard.right;
      framePositionX.value -= shift();
    } else if (bound.soft.right < newX) {
      selectedOverlayX.value = newX;
      framePositionX.value -= shift();
    } else {
      selectedOverlayX.value = newX;
    }

    if (newY < bound.hard.top) {
      selectedOverlayY.value = bound.hard.top;
      framePositionY.value += shift();
    } else if (newY < bound.soft.top) {
      selectedOverlayY.value = newY;
      framePositionY.value += shift();
    } else if (bound.hard.bottom < newY) {
      selectedOverlayY.value = bound.hard.bottom;
      framePositionY.value -= shift();
    } else if (bound.soft.bottom < newY) {
      selectedOverlayY.value = newY;
      framePositionY.value -= shift();
    } else {
      selectedOverlayY.value = newY;
    }


    console.log(`X (${newX}): ${bound.hard.left} < ${selectedOverlayX.value} < ${bound.hard.right}`);
    console.log(`Y (${newY}): ${bound.hard.top} < ${selectedOverlayY.value} < ${bound.hard.bottom}`);
  });


  const resize = Gesture.Pinch().onChange((event) => {
    console.log(event);


    const curSpotRadius = spotRadius.value;


    if (0 < event.velocity) {
      if (curSpotRadius < maxSpotRadius.value) {
        spotRadius.value += 1;
      }
    } else if (event.velocity < 0) {
      if (minSpotRadius.value < curSpotRadius) {
        spotRadius.value -= 1;
      }
    }


    console.log(`Spot Radius: ${spotRadius.value}`);
  });


  const dragCanvas = Gesture.Pan().minPointers(2).onChange((event) => {
    console.log(event);


    const scale = frameScale.value;

    selectedOverlayX.value += event.changeX;
    selectedOverlayY.value += event.changeY;
    framePositionX.value += event.changeX / scale;
    framePositionY.value += event.changeY / scale;


    console.log(`Frame Position X: ${framePositionX.value}`);
    console.log(`Frame Position Y: ${framePositionY.value}`);
  });


  const zoom = Gesture.Pinch().onChange((event) => {
    console.log(event);


    const curFrameSize = frameSize.value;

    const zf = zoomFactor.value;
    const frameSizeChange = zf * curFrameSize;
    const framePositionChange = zf * curFrameSize / 2;


    if (0 < event.velocity) {
      if (minFrameSize.value <= curFrameSize) {

        const canvasWidth = canvasDimension.value.width;

        const curFrameScale = frameScale.value;
        const curFramePositionX = framePositionX.value;
        const curFramePositionY = framePositionY.value;
        const curCanvasPositionX = selectedOverlayX.value;
        const curCanvasPositionY = selectedOverlayY.value;

        const newFrameSize = curFrameSize - frameSizeChange;
        const newFramePositionX = curFramePositionX - framePositionChange;
        const newFramePositionY = curFramePositionY - framePositionChange;

        const newFrameScale = canvasWidth / newFrameSize;

        const imagePositionX = curCanvasPositionX / curFrameScale - curFramePositionX;
        const newCanvasPositionX = (imagePositionX + newFramePositionX) * newFrameScale;
        const imagePositionY = curCanvasPositionY / curFrameScale - curFramePositionY;
        const newCanvasPositionY = (imagePositionY + newFramePositionY) * newFrameScale;

        frameSize.value = newFrameSize;
        framePositionX.value = newFramePositionX;
        framePositionY.value = newFramePositionY;

        selectedOverlayX.value = newCanvasPositionX;
        selectedOverlayY.value = newCanvasPositionY;

      }
    } else if (event.velocity < 0) {
      if (frameSize.value < maxFrameSize.value) {

        const canvasWidth = canvasDimension.value.width;

        const curFrameScale = frameScale.value;
        const curFramePositionX = framePositionX.value;
        const curFramePositionY = framePositionY.value;
        const curCanvasPositionX = selectedOverlayX.value;
        const curCanvasPositionY = selectedOverlayY.value;

        const newFrameSize = curFrameSize + frameSizeChange;
        const newFramePositionX = curFramePositionX + framePositionChange;
        const newFramePositionY = curFramePositionY + framePositionChange;

        const newFrameScale = canvasWidth / newFrameSize;

        const imagePositionX = curCanvasPositionX / curFrameScale - curFramePositionX;
        const newCanvasPositionX = (imagePositionX + newFramePositionX) * newFrameScale;
        const imagePositionY = curCanvasPositionY / curFrameScale - curFramePositionY;
        const newCanvasPositionY = (imagePositionY + newFramePositionY) * newFrameScale;

        frameSize.value = newFrameSize;
        framePositionX.value = newFramePositionX;
        framePositionY.value = newFramePositionY;

        selectedOverlayX.value = newCanvasPositionX;
        selectedOverlayY.value = newCanvasPositionY;

      }
    }


    console.log(`Frame Size Change: ${frameSizeChange}`);
    console.log(`Frame Position Change: ${framePositionChange}`);
    console.log(`Frame Size: ${frameSize.value}`);
    console.log(`Frame Position X: ${framePositionX.value}`);
    console.log(`Frame Position Y: ${framePositionY.value}`);
  });


  const DottedCircle = (spot: Spot) => {
    return (
      <Circle cx={spot.area.x} cy={spot.area.y} r={spot.area.r} style="stroke" strokeWidth={2} color="black">
        <DashPathEffect intervals={[15, 15]} phase={0} />
      </Circle>
    );
  };


  const SpotLabel = (spotId: number, spot: Spot) => {

    const maxLineWidth = 400;

    const paragraph = Skia.ParagraphBuilder
    .Make({
      ellipsis: "..",
      maxLines: 1
    })
    .pushStyle({
      color: Skia.Color("black"),
      fontFamilies: [fontFamily],
      fontSize: 50,
      fontStyle: FontStyle.Bold
    })
    .addText(`${spotId}. ${spot.type}`)
    .build();

    paragraph.layout(maxLineWidth);
    const actualLineWidth = paragraph.getLongestLine();
    const actualLineHeight = paragraph.getHeight();

    return (
      <>
        <RoundedRect x={spot.area.x-15} y={spot.area.y-15} width={actualLineWidth+30} height={actualLineHeight+30} r={15} color="white" opacity={0.5} />
        <Paragraph paragraph={paragraph} x={spot.area.x} y={spot.area.y} width={maxLineWidth} />
      </>
    );
  };


  return (
    <>

      <View style={styles.header}>
        <Button icon={faArrowLeft} margin={10} onPress={()=>router.back()} />
        <Text style={styles.title}>Canvas</Text>
        <Button icon={faQuestion} margin={10} onPress={help_} />
      </View>

      <View style={styles.container}>

        <GestureDetector gesture={zoom}>
        <GestureDetector gesture={dragCanvas}>
        <Canvas style={styles.canvas} onSize={canvasDimension}>
          <Fill color="lightgrey" />


          <Group transform={imageTransform}>
            <Image image={image} fit="none" x={0} y={0} width={image.width()} height={image.height()} />
            {data.spots.map((spot, index) => (
            <Group key={index}>
            {index !== selectedOverlayId ?
            <>
            <Circle cx={spot.area.x} cy={spot.area.y} r={spot.area.r} color="white" opacity={0.25} />
            <Circle cx={spot.area.x} cy={spot.area.y} r={spot.area.r} style="stroke" color="black" />
            {SpotLabel(index, spot)}
            </>
            :
            DottedCircle(spot)
            }
            </Group>
            ))}
          </Group>

          {selectedOverlayId !== undefined &&
          <>
          <Circle cx={selectedOverlayX} cy={selectedOverlayY} r={selectedOverlayR} style="stroke" strokeWidth={2} color="white" opacity={0.5} />
          <Circle cx={selectedOverlayX} cy={selectedOverlayY} r={selectedOverlayR} style="stroke" strokeWidth={1} color="black" />
          </>
          }


        </Canvas>
        </GestureDetector>
        </GestureDetector>


        {selectedOverlayId !== undefined &&
        <GestureDetector gesture={resize}>
        <GestureDetector gesture={drag}>
          <Animated.View style={pointer} />
        </GestureDetector>
        </GestureDetector>
        }

        {selectedOverlayId !== undefined &&
        <View style={styles.modbar}>
          <Button
            icon={faXmark}
            backgroundColor="red"
            margin={10}
            onPress={()=>delete_(selectedOverlayId)}
          />
          <Pressable style={styles.toggle} onPress={toggle_}>
            <Text>{selectedOverlayType}</Text>
          </Pressable>
          <Button
            icon={faCheck}
            backgroundColor="green"
            margin={10}
            onPress={()=>save_(selectedOverlayId)}
          />
        </View>
        }
      </View>

      <View style={styles.actionbar}>
        <ScrollView style={styles.selectionbar} horizontal>
          {data.spots.map((_, index) => (
          <Pressable
            key={index}
            onPress={()=>select_(index)}
            style={index===selectedOverlayId?styles.selected:styles.selectable}
          >
            <Text>{index}</Text>
          </Pressable>
          ))}
        </ScrollView>
        <Button
          icon={faWandMagicSparkles}
          margin={10}
          onPress={add_}
        />
      </View>

      <Modal visible={isSpinning} transparent={true} animationType="fade">
      <View style={styles.modal}>
        <ActivityIndicator animating={isSpinning} size="large" color="white" />
      </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={helpModalVisible}
        onRequestClose={() => setHelpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Canvas Page Help</Text>
            <Text style={styles.modalText}>
              This is the canvas page, where you mark test points on your capture
              {'\n\n'}
              • Create a test point with the wand icon, and select a test point from the bottom bar
              {'\n\n'}
              • Move and resize the test point with pinching and dragging to cover a mark on the test strip
              {'\n\n'}
              • Assign the marker's classification by tapping the name at the top of the canvas
              {'\n\n'}
                    • <Text style={{fontWeight: 'bold'}}>Baseline</Text>: mark a location on the test strip with no sample as a control point.
                                  {'\n'}
                    • <Text style={{fontWeight: 'bold'}}>Sample</Text>: mark all experimental samples with this label
                                  {'\n'}
                    • <Text style={{fontWeight: 'bold'}}>White</Text>: mark the white control point with this label
                                  {'\n'}
                    • <Text style={{fontWeight: 'bold'}}>Black</Text>: mark the black control point with this label
              {'\n'}
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
  header: {
    alignItems: "center",
    backgroundColor: "black",
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomColor: "#FFC904",
    borderBottomWidth: 3,
    zIndex: 10
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    color: "white"
  },
  container: {
    flex: 1
  },
  canvas: {
    flex: 1
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
  modbar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  toggle: {
    backgroundColor: "#FFC904",
    borderRadius: 15,
    borderWidth: 1,
    padding: 10
  },
  actionbar: {
    flexDirection: "row",
    backgroundColor: "black",
    borderTopColor: "#FFC904",
    borderTopWidth: 3
  },
  selectionbar: {
    backgroundColor: "black",
  },
  selectable: {
    alignItems: "center",
    backgroundColor: "#FFC904",
    borderColor: "black",
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: "center",
    height: 40,
    margin: 10,
    width: 40,
  },
  selected: {
    alignItems: "center",
    backgroundColor: "white",
    borderColor: "black",
    borderRadius: 20,
    borderStyle: "dashed",
    borderWidth: 4,
    justifyContent: "center",
    height: 40,
    margin: 10,
    width: 40
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
