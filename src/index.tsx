import { hydrate, prerender as ssr } from "preact-iso";

import { BigCanvas } from "./components/BigCanvas";
import { Controls } from "./components/Controls";
import { ColorStateProvider } from "./hooks/useColorState";
import "./style.css";

export function App() {
  return (
    <ColorStateProvider>
      <BigCanvas />
      <Controls />
    </ColorStateProvider>
  );
}

if (typeof window !== "undefined") {
  hydrate(<App />, document.getElementById("app") || undefined);
}

export async function prerender() {
  return await ssr(<App />);
}
