/* Apache licensed by Rufflewind 2017, modified by Hazel Duvall 2026
 * originally at https://github.com/Rufflewind/_urandom/blob/master/colorpicker/cielab.js */

import { matrix, Matrix3D, Vector3D } from "ciebase-ts";
import { Color } from "./ColorState";

// const WHITE_XYZ: Vector3D = [0.950489, 1.0, 1.08884];
const CIELAB_D = 6.0 / 29.0;
const CIELAB_M = Math.pow(29.0 / 6.0, 2) / 3.0;
const CIELAB_C = 4.0 / 29.0;
const CIELAB_A = 3.0;
const CIELAB_RECIP_A = 1.0 / CIELAB_A;
const CIELAB_POW_D_A = Math.pow(CIELAB_D, CIELAB_A);
const CIELAB_MATRIX: Matrix3D = [
  [0.0, 1.16, 0.0],
  [5.0, -5.0, 0.0],
  [0.0, 2.0, -2.0],
];
const CIELAB_MATRIX_INV = matrix.inverse(CIELAB_MATRIX);
/* [
 * [ 0.86206897,  0.2       ,  0.0       ],
 * [ 0.86206897,  0.0       ,  0.0       ],
 * [ 0.86206897,  0.0       , -0.5       ],
 * ];
 */
const CIELAB_OFFSET = -0.16;

function cielabFromLinear(x: number): number {
  return x <= CIELAB_POW_D_A
    ? CIELAB_M * x + CIELAB_C
    : Math.pow(x, CIELAB_RECIP_A);
}

function cielabToLinear(y: number): number {
  return y <= CIELAB_D ? (y - CIELAB_C) / CIELAB_M : Math.pow(y, CIELAB_A);
}

function cielabToXyz(lab: Color<"lab">): Color<"xyz"> {
  lab.val[0] -= CIELAB_OFFSET;
  let xyz = matrix.multiply(CIELAB_MATRIX_INV, lab.val);
  lab.val[0] += CIELAB_OFFSET;
  xyz = [
    cielabToLinear(xyz[0]), // * WHITE_XYZ[0],
    cielabToLinear(xyz[1]), // * WHITE_XYZ[1],
    cielabToLinear(xyz[2]), // * WHITE_XYZ[2],
  ];
  return { space: "xyz", inGamut: lab.inGamut, val: xyz };
}

function cielabFromXyz(xyz: Color<"xyz">): Color<"lab"> {
  const fxyz: Vector3D = [
    cielabFromLinear(xyz.val[0]), // / WHITE_XYZ[0]),
    cielabFromLinear(xyz.val[1]), // / WHITE_XYZ[1]),
    cielabFromLinear(xyz.val[2]), // / WHITE_XYZ[2])
  ];
  const lab = matrix.multiply(CIELAB_MATRIX, fxyz);
  lab[0] += CIELAB_OFFSET;
  return { space: "lab", inGamut: xyz.inGamut, val: lab };
}

function clampNumber(
  x: number,
  low: number = 0.0,
  high: number = 1.0,
): [boolean, number] {
  if (x < low) {
    return [false, low];
  } else if (x > high) {
    return [false, high];
  } else {
    return [true, x];
  }
}

export function clamp<T>(color: Color<T>): Color<T> {
  const [in1, x] = clampNumber(color.val[0]);
  const [in2, y] = clampNumber(color.val[1]);
  const [in3, z] = clampNumber(color.val[2]);
  return {
    space: color.space,
    inGamut: color.inGamut && in1 && in2 && in3,
    val: [x, y, z],
  };
}

var SRGB_D = 0.04045;
var SRGB_M = 12.92;
var SRGB_A = 2.4;
var SRGB_K = 0.055;
var SRGB_MATRIX: Matrix3D = [
  [3.2406, -1.5372, -0.4986],
  [-0.9689, 1.8758, 0.0415],
  [0.0557, -0.204, 1.057],
];
var SRGB_MATRIX_INV = matrix.inverse(SRGB_MATRIX);
/*
   [[ 0.41239559,  0.35758343,  0.18049265],
    [ 0.21258623,  0.7151703 ,  0.0722005 ],
    [ 0.01929722,  0.11918386,  0.95049713]];
*/

function srgbFromLinear(x: number): [boolean, number] {
  const [inGamut, v] = clampNumber(x);
  return [
    inGamut,
    v <= SRGB_D / SRGB_M
      ? SRGB_M * v
      : (1 + SRGB_K) * Math.pow(v, 1 / SRGB_A) - SRGB_K,
  ];
}

function srgbToLinear(y: number): [boolean, number] {
  const [inGamut, v] = clampNumber(y);
  return [
    inGamut,
    v <= SRGB_D ? v / SRGB_M : Math.pow((v + SRGB_K) / (1 + SRGB_K), SRGB_A),
  ];
}

export function srgbFromXyz(xyz: Color<"xyz">): Color<"rgb"> {
  let rgb = matrix.multiply(SRGB_MATRIX, xyz.val);
  const [rg, r] = srgbFromLinear(rgb[0]);
  const [gg, g] = srgbFromLinear(rgb[1]);
  const [bg, b] = srgbFromLinear(rgb[2]);
  return { space: "rgb", inGamut: rg && gg && bg, val: [r, g, b] };
}

export function srgbToXyz(rgb: Color<"rgb">): Color<"xyz"> {
  const [rg, r] = srgbToLinear(rgb.val[0]);
  const [gg, g] = srgbToLinear(rgb.val[1]);
  const [bg, b] = srgbToLinear(rgb.val[2]);
  return {
    space: "xyz",
    inGamut: rg && gg && bg,
    val: matrix.multiply(SRGB_MATRIX_INV, [r, g, b]),
  };
}

export function srgbToCielab(rgb: Color<"rgb">): Color<"lab"> {
  const xyz = srgbToXyz(rgb);
  const lab = cielabFromXyz(xyz);
  return lab;
}

export function cielabToSrgb(lab: Color<"lab">): Color<"rgb"> {
  const xyz = cielabToXyz(lab);
  const rgbUnclamped = srgbFromXyz(xyz);
  // const rgb = clamp(rgbUnclamped);
  return rgbUnclamped; // clamp later so we can see which fields are out-of-range.
}
