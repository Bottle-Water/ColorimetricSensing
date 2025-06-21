import { AlphaType, ColorType, Skia, SkImage } from '@shopify/react-native-skia';
import { ColorConversionCodes, DataTypes, HoughModes, LineTypes, Mat, ObjectType, OpenCV } from 'react-native-fast-opencv';


function cvtSkImageToGrayMat(image: SkImage) {

  //console.log("SkImage:");
  //console.log(image.getImageInfo());
  //console.log(image.height(), image.width());

  const pixels = image.readPixels();

  if (!(pixels instanceof Uint8Array)) {
    return null;
  }

  // Assumes image is RGBA
  const mat = OpenCV.bufferToMat('uint8', image.height(), image.width(), 4, pixels);
  OpenCV.invoke("cvtColor", mat, mat, ColorConversionCodes.COLOR_RGBA2GRAY);

  return mat;
}


function cvtGrayMatToSkImage(mat: Mat) {

  const buffer = OpenCV.matToBuffer(mat, 'uint8');
  const data = Skia.Data.fromBytes(buffer.buffer);

  //console.log(data.__typename__)

  const image = Skia.Image.MakeImage(
    {
      width: buffer.cols,
      height: buffer.rows,
      alphaType: AlphaType.Opaque,
      colorType: ColorType.Gray_8,
    },
    data,
    buffer.cols
  );

  return image;
}


function detectCircles(image: SkImage) {

  const circles = [];

  const mat = cvtSkImageToGrayMat(image);
  if (mat != null) {

    const vecs = OpenCV.createObject(ObjectType.Mat, 0, 0, DataTypes.CV_32FC3);

    // Parameters don't work
    OpenCV.invoke("HoughCircles", mat, vecs, HoughModes.HOUGH_GRADIENT_ALT, 1.5, 200, 300, 0.5);

    const buffer = OpenCV.matToBuffer(vecs, 'float32');
    for (let i = 0; i < buffer.buffer.length; i+=3) {
      circles.push({
        x: Math.round(buffer.buffer[i]),
        y: Math.round(buffer.buffer[i+1]),
        r: Math.round(buffer.buffer[i+2])
      });
    }

  }

  OpenCV.clearBuffers();
  return circles;
}


function drawCircles(image: SkImage, circles: {x: number, y: number, r: number}[]) {

  let new_image: SkImage | null = null;

  const mat = cvtSkImageToGrayMat(image);
  if (mat != null) {

    const color = OpenCV.createObject(ObjectType.Scalar, 0, 0, 0);

    for (const circle of circles) {
      const point = OpenCV.createObject(ObjectType.Point, circle.x, circle.y);
      OpenCV.invoke("circle", mat, point, circle.r, color, 5, LineTypes.FILLED);
    }

    new_image = cvtGrayMatToSkImage(mat);

  }

  OpenCV.clearBuffers();
  return new_image;
}


function drawEdges(image: SkImage) {

  let new_image: SkImage | null = null;

  const mat = cvtSkImageToGrayMat(image);
  if (mat != null) {

    OpenCV.invoke("medianBlur", mat, mat, 5);
    OpenCV.invoke("Canny", mat, mat, 100, 200);

    new_image = cvtGrayMatToSkImage(mat);

  }

  OpenCV.clearBuffers();
  return new_image;
}


export { detectCircles, drawCircles, drawEdges };
