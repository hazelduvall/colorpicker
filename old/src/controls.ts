import { rgb as rgbhex } from "ciebase-ts";
import { State, IStateUpdater, ColorSpace } from "./types";
import { VIEWS } from "./display";

export class CieIntField implements IStateUpdater {
    private label: HTMLLabelElement;
    private input: HTMLInputElement;
    private index: number;

    constructor(labelId: string, inputId: string, index: number) {
        this.label = document.getElementById(labelId) as HTMLLabelElement;
        this.input = document.getElementById(inputId) as HTMLInputElement;
        this.index = index;
    }

    register(callback: (u: IStateUpdater) => void): void {
        this.input.addEventListener("change", () => callback(this));
    }
  
    sendUpdate(oldState: State): void {
        oldState.rep[this.index] = this.input.valueAsNumber;
    }

    getUpdate(newState: State): void {
        const view = VIEWS[newState.view];
        this.label.innerText = view.fieldNames[this.index];
        this.input.value = newState.rep[this.index].toFixed(2);
    }
}

export class RgbIntField implements IStateUpdater {
    private input: HTMLInputElement;
    private index: number;

    constructor(inputId: string, index: number) {
        this.input = document.getElementById(inputId) as HTMLInputElement;
        this.index = index;
    }
    
    register(callback: (u: IStateUpdater) => void): void {
        this.input.addEventListener("change", () => callback(this));
    }
    
    sendUpdate(oldState: State): void {
        let { val: rgb } = VIEWS[oldState.view].toSrgb(oldState.rep);
        rgb[this.index] = this.input.valueAsNumber / 255.0;
        const { val: rep } = VIEWS[oldState.view].fromSrgb(rgb);
        oldState.rep = rep;
    }

    getUpdate(newState: State): void {
        const { val: rgb } = VIEWS[newState.view].toSrgb(newState.rep);
        this.input.valueAsNumber = Math.round(rgb[this.index] * 255.0);
    }
}

export class Slider implements IStateUpdater {
    private slider: HTMLInputElement;

    constructor(sliderId: string) {
        this.slider = document.getElementById(sliderId) as HTMLInputElement;
    }
    
    register(callback: (u: IStateUpdater) => void): void {
        this.slider.addEventListener("change", () => callback(this));
    }
    
    sendUpdate(oldState: State): void {
        oldState.rep[0] = this.slider.valueAsNumber / parseInt(this.slider.max);
    }

    getUpdate(newState: State): void {
        this.slider.valueAsNumber = newState.rep[0] * parseInt(this.slider.max);
    }
}

export class Swatch implements IStateUpdater {
    private swatch: HTMLDivElement;

    constructor(swatchId: string) {
        this.swatch = document.getElementById(swatchId) as HTMLDivElement;
    }

    register(_callback: (_: IStateUpdater) => void): void {
        // nothing to update
    }

    sendUpdate(_oldState: State): void {
        // never called
    }

    getUpdate(newState: State): void {
        const { val: rgb } = VIEWS[newState.view].toSrgb(newState.rep);
        this.swatch.style.backgroundColor =
            `rgb(${rgb[0]*255.0}, ${rgb[1]*255.0}, ${rgb[2]*255.0})`;
    }
}

export class HexField implements IStateUpdater {
    private input: HTMLInputElement;

    constructor(inputId: string) {
        this.input = document.getElementById(inputId) as HTMLInputElement;
    }
    
    register(callback: (u: IStateUpdater) => void): void {
        this.input.addEventListener("change", () => callback(this));
    }
    
    sendUpdate(oldState: State): void {
        const rgb = rgbhex.fromHex(this.input.value);
        const { val: rep } = VIEWS[oldState.view].fromSrgb(rgb);
        oldState.rep = rep;
    }

    getUpdate(newState: State): void {
        const { val: rgb } = VIEWS[newState.view].toSrgb(newState.rep);
        this.input.value = rgbhex.toHex(rgb);
    }
}

export class StateManager {
    private inputs: IStateUpdater[];
    public callback: (u: IStateUpdater) => void;
    public state: State;

    constructor() {
        this.inputs = [];
        this.state = {
            view: ColorSpace.LAB,
            rep: [0.5, 0.0, 0.0],
            maxChroma: 1.0,
        };

        // Bind `this` to a function more tightly
        this.callback = ((s: StateManager) => {
            return (u: IStateUpdater) => {
                u.sendUpdate(s.state);
                for (const other of s.inputs) {
                    other.getUpdate(s.state);
                }
            };
        })(this);
    }

    public addInput(u: IStateUpdater) {
        u.register(this.callback);
        this.inputs.push(u);
    }
}
