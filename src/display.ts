import { srgbToCielab, cielabToSrgb } from "./cielab";
import { srgbToCiecam02, ciecam02ToSrgb, labToJch, jchToLab } from "./ciecam02";
import { Vector3D } from "ciebase-ts";
import { DisplayMap } from "./types";

function inpToLab(inp: Vector3D, maxChroma: number): Vector3D {
    return [
        inp[0],
        (2.0 * inp[1] - 1.0) * maxChroma,
        (2.0 * inp[2] - 1.0) * maxChroma,
    ];
}

function labToInp(lab: Vector3D, maxChroma: number): Vector3D {
    return [
        lab[0],
        (lab[1] / maxChroma + 1.0) / 2.0,
        (lab[2] / maxChroma + 1.0) / 2.0,
    ];
}

export const VIEWS: DisplayMap = {
    LAB: {
        transform: inpToLab,
        untransform: labToInp,
        toSrgb: cielabToSrgb,
        fromSrgb: srgbToCielab,

        fieldNames: ["L", "a", "b"],
    },
    CAM02: {
        transform: function(inp: Vector3D, maxChroma: number): Vector3D {
            const jch = labToJch(inpToLab(inp, maxChroma));
            return [jch.J, jch.C, jch.h];
        },
        untransform: function(jch: Vector3D, maxChroma: number): Vector3D {
            return labToInp(jchToLab({ J: jch[0], C: jch[1], h: jch[2] }), maxChroma);
        },
        toSrgb: ciecam02ToSrgb,
        fromSrgb: srgbToCiecam02,

        fieldNames: ["J", "C", "h"],
    },
};
