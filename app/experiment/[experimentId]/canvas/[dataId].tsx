import { Button } from "@/components/button";
import { DataPoint, Spot, SpotType } from "@/types/data";
import { getDataPoint, saveDataPoint, serialize } from "@/utilities/storage";
import { calcConc } from "@/utilities/analysis";
import { faArrowLeft, faCheck, faQuestion, faWandMagicSparkles, faXmark } from "@fortawesome/free-solid-svg-icons";
import { Canvas, Circle, Fill, Group, Image, matchFont, Text as SkiaText, useImage, SkSurface, Skia} from '@shopify/react-native-skia';
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue } from "react-native-reanimated";


export default function CanvasScreen() {


  const router = useRouter();
  const {experimentId, dataId} = useLocalSearchParams<{experimentId:string, dataId:string}>();


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
  const [selectedOverlayType, setSelectedOverlayType] = useState<SpotType>("reference");

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
    //const radius = spotRadius.value;
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
  const font = matchFont({
    fontFamily,
    fontSize: 50,
    fontStyle: "normal",
    fontWeight: "bold"
  });


  // Ensures the data point and image are
  // acquired before the canvas is rendered.
  if (data === null
    || image === null) {
    return <View></View>
  }


  console.log(`Data: ${serialize(data)}`);
  console.log(`Selected Spot: ${selectedOverlayId}`);


  const help_ = () => { /* TODO */ };


  const add_ = () => {

    const newSpot: Spot = {
      type: "reference",
      area: {
        x: image.width()/2,
        y: image.height()/2,
        r: 100
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
      const scale = frameScale.value;
      selectedOverlayX.value = (newSelectedSpot.area.x + framePositionX.value) * scale;
      selectedOverlayY.value = (newSelectedSpot.area.y + framePositionY.value) * scale;
      spotRadius.value = newSelectedSpot.area.r;
      setSelectedOverlayType(newSelectedSpot.type);
      setSelectedOverlayId(spotId);
    }
  }

  const toggle_ = () => {
    setSelectedOverlayType(selectedOverlayType === "reference" ? "sample" : "reference");
  }


  const save_ = (spotId: number) => {

    const newData = {...data};
    //newData.spots[spotId].area.x = (selectedOverlayX.value - framePositionX.value) / frameScale.value;
    //newData.spots[spotId].area.y = (selectedOverlayY.value - framePositionY.value) / frameScale.value;
    const scale = frameScale.value;
    console.log(`Frame Position (X, Y): (${framePositionX.value}, ${framePositionY.value})`);
    console.log(`Frame Scale: ${scale}`);
    console.log(`Overlay Position (X, Y): (${selectedOverlayX.value}, ${selectedOverlayY.value})`);
    newData.spots[spotId].type = selectedOverlayType;
    newData.spots[spotId].area.x = selectedOverlayX.value / scale - framePositionX.value;
    newData.spots[spotId].area.y = selectedOverlayY.value / scale - framePositionY.value;
    newData.spots[spotId].area.r = spotRadius.value;
    console.log(`X => ${selectedOverlayX.value / scale - framePositionX.value}`);
    console.log(`Y => ${selectedOverlayY.value / scale - framePositionY.value}`);
    console.log(`R => ${spotRadius}`);

    // TODO:
    // Spot has been set to a new location
    // 1 Extract color of the spot

    // Needs logic to only run this for sample spot and not reference, also to select test type (igg/amonia)
    // It currently assumes all spots are sample and uses a hardcoded reference color
    // Also needs to be able to look up the color of the reference spots
    // currently it just takes color from a point, add averages later (image.readPixels() from skImage?)

    const surface = Skia.Surface.Make(image.width(), image.height());
    const canvas = surface.getCanvas();
    canvas.drawImage(image, 0, 0); // draw image to the canvas

    const snapshot = surface.makeImageSnapshot();
    const pixelData = snapshot.readPixels();
    console.log(`PIXELS: ${pixelData.length}`);

    console.log(`PIXEL TEST: ${pixelData[0]}`);
    console.log(`PIXEL TEST: ${pixelData[1]}`);
    console.log(`PIXEL TEST: ${pixelData[10]}`);
    console.log(`PIXEL TEST: ${pixelData[100]}`);
    console.log(`PIXEL TEST: ${pixelData[1000]}`);
    console.log(`PIXEL TEST: ${pixelData[10000]}`);

    // I think the indices are off, not sure if this formula is correct, need to do more research into how pixelData stores things
    const index = Math.round((newData.spots[spotId].area.y * image.width() + newData.spots[spotId].area.x) * 4);
    console.log(`INDEX: ${index}`);
    const r = pixelData[index];
    const g = pixelData[index + 1];
    const b = pixelData[index + 2];

    console.log(`Pixel: R=${r} G=${g} B=${b}`);

    const conc = calcConc([88,34,0], [r,g,b]);
    console.log(`CONCENTRATION: ${conc}`);
    newData.concentration = conc;


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
          <Fill color="lightblue" />


          <Group transform={imageTransform}>
            <Image image={image} fit="none" x={0} y={0} width={image.width()} height={image.height()} />
            {data.spots.filter((_, index)=>{return index !== selectedOverlayId}).map((spot, index) => (
            <Group key={index}>
            <Circle cx={spot.area.x} cy={spot.area.y} r={spot.area.r} color="white" opacity={0.5} />
            <Circle cx={spot.area.x} cy={spot.area.y} r={spot.area.r} style="stroke" color="black" />
            <SkiaText x={spot.area.x} y={spot.area.y} font={font} text={`${index}`} />
            </Group>
            ))}
          </Group>

          {selectedOverlayId !== undefined &&
          <Circle cx={selectedOverlayX} cy={selectedOverlayY} r={selectedOverlayR} style="stroke" color="black" />
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
    backgroundColor: "white",
    borderRadius: 15,
    borderWidth: 1,
    padding: 10
  },
  actionbar: {
    flexDirection: "row",
    backgroundColor: "#A9A9A9",
    borderTopColor: "black",
    borderTopWidth: 3
  },
  selectionbar: {
    backgroundColor: "#A9A9A9",
  },
  selectable: {
    alignItems: "center",
    backgroundColor: "white",
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
  }
});
