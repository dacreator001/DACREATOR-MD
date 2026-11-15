import "dotenv/config";
import path from "node:path";
import config from "./config/bot.config.js";
import theme from "./config/theme.config.js";
import { loadCommands } from "./handlers/command-loader.js";
import { createSessionManager } from "./lib/session-manager.js";

const numbers = [...new Set(String(process.env.PAIRING_NUMBERS || process.env.OWNER_NUMBERS || "")
  .split(",").map(value => value.replace(/\D/g, "")).filter(Boolean))];
if (!numbers.length || numbers.some(value => !/^\d{8,15}$/.test(value))) {
  throw new Error("Set PAIRING_NUMBERS to two valid international WhatsApp numbers separated by commas.");
}
if (numbers.length !== 2) throw new Error("Hosted dual-session mode requires exactly two PAIRING_NUMBERS.");
if (numbers.some(number => !config.ownerNumbers.includes(number))) {
  throw new Error("Every PAIRING_NUMBERS entry must also appear in OWNER_NUMBER or OWNER_NUMBERS.");
}

const { commands, lookup } = await loadCommands();
const root = path.resolve(process.env.FEI_DATA_DIR || "./data");
const manager = createSessionManager({ config, theme, commands, lookup, dataDirectory: root, maxSessions: 2 });
const sessions = [];

async function shutdown() {
  await manager.stop();
}
process.once("SIGINT", () => { void shutdown().finally(() => process.exit(0)); });
process.once("SIGTERM", () => { void shutdown().finally(() => process.exit(0)); });

console.log("DACREATOR-MD: starting two independent WhatsApp sessions; commands:", commands.length);
for (const [index, number] of numbers.entries()) {
  const id = "owner" + (index + 1);
  const sessionDirectory = path.join(root, "sessions", id, "auth_info_baileys");
  const runtime = await manager.createSession(id, { sessionDirectory });
  sessions.push(runtime);
  runtime.on("connected", () => console.log(id + ": WhatsApp connected"));
  runtime.on("loggedOut", () => console.error(id + ": logged out; re-pairing requires a fresh session"));
  runtime.on("runtimeError", error => console.error(id + ": " + (error?.message || error)));
  if (!runtime.getStatus().paired) {
    try {
      const pairing = await runtime.requestPairingCode(number);
      console.log("\n" + id + ": Pairing code for " + number + ": " + pairing.code);
      console.log("Enter this code in WhatsApp > Linked devices > Link a device > Link with phone number instead.");
      console.log("Treat console logs containing pairing codes as private.\n");
    } catch (error) {
      console.error(id + ": pairing failed: " + (error?.message || error));
      console.error("Fix connectivity/session state, then restart the deployment.");
    }
  } else {
    console.log(id + ": restoring saved WhatsApp session");
  }
}
console.log("Dual-session startup complete. Keep the service running and store FEI_DATA_DIR persistently.");
