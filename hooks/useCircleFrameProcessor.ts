import { Skia } from "@shopify/react-native-skia";
//import { ColorConversionCodes, DataTypes, HoughModes, ObjectType, OpenCV } from "react-native-fast-opencv";
import { useSkiaFrameProcessor } from "react-native-vision-camera";


const paint = Skia.Paint();
paint.setColor(Skia.Color('red'));


function useCircleFrameProcessor() {
  // Issue: The app is crashing after a couple seconds of only drawing the circle.
  return useSkiaFrameProcessor((frame) => {
    'worklet';

    console.log('Frame:');
    console.log(frame.height);
    console.log(frame.width);
    console.log(frame.pixelFormat);

    frame.render();
    frame.drawCircle(frame.width/2, frame.height/2, frame.width/8, paint);

    //const pixels = new Uint8Array(frame.toArrayBuffer());

    //const mat = OpenCV.bufferToMat('uint8', frame.height, frame.width, 4, pixels);
    //OpenCV.invoke("cvtColor", mat, mat, ColorConversionCodes.COLOR_RGBA2GRAY);

    //const vecs = OpenCV.createObject(ObjectType.Mat, 0, 0, DataTypes.CV_32FC3);
    //OpenCV.invoke("HoughCircles", mat, vecs, HoughModes.HOUGH_GRADIENT_ALT, 1.5, 200, 300, 0.5);

    //const buffer = OpenCV.matToBuffer(vecs, 'float32');
    //for (let i = 0; i < buffer.buffer.length; i+=3) {
    //  const x = Math.round(buffer.buffer[i]);
    //  const y = Math.round(buffer.buffer[i+1]);
    //  const r = Math.round(buffer.buffer[i+2]);
    //  frame.drawCircle(x, y, r, paint);
    //}

    //OpenCV.clearBuffers();
  }, []);
}


export { useCircleFrameProcessor };
