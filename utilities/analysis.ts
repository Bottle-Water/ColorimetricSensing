import { Calculation, RGBcolor } from "@/types/data";

function colorAnalysis(whiteColor: RGBcolor, blackColor: RGBcolor, baselineColor: RGBcolor, sampleColor: RGBcolor) {

    const reference = [baselineColor.red, baselineColor.green, baselineColor.blue];
    const sample = [sampleColor.red, sampleColor.green, sampleColor.blue];

    const result: Calculation = {
      distance: 0,
      concentration: {
        value: 0,
        units: "mg/mL"
      }
    }

    console.log(`START CALC`);
    //todo
    //make it also take in a datapoint and update that

    //Simplified CieLAB conversion, needs white value to be truly accurate
    //make this its own function later
    const [r255, g255, b255] = sample;
    const [r, g, b] = [r255, g255, b255].map(v => v / 255);
    const compand = (v: number) =>
        v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92;
    const [rLin, gLin, bLin] = [r, g, b].map(compand);
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
    const L_sample = 116 * fy - 16;
    const a_sample = 500 * (fx - fy);
    const b_sample = 200 * (fy - fz);

    const [r255r, g255r, b255r] = reference;
    const[rr, gr, br] = [r255r, g255r, b255r].map(v => v / 255);
    const compandr = (v: number) =>
        v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92;
    const [rLinr, gLinr, bLinr] = [rr, gr, br].map(compandr);
    const xq = rLinr * 0.4124 + gLinr * 0.3576 + bLinr * 0.1805;
    const yq = rLinr * 0.2126 + gLinr * 0.7152 + bLinr * 0.0722;
    const zq = rLinr * 0.0193 + gLinr * 0.1192 + bLinr * 0.9505;
    const [xnr, ynr, znr] = [0.95047, 1.00000, 1.08883];
    const [xrr, yrr, zrr] = [xq / xnr, yq / ynr, zq / znr];
    const fq = (t: number) =>
      t > 0.008856 ? Math.cbrt(t) : (7.787 * t) + (16 / 116);
    const fxr = fq(xrr);
    const fyr = fq(yrr);
    const fzr = fq(zrr);
    const L_ref = 116 * fyr - 16;
    const a_ref = 500 * (fxr - fyr);
    const b_ref = 200 * (fyr - fzr);

    // for tuning it if we ever get labeled data
    const multiplier = 1;
    const offset = 0;

    //Euclidean distance calculation
    const distance = Math.sqrt(
        Math.pow(L_sample-L_ref, 2) +
        Math.pow(a_sample-a_ref, 2) +
        Math.pow(b_sample-b_ref, 2)
        );

    //It probably also needs to be regularized but again, labeled data
    const concentration = multiplier * distance + offset;

    console.log(`END CALC`);

    result.distance = distance;
    result.concentration.value = concentration;
    return result;
};


export { colorAnalysis };
