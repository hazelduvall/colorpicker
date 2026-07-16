import { hydrate, prerender as ssr } from "preact-iso";

import { BigCanvas } from "./components/BigCanvas";
import { Controls } from "./components/Controls";
import "./style.css";

export function App() {
  return (
    <>
      <BigCanvas />
      <Controls />
    </>
  );
}

if (typeof window !== "undefined") {
  hydrate(<App />, document.getElementById("app") || undefined);
}

export async function prerender() {
  return await ssr(<App />);
}
