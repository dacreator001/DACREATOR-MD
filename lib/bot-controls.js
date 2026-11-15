import path from "node:path";
import { createJsonStateStore } from "./state-store.js";

const store = createJsonStateStore({
  filePath: path.join(process.env.FEI_DATA_DIR || "./data", "bot-controls.json"),
  defaults: { mode: "public", demon: false }
});
export async function getBotControls(defaultMode = "public") {
  const data = await store.load();
  return {
    mode: data.mode === "private" ? "private" : data.mode === "public" ? "public" : defaultMode,
    demon: data.demon === true
  };
}
export async function setBotControl(key, value) {
  if (key !== "mode" && key !== "demon") throw new Error("Unknown control");
  return store.update(state => { state[key] = value; });
}
