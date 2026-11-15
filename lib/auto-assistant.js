import path from "node:path";
import { createJsonStateStore } from "./state-store.js";

const store = createJsonStateStore({
  filePath: path.resolve(process.env.FEI_DATA_DIR || "./data", "auto-assistant.json"),
  defaults: { enabled: false, style: "friendly", message: "" }
});
const lastReply = new Map();
const COOLDOWN_MS = 30 * 60 * 1000;

export async function getAssistantSettings() {
  return { enabled: false, style: "friendly", message: "", ...(await store.load()) };
}
export async function setAssistantSettings(changes) {
  return store.update(state => Object.assign(state, changes));
}
export async function maybeAutoReply({ sock, msg, text, prefix = "." }) {
  const jid = String(msg?.key?.remoteJid || "");
  if (!jid.endsWith("@s.whatsapp.net") || msg?.key?.fromMe) return false;
  if (!text || text.startsWith(prefix) || text.length > 2000) return false;
  const settings = await getAssistantSettings();
  if (!settings.enabled) return false;
  const now = Date.now();
  if (now - (lastReply.get(jid) || 0) < COOLDOWN_MS) return false;
  const templates = {
    friendly: "Hey! Thanks for messaging. I'm DACREATOR's automated assistant. He's away right now, but your message has been received and he'll reply when available.",
    casual: "Yo! 👿 DACREATOR is away right now. I'm his auto-assistant, not him. Your message is here and he'll get back to you.",
    professional: "Hello. This is DACREATOR's automated assistant. Your message has been received. DACREATOR will respond when available."
  };
  const reply = settings.message
    ? "🤖 Automated assistant: " + settings.message
    : templates[settings.style] || templates.friendly;
  lastReply.set(jid, now);
  try {
    await sock.sendMessage(jid, { text: reply });
    return true;
  } catch (error) {
    lastReply.delete(jid);
    throw error;
  }
}
