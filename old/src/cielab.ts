/* Apache licensed by Rufflewind 2017, modified by Hazel Duvall 2021,
 * originally at https://github.com/Rufflewind/_urandom/blob/master/colorpicker/cielab.js */

import { matrix, Matrix3D, Vector3D } from "ciebase-ts";
import { ColorResult } from "./types";

const WHITE_XYZ: Vector3D = [0.950489, 1.0, 1.08884];
const CIELAB_D = 6.0 / 29.0;
const CIELAB_M = Math.pow(29.0 / 6.0, 2) / 3.0;
const CIELAB_C = 4.0 / 29.0;
const CIELAB_A = 3.0;
const CIELAB_RECIP_A = 1.0 / CIELAB_A;
const CIELAB_POW_D_A = Math.pow(CIELAB_D, CIELAB_A);
const CIELAB_MATRIX: Matrix3D = [
    [ 0.0 ,  1.16,  0.0 ],
    [ 5.0 , -5.0 ,  0.0 ],
    [ 0.0 ,  2.0 , -2.0 ],
];
const CIELAB_MATRIX_INV = matrix.inverse(CIELAB_MATRIX);
 /* [
  * [ 0.86206897,  0.2       ,  0.0       ],
  * [ 0.86206897,  0.0       ,  0.0       ],
  * [ 0.86206897,  0.0       , -0.5       ],
  * ];
  */
const CIELAB_OFFSET = -0.16;

function cielab_from_linear(x: number): number {
    return x <= CIELAB_POW_D_A ?
           CIELAB_M * x + CIELAB_C :
           Math.pow(x, CIELAB_RECIP_A);
}

function cielab_to_linear(y: number): number {
    return y <= CIELAB_D ?
           (y - CIELAB_C) / CIELAB_M :
           Math.pow(y, CIELAB_A);
}

function cielab_to_xyz(lab: Vector3D): Vector3D {
    lab[0] -= CIELAB_OFFSET;
    let xyz = matrix.multiply(CIELAB_MATRIX_INV, lab);
    lab[0] += CIELAB_OFFSET;
    xyz = [
        cielab_to_linear(xyz[0]), // * WHITE_XYZ[0],
        cielab_to_linear(xyz[1]), // * WHITE_XYZ[1],
        cielab_to_linear(xyz[2]), // * WHITE_XYZ[2],
    ];
    return xyz;
}

function cielab_from_xyz(xyz: Vector3D): Vector3D {
    const fxyz: Vector3D = [
        cielab_from_linear(xyz[0]), // / WHITE_XYZ[0]),
        cielab_from_linear(xyz[1]), // / WHITE_XYZ[1]),
        cielab_from_linear(xyz[2]), // / WHITE_XYZ[2])
    ];
    let lab = matrix.multiply(CIELAB_MATRIX, fxyz);
    lab[0] += CIELAB_OFFSET;
    return lab;
}

function clamp_number(x: number, low: number = 0.0, high: number = 1.0): ColorResult<number> {
    if (x < low) {
        return { inGamut: false, val: low };
    } else if (x > high) {
        return { inGamut: false, val: high };
    } else {
        return { inGamut: true, val: x };
    }
}

export function clamp(vec: Vector3D): ColorResult<Vector3D> {
    const res1 = clamp_number(vec[0]);
    const res2 = clamp_number(vec[1]);
    const res3 = clamp_number(vec[2]);
    return {
        inGamut: res1.inGamut && res2.inGamut && res3.inGamut,
        val: [res1.val, res2.val, res3.val],
    }; 
}

var SRGB_D = 0.04045;
var SRGB_M = 12.92;
var SRGB_A = 2.4;
var SRGB_K = 0.055;
var SRGB_MATRIX: Matrix3D = [[ 3.2406, -1.5372, -0.4986],
                   [-0.9689,  1.8758,  0.0415],
                   [ 0.0557, -0.204 ,  1.057 ]];
var SRGB_MATRIX_INV = matrix.inverse(SRGB_MATRIX);
/*
   [[ 0.41239559,  0.35758343,  0.18049265],
    [ 0.21258623,  0.7151703 ,  0.0722005 ],
    [ 0.01929722,  0.11918386,  0.95049713]];
*/

function srgb_from_linear(x: number): ColorResult<number> {
    const { inGamut: inGamut, val: v } = clamp_number(x);
    return {
        inGamut: inGamut,
        val: v <= SRGB_D / SRGB_M ?
               SRGB_M * v :
               (1 + SRGB_K) * Math.pow(v, 1 / SRGB_A) - SRGB_K,
    };
}

function srgb_to_linear(y: number): ColorResult<number> {
    const { inGamut: inGamut, val: v } = clamp_number(y);
    return {
        inGamut: inGamut,
        val: v <= SRGB_D ?
               v / SRGB_M :
               Math.pow((v + SRGB_K) / (1 + SRGB_K), SRGB_A),
    };
}

export function srgb_from_xyz(xyz: Vector3D): ColorResult<Vector3D> {
    let rgb = matrix.multiply(SRGB_MATRIX, xyz);
    const { inGamut: rg, val: r } = srgb_from_linear(rgb[0]);
    const { inGamut: gg, val: g } = srgb_from_linear(rgb[1]);
    const { inGamut: bg, val: b } = srgb_from_linear(rgb[2]);
    return { inGamut: rg && gg && bg, val: [r, g, b] };
}

export function srgb_to_xyz(rgb: Vector3D): ColorResult<Vector3D> {
    const { inGamut: rg, val: r } = srgb_to_linear(rgb[0]);
    const { inGamut: gg, val: g } = srgb_to_linear(rgb[1]);
    const { inGamut: bg, val: b } = srgb_to_linear(rgb[2]);
    return {
        inGamut: rg && gg && bg,
        val: matrix.multiply(SRGB_MATRIX_INV, [r, g, b]),
    };
}

export function srgbToCielab(rgb: Vector3D): ColorResult<Vector3D> {
    const { inGamut: inGamut, val: xyz } = srgb_to_xyz(rgb);
    const lab = cielab_from_xyz(xyz);
    return { inGamut: inGamut, val: lab };
};

export function cielabToSrgb(lab: Vector3D): ColorResult<Vector3D> {
    const xyz = cielab_to_xyz(lab);
    const { inGamut: g1, val: rgb } = srgb_from_xyz(xyz);
    const { inGamut: g2, val: rgb_clamped } = clamp(rgb);
    return { inGamut: g1 && g2, val: rgb_clamped };
};
