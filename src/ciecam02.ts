import { cam, IRequiredJchProps } from "ciecam02-ts";
import { Vector3D } from "ciebase-ts";
import { clamp, srgb_to_xyz, srgb_from_xyz } from "./cielab";
import { ColorResult } from "./types";

// TODO: allow other viewing conditions besides the default
const Ciecam02Converter = cam();

export function labToJch(lab: Vector3D): IRequiredJchProps {
    var j = lab[0] * 100.0;
    var c = Math.sqrt(lab[1] * lab[1] + lab[2] * lab[2]) * 100.0;
    var h = Math.atan2(lab[2], lab[1]) * 180.0 / Math.PI;
    if (h < 0) {
        h += 360.0;
    }

    return {
        J: j,
        C: c,
        h: h,
    };
}

export function jchToLab(jch: IRequiredJchProps): Vector3D {
    var r = jch.C / 100.0;
    var t = jch.h * Math.PI / 180.0;
    return [
        jch.J / 100.0,
        r * Math.cos(t),
        r * Math.sin(t)
    ];
}

export function srgbToCiecam02(rgb: Vector3D): ColorResult<Vector3D> {
    const { inGamut: inGamut, val: xyz } = srgb_to_xyz(rgb);
    const jch = Ciecam02Converter.fromXyz(xyz);
    return { inGamut: inGamut, val: [jch.J, jch.C, jch.h] };
}

export function ciecam02ToSrgb(jch: Vector3D): ColorResult<Vector3D> {
    const xyz = Ciecam02Converter.toXyz({
        J: jch[0],
        C: jch[1],
        h: jch[2],
    });
    const { inGamut: g1, val: rgb } = srgb_from_xyz(xyz);
    const { inGamut: g2, val: rgb_clamped } = clamp(rgb);
    return { inGamut: g1 && g2, val: rgb_clamped };
}
