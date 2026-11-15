import { getAssistantSettings, setAssistantSettings } from "../lib/auto-assistant.js";

export default {
  name: "assistant",
  category: "Owner",
  description: "Configure private-chat auto-assistant: on/off/status/style/message/reset.",
  run: async ctx => {
    if (!ctx.owner) return ctx.reply("⛔ Owner-only command.");
    const input = String(ctx.args || "").trim();
    const [action, ...rest] = input.split(/\s+/);
    const choice = String(action || "status").toLowerCase();
    if (choice === "on" || choice === "off") {
      await setAssistantSettings({ enabled: choice === "on" });
      return ctx.reply("👿 Auto-assistant " + (choice === "on" ? "enabled" : "disabled") + ". Replies to incoming private chats at most once every 5 minutes per contact.");
    }
    if (choice === "style") {
      const style = String(rest[0] || "").toLowerCase();
      if (!["friendly", "casual", "professional"].includes(style)) {
        return ctx.reply("Usage: .assistant style friendly|casual|professional");
      }
      await setAssistantSettings({ style, message: "" });
      return ctx.reply("✅ Assistant style set to " + style + ".");
    }
    if (choice === "message") {
      const message = rest.join(" ").trim();
      if (!message || message.length > 400) return ctx.reply("Usage: .assistant message YOUR CUSTOM REPLY (max 400 characters)");
      await setAssistantSettings({ message });
      return ctx.reply("✅ Custom automatic reply saved. It will be marked as automated.");
    }
    if (choice === "reset") {
      await setAssistantSettings({ enabled: false, style: "friendly", message: "" });
      return ctx.reply("✅ Assistant reset and switched off.");
    }
    const settings = await getAssistantSettings();
    return ctx.reply([
      "👿 *DACREATOR DAEMON — AUTO ASSISTANT*",
      "Status: " + (settings.enabled ? "ON 🟢" : "OFF ⚫"),
      "Style: " + settings.style,
      "Custom reply: " + (settings.message ? "Configured" : "Default"),
      "Scope: Private incoming chats only",
      "Limit: One reply per contact every 5 minutes",
      "",
      ".assistant on | off",
      ".assistant style casual",
      ".assistant message I'll get back to you soon.",
      ".assistant reset",
      "",
      "Replies always identify themselves as automated."
    ].join("\n"));
  }
};
