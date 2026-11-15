import { getBotControls, setBotControl } from "../lib/bot-controls.js";

const ownerOnly = async (ctx, fn) => {
  if (!ctx.owner) return ctx.reply("⛔ Owner-only command.");
  return fn();
};
export default [
  {
    name: "private", aliases: ["self"], category: "Owner",
    description: "Allow only configured owners to use bot commands.",
    run: ctx => ownerOnly(ctx, async () => {
      await setBotControl("mode", "private");
      await ctx.reply("🔒 DACREATOR-MD is now PRIVATE. Only configured owners can run commands.");
    })
  },
  {
    name: "public", category: "Owner",
    description: "Allow everyone to use non-owner commands.",
    run: ctx => ownerOnly(ctx, async () => {
      await setBotControl("mode", "public");
      await ctx.reply("🌍 DACREATOR-MD is now PUBLIC. Owner-only controls remain restricted.");
    })
  },
  {
    name: "mode", category: "Owner",
    description: "Show the current bot access mode.",
    run: async ctx => {
      const settings = await getBotControls(ctx.config.defaultMode);
      await ctx.reply("⚡ Access mode: " + settings.mode.toUpperCase());
    }
  },
  {
    name: "demon", category: "Owner",
    description: "Toggle the bot's Demon Mode personality: .demon on/off.",
    run: ctx => ownerOnly(ctx, async () => {
      const arg = String(ctx.args || "").trim().toLowerCase();
      if (arg !== "on" && arg !== "off") return ctx.reply("Usage: .demon on | .demon off");
      await setBotControl("demon", arg === "on");
      await ctx.reply(arg === "on" ? "😈 DEMON MODE ACTIVATED. Infernal branding enabled." : "🛡️ Demon Mode disabled.");
    })
  },
  {
    name: "demonstatus", category: "Owner",
    description: "Show Demon Mode and access settings.",
    run: async ctx => {
      const settings = await getBotControls(ctx.config.defaultMode);
      await ctx.reply("𓆩⛧𓆪 DACREATOR-MD\nMode: " + settings.mode.toUpperCase() + "\nDemon: " + (settings.demon ? "ON 😈" : "OFF") + "\nSession: " + ctx.sessionId);
    }
  }
];