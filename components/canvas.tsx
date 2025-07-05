import { DataPoint, ReferenceSpot, RGBcolor, SampleSpot, Spot } from "@/types/data";
import { Canvas as SkiaCanvas, Circle, ColorType, Fill, FontStyle, Group, Image, Paragraph, RoundedRect, useImage, Skia, SkImage} from '@shopify/react-native-skia';
import { useEffect, useState } from "react";
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue } from "react-native-reanimated";
import { colorAnalysis } from "@/utilities/analysis";


const fontFamily = Platform.select({ ios: "Helvetica", default: "serif" });


export function setSpotColor(spot: Spot, image: SkImage) {

  // Extract and set the color of the spot.

  const imageInfo = image.getImageInfo();
  console.log("Image Info:");
  console.log(imageInfo);

  const pixelData = image.readPixels();
  if (pixelData !== null && imageInfo.colorType === ColorType.RGBA_8888) {
    // Only RGBA images are supported for now.

    const index = (spot.area.y * image.width() + spot.area.x) * 4;
    console.log(`INDEX: ${index}`);

    const red = pixelData[index];
    const green = pixelData[index + 1];
    const blue = pixelData[index + 2];
    const alpha = pixelData[index + 3];

    console.log(`Pixel: RED=${red} GREEN=${green} BLUE=${blue} ALPHA=${alpha}`);

    const color: RGBcolor = {
      red: red,
      green: green,
      blue: blue
    };

    spot.color = color;
  }
}


function getAverageColor(spots: Spot[]) {
  const color: RGBcolor = {
    red: 0,
    green: 0,
    blue: 0
  };
  let first = true;
  for (const spot of spots) {
    if (first) {
        color.red = spot.color.red;
        color.green = spot.color.green;
        color.blue = spot.color.blue;
        first = false;
    } else {
        color.red = (spot.color.red + color.red) / 2;
        color.green = (spot.color.green + color.green) / 2;
        color.blue = (spot.color.blue + color.blue) / 2;
    }
  }
  color.red = Math.round(color.red);
  color.green = Math.round(color.green);
  color.blue = Math.round(color.blue);
  return color;
}


export function splitSpots(spots: Spot[]) {
  const whiteSpots: ReferenceSpot[] = [];
  const blackSpots: ReferenceSpot[] = [];
  const baselineSpots: ReferenceSpot[] = [];
  const sampleSpots: SampleSpot[] = [];
  for (const spot of spots) {
    if (spot.type === "white") { whiteSpots.push(spot); }
    else if (spot.type === "black") { blackSpots.push(spot); }
    else if (spot.type === "baseline") { baselineSpots.push(spot); }
    else if (spot.type === "sample") { sampleSpots.push(spot); }
  }
  return {
    whiteSpots: whiteSpots,
    blackSpots: blackSpots,
    baselineSpots: baselineSpots,
    sampleSpots: sampleSpots
  };
}


export function checkReadiness(spots: Spot[]) {
  const {whiteSpots, blackSpots, baselineSpots, sampleSpots} = splitSpots(spots);
  const errors = [];
  if (whiteSpots.length === 0) { errors.push("Missing White Reference Spot"); }
  if (blackSpots.length === 0) { errors.push("Missing Black Reference Spot"); }
  if (baselineSpots.length === 0) { errors.push("Missing Baseline Reference Spot"); }
  if (sampleSpots.length === 0) { errors.push("Missing Sample Spot"); }
  return {
    errors: errors,
    whiteColor: getAverageColor(whiteSpots),
    blackColor: getAverageColor(blackSpots),
    baselineColor: getAverageColor(baselineSpots),
    sampleSpots: sampleSpots
  };
}


export function isComplete(spots: SampleSpot[]) {
  for (const spot of spots) {
    if (spot.calculation === undefined) {
      return false;
    }
  }
  return true;
}


export function performCalculations(whiteColor: RGBcolor, blackColor: RGBcolor, baselineColor: RGBcolor, spots: SampleSpot[]) {
  for (const spot of spots) {
    if (spot.calculation !== undefined) {
        continue;
    }
    const sampleColor = spot.color;
    spot.calculation = colorAnalysis(whiteColor, blackColor, baselineColor, sampleColor);
  }
}


// getCanvasImageBase64 -> string


function SpotLabel(spot: Spot, text: string) {

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
  .addText(text)
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


export function Canvas({data}: {data: DataPoint}) {

  const [containerWidth, setContainerWidth] = useState(0);

  const canvasDimension = useSharedValue({width: containerWidth, height: 0});
  const imageDimension = useSharedValue({width: 0, height: 0});
  const frameScale = useDerivedValue(() => {
    return canvasDimension.value.width / imageDimension.value.width;
  });
  const imageTransform = useDerivedValue(() => {
    return [
      {scale: frameScale.value},
      {translateX: 0},
      {translateY: 0}
    ]
  });


  const container = useAnimatedStyle(() => {
    console.log(`SCALE: ${frameScale.value}`)
    console.log(`IMAGE: ${imageDimension.value.height}`)
    console.log(`HEIGHT: ${frameScale.value * imageDimension.value.height}`)
    return {
      width: containerWidth,
      height: frameScale.value * imageDimension.value.height,
    }
  });


  const image = useImage(data.image);
  useEffect(() => {
    if (image) {
      console.log(`IMAGE WIDTH: ${image.width()}`);
      console.log(`IMAGE HEIGHT: ${image.height()}`);
      imageDimension.value = {width: image.width(), height: image.height()};
    }
  }, [image, imageDimension]);


  // Ensures the image is acquired
  // before the canvas is rendered.
  if (image === null) {
    return <View></View>
  }

  console.log("hello");

  const {whiteSpots, blackSpots, baselineSpots, sampleSpots} = splitSpots(data.spots);


  return (
    <View style={styles.canvas} onLayout={(event)=>{setContainerWidth(event.nativeEvent.layout.width)}}>
    <Animated.View style={container}>

      <SkiaCanvas style={styles.canvas} onSize={canvasDimension}>
        <Fill color="lightgrey" />


        <Group transform={imageTransform}>
          <Image image={image} fit="none" x={0} y={0} width={image.width()} height={image.height()} />

          {/*White Spots*/
          whiteSpots.map((spot, index) => (
          <Group key={`white-${index+1}`}>
          <Circle cx={spot.area.x} cy={spot.area.y} r={spot.area.r} color="white" opacity={0.25} />
          <Circle cx={spot.area.x} cy={spot.area.y} r={spot.area.r} style="stroke" color="black" />
          {SpotLabel(spot, "white")}
          </Group>
          ))}

          {/*Black Spots*/
          blackSpots.map((spot, index) => (
          <Group key={`black-${index+1}`}>
          <Circle cx={spot.area.x} cy={spot.area.y} r={spot.area.r} color="white" opacity={0.25} />
          <Circle cx={spot.area.x} cy={spot.area.y} r={spot.area.r} style="stroke" color="black" />
          {SpotLabel(spot, "black")}
          </Group>
          ))}

          {/*Baseline Spots*/
          baselineSpots.map((spot, index) => (
          <Group key={`baseline-${index+1}`}>
          <Circle cx={spot.area.x} cy={spot.area.y} r={spot.area.r} color="white" opacity={0.25} />
          <Circle cx={spot.area.x} cy={spot.area.y} r={spot.area.r} style="stroke" color="black" />
          {SpotLabel(spot, "baseline")}
          </Group>
          ))}

          {/*Sample Spots*/
          sampleSpots.map((spot, index) => (
          <Group key={`sample-${index+1}`}>
          <Circle cx={spot.area.x} cy={spot.area.y} r={spot.area.r} color="white" opacity={0.25} />
          <Circle cx={spot.area.x} cy={spot.area.y} r={spot.area.r} style="stroke" color="black" />
          {SpotLabel(spot, `sample ${index+1}`)}
          </Group>
          ))}
        </Group>


      </SkiaCanvas>

    </Animated.View>
    </View>
  );
}


const styles = StyleSheet.create({
  canvas: {
    flex: 1
  }
});
