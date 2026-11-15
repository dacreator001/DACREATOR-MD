import path from "node:path";
import { createJsonStateStore } from "../lib/state-store.js";

const store = createJsonStateStore({
  filePath: path.resolve(process.env.FEI_DATA_DIR || "./data", "personal-status.json"),
  defaults: { audience: [] }
});
function toJid(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!/^\d{8,15}$/.test(digits)) return "";
  return digits + "@s.whatsapp.net";
}
export default [
  {
    name: "statusaudience",
    category: "Status",
    description: "Owner-only personal-status audience: add/remove/list/clear.",
    run: async ctx => {
      if (!ctx.owner) return ctx.reply("⛔ Owner-only command.");
      const [action = "list", ...rest] = String(ctx.args || "").trim().split(/\s+/);
      const settings = await store.load();
      const audience = Array.isArray(settings.audience) ? settings.audience : [];
      if (action === "list") {
        return ctx.reply("👿 PERSONAL STATUS AUDIENCE\nContacts: " + audience.length +
          "\n" + (audience.length ? audience.map(jid => jid.split("@")[0]).join(", ") : "No recipients configured.") +
          "\n\n.statusaudience add 2348012345678\n.statusaudience remove 2348012345678\n.statusaudience clear");
      }
      if (action === "clear") {
        await store.set("audience", []);
        return ctx.reply("✅ Status audience cleared.");
      }
      if (!["add", "remove"].includes(action)) return ctx.reply("Usage: .statusaudience add|remove NUMBER");
      const jid = toJid(rest[0]);
      if (!jid) return ctx.reply("Use an international WhatsApp number, e.g. 2348012345678.");
      const next = action === "add"
        ? [...new Set([...audience, jid])].slice(0, 200)
        : audience.filter(item => item !== jid);
      await store.set("audience", next);
      return ctx.reply("✅ Status audience updated. Contacts: " + next.length);
    }
  },
  {
    name: "statuspost",
    category: "Status",
    description: "Owner-only: publish text to personal WhatsApp Status (Updates tab).",
    run: async ctx => {
      if (!ctx.owner) return ctx.reply("⛔ Owner-only command.");
      const text = String(ctx.args || "").trim();
      if (!text || text.length > 700) return ctx.reply("Usage: .statuspost Your status text (up to 700 characters)");
      const settings = await store.load();
      const audience = Array.isArray(settings.audience) ? settings.audience : [];
      if (!audience.length) return ctx.reply("⚠️ No personal-status audience configured. Use .statusaudience add NUMBER first.");
      if (typeof ctx.sock?.sendMessage !== "function") return ctx.reply("⚠️ WhatsApp connection cannot publish a status.");
      try {
        await ctx.sock.sendMessage("status@broadcast", { text }, { statusJidList: audience });
        await ctx.reply("✅ Personal status submitted to WhatsApp for your configured audience (" + audience.length + " contacts). Check the Updates tab to verify it appeared.");
      } catch (error) {
        await ctx.reply("⚠️ Personal status could not be published: " + String(error?.message || error).slice(0, 180));
      }
    }
  }
];
