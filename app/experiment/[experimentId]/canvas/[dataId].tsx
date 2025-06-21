import { Button } from "@/components/button";
import { DataPoint, Spot } from "@/types/data";
import { getDataPoint, saveDataPoint, serialize } from "@/utilities/storage";
import { faArrowLeft, faCheck, faQuestion, faWandMagicSparkles, faXmark } from "@fortawesome/free-solid-svg-icons";
import { Canvas, Circle, Fill, Group, Image, useImage } from '@shopify/react-native-skia';
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, LayoutChangeEvent, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue } from "react-native-reanimated";


const radius = 10;


export default function CanvasScreen() {


  const router = useRouter();
  const {experimentId, dataId} = useLocalSearchParams<{experimentId:string, dataId:string}>();


  const [canvasTopBound, setCanvasTopBound] = useState(0);
  const [canvasLeftBound, setCanvasLeftBound] = useState(0);
  const [canvasRightBound, setCanvasRightBound] = useState(0);
  const [canvasBottomBound, setCanvasBottomBound] = useState(0);


  // Holds the original coordinates.
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
        setData(data);
      }
      fun();

      return () => {
        // Clean up async.
        console.log(`Experiment data ${experimentId} ${dataId} out of focus.`);
      };

    }, [router, experimentId, dataId])
  );


  const image = useImage(data?.image);


  const [selectedOverlayId, setSelectedOverlayId] = useState<number>();
  const [selectedHardTopBound, setSelectedHardTopBound] = useState(0);
  const [selectedSoftTopBound, setSelectedSoftTopBound] = useState(0);
  const [selectedHardLeftBound, setSelectedHardLeftBound] = useState(0);
  const [selectedSoftLeftBound, setSelectedSoftLeftBound] = useState(0);
  const [selectedHardRightBound, setSelectedHardRightBound] = useState(0);
  const [selectedSoftRightBound, setSelectedSoftRightBound] = useState(0);
  const [selectedHardBottomBound, setSelectedHardBottomBound] = useState(0);
  const [selectedSoftBottomBound, setSelectedSoftBottomBound] = useState(0);


  const frameSize = useSharedValue(0);
  const framePositionX = useSharedValue(0);
  const framePositionY = useSharedValue(0);


  // Location of image top-left corner in canvas
  // pixels relative to canvas top-left corner.
  const imageTranslateX = useSharedValue(0);
  const imageTranslateY = useSharedValue(0);
  // Number of canvas pixels that
  // fit within an image pixel.
  const imageScale = useSharedValue(0);
  const imageTransform = useDerivedValue(() => {
    return [
      {translateX: imageTranslateX.value},
      {translateY: imageTranslateY.value},
      {scale: imageScale.value}
    ]
  });

  // These are nessessary. Skia Circles only updates
  // When individual shared values for x and y are given.
  const selectedOverlayX = useSharedValue(0);
  const selectedOverlayY = useSharedValue(0);

  const style = useAnimatedStyle(() => {
    // These positions are relative to the canvas.
    return {
      position: "absolute",
      top: -radius,
      left: -radius,
      width: radius * 2,
      height: radius * 2,
      borderColor: "red",
      borderWidth: 2,
      transform: [{ translateX: selectedOverlayX.value }, { translateY: selectedOverlayY.value }]
    }
  });


  useEffect(() => {
    if (image) {
      const canvasSize = canvasRightBound - canvasLeftBound;
      frameSize.value = image.width();
      imageScale.value = canvasSize / image.width();
    }
  });


  // Ensures the data point and image are
  // acquired before the canvas is rendered.
  if (!data || !image) {
    return <View></View>
  }


  console.log(`Data: ${serialize(data)}`);
  console.log(`Selected Spot: ${selectedOverlayId}`);


  const onLayoutHandler = (event: LayoutChangeEvent) => {
    const layout = event.nativeEvent.layout;
    const x = layout.x;
    const y = layout.y;
    const width = layout.width;
    const height = layout.height;
    setCanvasTopBound(y);
    setCanvasLeftBound(x);
    setCanvasRightBound(x + width);
    setCanvasBottomBound(y + height);
  };


  const help_ = () => { /* TODO */ };


  const add_ = () => {

    const newSpot: Spot = {
      type: "reference",
      shape: "dot",
      area: {
        x: image.width()/2,
        y: image.height()/2
      }
    }

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
      // Pad the edges of the screen
      // with an invisible border.
      const border = 40;
      const radius = 10;
      setSelectedHardTopBound(canvasTopBound + radius);
      setSelectedSoftTopBound(canvasTopBound + radius + border);
      setSelectedHardLeftBound(canvasLeftBound + radius);
      setSelectedSoftLeftBound(canvasLeftBound + radius + border);
      setSelectedHardRightBound(canvasRightBound - radius);
      setSelectedSoftRightBound(canvasRightBound - radius - border);
      setSelectedHardBottomBound(canvasBottomBound - radius);
      setSelectedSoftBottomBound(canvasBottomBound - radius - border);
      selectedOverlayX.value = newSelectedSpot.area.x * imageScale.value + imageTranslateX.value;
      selectedOverlayY.value = newSelectedSpot.area.y * imageScale.value + imageTranslateY.value;
      setSelectedOverlayId(spotId);
    }
  }


  const save_ = (spotId: number) => {

    const newData = {...data};
    newData.spots[spotId].area.x = (selectedOverlayX.value - imageTranslateX.value) / imageScale.value;
    newData.spots[spotId].area.y = (selectedOverlayY.value - imageTranslateY.value) / imageScale.value;

    // TODO:
    // Spot has been set to a new location
    // 1 Extract color of the spot

    saveDataPoint(parseInt(experimentId), newData);

    setData(newData);
    setSelectedOverlayId(undefined);
  }


  const delete_ = (spotId: number) => {

    const newData = {...data};
    newData.spots = newData.spots.filter((_, index)=>{return index !== spotId});

    saveDataPoint(parseInt(experimentId), newData);

    setData(newData);
    setSelectedOverlayId(undefined);
  }


  const drag = Gesture.Pan().onChange((event) => {
    console.log(event);
    const newX = selectedOverlayX.value + event.changeX;
    const newY = selectedOverlayY.value + event.changeY;
    if (newY < selectedHardTopBound) {
      selectedOverlayY.value = selectedHardTopBound;
      imageTranslateY.value += 5;
      framePositionY.value = imageTranslateY.value / imageScale.value;
    } else if (newY < selectedSoftTopBound) {
      selectedOverlayY.value = newY;
      imageTranslateY.value += 5;
      framePositionY.value = imageTranslateY.value / imageScale.value;
    } else if (selectedHardBottomBound < newY) {
      selectedOverlayY.value = selectedHardBottomBound;
      imageTranslateY.value -= 5;
      framePositionY.value = imageTranslateY.value / imageScale.value;
    } else if (selectedSoftBottomBound < newY) {
      selectedOverlayY.value = newY;
      imageTranslateY.value -= 5;
      framePositionY.value = imageTranslateY.value / imageScale.value;
    } else {
      selectedOverlayY.value = newY;
    }
    if (newX < selectedHardLeftBound) {
      selectedOverlayX.value = selectedHardLeftBound;
      imageTranslateX.value += 5;
      framePositionX.value = imageTranslateX.value / imageScale.value;
    } else if (newX < selectedSoftLeftBound) {
      selectedOverlayX.value = newX;
      imageTranslateX.value += 5;
      framePositionX.value = imageTranslateX.value / imageScale.value;
    } else if (selectedHardRightBound < newX) {
      selectedOverlayX.value = selectedHardRightBound;
      imageTranslateX.value -= 5;
      framePositionX.value = imageTranslateX.value / imageScale.value;
    } else if (selectedSoftRightBound < newX) {
      selectedOverlayX.value = newX;
      imageTranslateX.value -= 5;
      framePositionX.value = imageTranslateX.value / imageScale.value;
    } else {
      selectedOverlayX.value = newX;
    }
    console.log(`X (${newX}): ${selectedHardLeftBound} < ${selectedOverlayX.value} < ${selectedHardRightBound}`);
    console.log(`Y (${newY}): ${selectedHardTopBound} < ${selectedOverlayY.value} < ${selectedHardBottomBound}`);
  });


  const dragCanvas = Gesture.Pan().minPointers(2).onChange((event) => {
    console.log(event);
    imageTranslateX.value += event.changeX;
    imageTranslateY.value += event.changeY;
    framePositionX.value = imageTranslateX.value / imageScale.value;
    framePositionY.value = imageTranslateY.value / imageScale.value;
  });


  const zoom = Gesture.Pinch().onChange((event) => {
    const minFrameSize = 20;
    const maxFrameSize = image.width();
    const change = 0.025 * frameSize.value;
    const change2 = 0.0125 * frameSize.value;
    console.log(event);
    if (event.velocity >= 0) {
      if (minFrameSize <= frameSize.value) {
        frameSize.value -= change;
        framePositionX.value -= change2;
        framePositionY.value -= change2;
      }
    } else {
      if (frameSize.value < maxFrameSize) {
        frameSize.value += change;
        framePositionX.value += change2;
        framePositionY.value += change2;
      }
    }
    imageScale.value = (canvasRightBound - canvasLeftBound) / frameSize.value;
    imageTranslateX.value = imageScale.value * framePositionX.value;
    imageTranslateY.value = imageScale.value * framePositionY.value;
    console.log(imageScale.value);
  });


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
        <Canvas style={styles.canvas} onLayout={onLayoutHandler}>
          <Fill color="lightblue" />


          <Group transform={imageTransform}>
            <Image image={image} fit="none" x={0} y={0} width={image.width()} height={image.height()} />
            {data.spots.filter((_, index)=>{return index !== selectedOverlayId}).map((spot, index) => (
            <Circle key={index} cx={spot.area.x} cy={spot.area.y} r={radius} color="black" />
            ))}
          </Group>

          {selectedOverlayId !== undefined &&
          <Circle cx={selectedOverlayX} cy={selectedOverlayY} r={radius} color="blue" />
          }


        </Canvas>
        </GestureDetector>
        </GestureDetector>


        {selectedOverlayId !== undefined &&
        <GestureDetector gesture={drag}>
          <Animated.View style={style} />
        </GestureDetector>
        }

        {selectedOverlayId !== undefined &&
        <>
        <View style={{position:"absolute",top:0,left:0}}>
          <Button
            icon={faXmark}
            backgroundColor="red"
            margin={10}
            onPress={()=>delete_(selectedOverlayId)}
          />
        </View>
        <View style={{position:"absolute",top:0,right:0}}>
          <Button
            icon={faCheck}
            backgroundColor="green"
            margin={10}
            onPress={()=>save_(selectedOverlayId)}
          />
        </View>
        </>
        }
      </View>

      <View style={styles.actionbar}>
        <ScrollView style={styles.selectionbar} horizontal>
          {data.spots.map((_, index) => (
          <Button
            key={index}
            {...(index===selectedOverlayId&&{backgroundColor:"blue"})}
            margin={10}
            onPress={()=>select_(index)}
          />
          ))}
        </ScrollView>
        <Button
          icon={faWandMagicSparkles}
          margin={10}
          onPress={add_}
        />
      </View>

    </>
  );
}


const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    backgroundColor: "#c7c6c1",
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomColor: "black",
    borderBottomWidth: 3
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
  actionbar: {
    flexDirection: "row",
    backgroundColor: "#A9A9A9",
    borderTopColor: "black",
    borderTopWidth: 3
  },
  selectionbar: {
    backgroundColor: "#A9A9A9",
  }
});
