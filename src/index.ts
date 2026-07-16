import "./style.css";

import { Renderer } from "./renderer";
import { RCanvas } from "./resizeable";
import { CieIntField, RgbIntField, Slider, Swatch, HexField, StateManager } from "./controls";

const lab_field1 = new CieIntField("lab-field1-label", "lab-field1", 0);
const lab_field2 = new CieIntField("lab-field2-label", "lab-field2", 1);
const lab_field3 = new CieIntField("lab-field3-label", "lab-field3", 2);
const rgb_field1 = new RgbIntField("rgb-field1", 0);
const rgb_field2 = new RgbIntField("rgb-field2", 1);
const rgb_field3 = new RgbIntField("rgb-field3", 2);
const slider = new Slider("slider");
const swatch = new Swatch("swatch");
const hex = new HexField("rgbhex");

const stateManager = new StateManager();
stateManager.addInput(lab_field1);
stateManager.addInput(lab_field2);
stateManager.addInput(lab_field3);
stateManager.addInput(rgb_field1);
stateManager.addInput(rgb_field2);
stateManager.addInput(rgb_field3);
stateManager.addInput(slider);
stateManager.addInput(swatch);
stateManager.addInput(hex);

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const rcanvas = new RCanvas(canvas, 255, 255);
const renderer = new Renderer(
    canvas,
    navigator.hardwareConcurrency || 4,
    stateManager,
);
stateManager.addInput(renderer);
rcanvas.drawables.push(renderer); 
stateManager.callback(hex);
rcanvas.resize();

window.onresize = (_ev): any => {
    rcanvas.resize();
}
