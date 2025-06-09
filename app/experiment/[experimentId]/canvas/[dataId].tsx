import { Button } from "@/components/button";
import { faArrowLeft, faQuestion } from "@fortawesome/free-solid-svg-icons";
import { Canvas, Circle, Fill, Group, Rect } from '@shopify/react-native-skia';
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { LayoutChangeEvent, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue } from "react-native-reanimated";


const radius = 10;

type Overlay = {
  id: number,
  x: number,
  y: number
}

const fakeOverlays: Overlay[] = [
  {id: 1, x: 25, y: 25},
  {id: 2, x: 75, y: 75}
];


export default function CanvasScreen() {


  const router = useRouter();
  const {experimentId, dataId} = useLocalSearchParams<{experimentId:string, dataId:string}>();


  const [canvasTopBound, setCanvasTopBound] = useState(0);
  const [canvasLeftBound, setCanvasLeftBound] = useState(0);
  const [canvasRightBound, setCanvasRightBound] = useState(0);
  const [canvasBottomBound, setCanvasBottomBound] = useState(0);


  const [overlays, setOverlays] = useState<null|Overlay[]>(null);
  const [unselectedOverlays, setUnselectedOverlays] = useState<Overlay[]>([]);

  useEffect(() => {
    const overlays = fakeOverlays;
    setOverlays(overlays);
    setUnselectedOverlays(overlays);
  }, []);


  const [selectedOverlayId, setSelectedOverlayId] = useState<number>();
  const [selectedTopBound, setSelectedTopBound] = useState(0);
  const [selectedLeftBound, setSelectedLeftBound] = useState(0);
  const [selectedRightBound, setSelectedRightBound] = useState(0);
  const [selectedBottomBound, setSelectedBottomBound] = useState(0);


  const frameTranslateX = useSharedValue(0);
  const frameTranslateY = useSharedValue(0);
  const frameScale = useSharedValue(1.0);
  const frameTransform = useDerivedValue(() => {
    return [
      {translateX: frameTranslateX.value},
      {translateY: frameTranslateY.value},
      {scale: frameScale.value}
    ]
  });

  const selectedOverlayX = useSharedValue(0);
  const selectedOverlayY = useSharedValue(0);

  const style = useAnimatedStyle(() => {
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
    console.log(`Selected Overlay x Coordinate: ${selectedOverlayX.value}`);
    console.log(`Selected Overlay y Coordinate: ${selectedOverlayY.value}`);
  });


  if (!overlays) {
    return <View></View>
  }


  // useCallback()?
  const onLayoutHandler = (event: LayoutChangeEvent) => {
    const border = 40;
    const layout = event.nativeEvent.layout;
    const x = layout.x;
    const y = layout.y;
    const width = layout.width;
    const height = layout.height;
    setCanvasTopBound(y + border);
    setCanvasLeftBound(x + border);
    setCanvasRightBound(x + width - border);
    setCanvasBottomBound(y + height - border);
  };


  console.log(`Experiment ID: ${experimentId}`);
  console.log(`Data ID: ${dataId}`);


  console.log(`Canvas Top Bound: ${canvasTopBound}`);
  console.log(`Canvas Left Bound: ${canvasLeftBound}`);
  console.log(`Canvas Right Bound: ${canvasRightBound}`);
  console.log(`Canvas Bottom Bound: ${canvasBottomBound}`);


  console.log(`Selected Overlay ID: ${selectedOverlayId}`);
  console.log(`Selected Overlay Top Bound: ${selectedTopBound}`);
  console.log(`Selected Overlay Left Bound: ${selectedLeftBound}`);
  console.log(`Selected Overlay Right Bound: ${selectedRightBound}`);
  console.log(`Selected Overlay Bottom Bound: ${selectedBottomBound}`);


  const select = (overlayId: number) => {
    let newSelectedOverlay;
    const newUnselectedOverlays = [];
    for (const overlay of overlays) {
      if (overlay.id === overlayId) {
        newSelectedOverlay = overlay;
      } else {
        newUnselectedOverlays.push(overlay);
      }
    }
    if (newSelectedOverlay) {
      const radius = 10;
      setSelectedTopBound(canvasTopBound + radius);
      setSelectedLeftBound(canvasLeftBound + radius);
      setSelectedRightBound(canvasRightBound - radius);
      setSelectedBottomBound(canvasBottomBound - radius);
      selectedOverlayX.value = newSelectedOverlay.x;
      selectedOverlayY.value = newSelectedOverlay.y;
    }
    setSelectedOverlayId(newSelectedOverlay?.id);
    setUnselectedOverlays(newUnselectedOverlays);
  }


  const drag = Gesture.Pan().onChange((event) => {
    console.log(event);
    const newX = selectedOverlayX.value + event.changeX;
    const newY = selectedOverlayY.value + event.changeY;
    if (newY < selectedTopBound) {
      selectedOverlayY.value = selectedTopBound;
      frameTranslateY.value += 5;
    } else if (selectedBottomBound < newY) {
      selectedOverlayY.value = selectedBottomBound;
      frameTranslateY.value -= 5;
    } else {
      selectedOverlayY.value = newY;
    }
    if (newX < selectedLeftBound) {
      selectedOverlayX.value = selectedLeftBound;
      frameTranslateX.value += 5;
    } else if (selectedRightBound < newX) {
      selectedOverlayX.value = selectedRightBound;
      frameTranslateX.value -= 5;
    } else {
      selectedOverlayX.value = newX;
    }
    console.log(`X (${newX}): ${selectedLeftBound} < ${selectedOverlayX.value} < ${selectedRightBound}`);
    console.log(`Y (${newY}): ${selectedTopBound} < ${selectedOverlayY.value} < ${selectedBottomBound}`);
  });


  const zoom = Gesture.Pinch().onChange((event) => {
    console.log(event);
    if (event.velocity >= 0) {
      frameScale.value += 0.01;
    } else {
      frameScale.value -= 0.01;
    }
    console.log(frameScale.value);
  });


  return (
    <>
      <View style={styles.header}>
        <Button icon={faArrowLeft} margin={10} onPress={()=>router.back()} />
        <Text style={styles.title}>Canvas</Text>
        <Button icon={faQuestion} margin={10} />
      </View>

      <View style={styles.container}>

        <GestureDetector gesture={zoom}>
        <Canvas style={styles.canvas} onLayout={onLayoutHandler}>
          <Fill color="lightblue" />


          <Group transform={frameTransform}>
            <Rect x={0} y={0} width={1000} height={1000} color="tan" />
            <Circle cx={500} cy={250} r={50} color="green" />
            <Circle cx={250} cy={500} r={50} color="green" />
            <Circle cx={750} cy={500} r={50} color="green" />
            <Circle cx={500} cy={750} r={50} color="green" />
            {unselectedOverlays.map((overlay) => (
            <Circle key={overlay.id} cx={overlay.x} cy={overlay.y} r={radius} color="black" />
            ))}
          </Group>

          {selectedOverlayId &&
          <Circle cx={selectedOverlayX} cy={selectedOverlayY} r={radius} color="blue" />
          }


        </Canvas>
        </GestureDetector>


        {selectedOverlayId &&
        <GestureDetector gesture={drag}>
          <Animated.View style={style} />
        </GestureDetector>
        }
      </View>

      <View style={styles.actionbar}>
        <ScrollView style={styles.selectionbar} horizontal>
          {overlays.map((overlay) => (
          <Button key={overlay.id} margin={10} onPress={()=>select(overlay.id)} />
          ))}
        </ScrollView>
        <Button margin={10} />
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
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
  },
  container: {
    flex: 1
  },
  canvas: {
    flex: 1
  },
  actionbar: {
    flexDirection: "row",
  },
  selectionbar: {
    backgroundColor: "#c7c6c1",
  }
});
