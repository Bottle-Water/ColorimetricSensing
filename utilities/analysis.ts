import { Calculation, RGBcolor } from "@/types/data";

function colorAnalysis(whiteColor: RGBcolor, blackColor: RGBcolor, baselineColor: RGBcolor, sampleColor: RGBcolor) {

    const reference = [baselineColor.red, baselineColor.green, baselineColor.blue];
    const sample = [sampleColor.red, sampleColor.green, sampleColor.blue];

    const result: Calculation = {
      distance: 0,
      concentration: {
        value: 0,
        units: "mg/mL"
      },
      confidence: 0
    }

    console.log(`START CALC`);

    // White balancing
    const sampleBalanced = whiteBalance(whiteColor, blackColor, sampleColor);
    const baselineBalanced = whiteBalance(whiteColor, blackColor, baselineColor);

    // CieLAB conversion
    const sampleLAB = RGBtoCIELAB(sampleBalanced);
    const baselineLAB = RGBtoCIELAB(baselineBalanced);

    //Euclidean distance calculation
    const distance = Math.sqrt(
        Math.pow(baselineLAB[0]-sampleLAB[0], 2) +
        Math.pow(baselineLAB[1]-sampleLAB[1], 2) +
        Math.pow(baselineLAB[2]-sampleLAB[2], 2)
        );

    //Snap to estimated concentration based on distance
    // Cutoffs determined by going halfway between values given by mahdi
    let concentration;
    let stddev;
    let refdist;
    if (distance < 2.36628){
        concentration = 0.001;
        stddev = 0.72167;
        refdist = 1.37813;
    }
    else if (distance < 4.56949){
        concentration = 0.010;
        stddev = 1.75260;
        refdist = 3.35442;
    }
    else if (distance < 9.01636){
        concentration = 0.050;
        stddev = 1.84516;
        refdist = 5.78455;
    }
    else if (distance < 12.870835){
        concentration = 0.1000;
        stddev = 1.62919;
        refdist = 12.24817;
    }
    else if (distance < 15.38965){
        concentration = 0.5000;
        stddev = 1.78440;
        refdist = 13.49350;
    }
    else if (distance < 18.7166){
        concentration = 1.0000;
        stddev = 1.74072;
        refdist = 17.28580;
    }
    else{
        concentration = 5.000;
        stddev = 1.14431;
        refdist = 20.14740;
    }

    const z = ((distance - refdist) / stddev);
    const confidence = Math.exp(-0.5 * z * z) * 100;
    console.log(confidence);

    console.log(`END CALC`);

    result.distance = distance;
    result.concentration.value = concentration;
    result.confidence = confidence;
    return result;
};

function whiteBalance(whiteColor: RGBcolor, blackColor: RGBcolor, toBalance: RGBcolor) {
    const r = 255 * ((toBalance.red - blackColor.red)/(whiteColor.red - blackColor.red + 0.00001));
    const g = 255 * ((toBalance.green - blackColor.green)/(whiteColor.green - blackColor.green + 0.00001));
    const b = 255 * ((toBalance.blue - blackColor.blue)/(whiteColor.blue - blackColor.blue + 0.00001));

    const balancedColor: RGBcolor = {
          red: r,
          green: g,
          blue: b
        };

    return balancedColor;
};

function RGBtoCIELAB(toConvert: RGBcolor) {

    const [r255, g255, b255] = [toConvert.red, toConvert.green, toConvert.blue];

    //Normalize between 0 and 1
    const [r, g, b] = [r255, g255, b255].map(v => v / 255);
    const compand = (v: number) =>
        v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92;
    const [rLin, gLin, bLin] = [r, g, b].map(compand);

    //Convert to XYZ colorspace
    const x = rLin * 0.4124 + gLin * 0.3576 + bLin * 0.1805;
    const y = rLin * 0.2126 + gLin * 0.7152 + bLin * 0.0722;
    const z = rLin * 0.0193 + gLin * 0.1192 + bLin * 0.9505;
    const [xn, yn, zn] = [0.95047, 1.00000, 1.08883];
    const [xr, yr, zr] = [x / xn, y / yn, z / zn];
    const f = (t: number) =>
      t > 0.008856 ? Math.cbrt(t) : (7.787 * t) + (16 / 116);
    const fx = f(xr);
    const fy = f(yr);
    const fz = f(zr);

    //Convert to LAB colorspace
    const L = 116 * fy - 16;
    const a = 500 * (fx - fy);
    const bl = 200 * (fy - fz);

    return [L,a,bl];
};


export { colorAnalysis, RGBtoCIELAB, whiteBalance };
