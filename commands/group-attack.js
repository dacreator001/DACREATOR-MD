// commands/group-attack.js — group attack tools

function isOwner(ctx) {
  return Boolean(ctx.owner);
}

async function requireAdmin(ctx) {
  if (!String(ctx.jid || "").endsWith("@g.us")) {
    await ctx.reply("Group only.");
    return null;
  }
  try {
    return await ctx.sock.groupMetadata(ctx.jid);
  } catch {
    await ctx.reply("Could not load group metadata.");
    return null;
  }
}

// ── tagall ──────────────────────────────────────────────────────────────────
export const tagall = {
  name: "tagall",
  aliases: ["mentionall", "everyone"],
  category: "Attack",
  description: "Mention every member in the group.",
  run: async ctx => {
    const meta = await requireAdmin(ctx);
    if (!meta) return;
    const participants = meta.participants || [];
    const mentions = participants.map(p => p.id);
    const text = mentions.map(id => `@${id.split("@")[0]}`).join(" ");
    await ctx.sock.sendMessage(ctx.jid, { text, mentions });
  }
};

// ── massdm ───────────────────────────────────────────────────────────────────
export const massdm = {
  name: "massdm",
  aliases: ["dmall"],
  category: "Attack",
  description: "DM every group member. Owner only. Usage: .massdm <text>",
  run: async ctx => {
    if (!isOwner(ctx)) return ctx.reply("⛔ Owner only.");
    const meta = await requireAdmin(ctx);
    if (!meta) return;
    const text = String(ctx.args || "").trim();
    if (!text) return ctx.reply("Usage: .massdm <message>");
    const participants = (meta.participants || []).map(p => p.id);
    let sent = 0;
    for (const jid of participants) {
      try {
        await ctx.sock.sendMessage(jid, { text });
        sent++;
        await new Promise(r => setTimeout(r, 900));
      } catch {}
    }
    await ctx.reply(`📨 DM sent to ${sent}/${participants.length} members.`);
  }
};

// ── msgbomb ──────────────────────────────────────────────────────────────────
export const msgbomb = {
  name: "msgbomb",
  aliases: ["spam"],
  category: "Attack",
  description: "Send N rapid messages. Owner only. Usage: .msgbomb <count> <text>",
  run: async ctx => {
    if (!isOwner(ctx)) return ctx.reply("⛔ Owner only.");
    const args = String(ctx.args || "").trim().split(/\s+/);
    const n = Math.min(parseInt(args[0]) || 5, 50);
    const text = args.slice(1).join(" ") || "💀";
    for (let i = 0; i < n; i++) {
      await ctx.sock.sendMessage(ctx.jid, { text });
      await new Promise(r => setTimeout(r, 250));
    }
  }
};

// ── mentionbomb ──────────────────────────────────────────────────────────────
export const mentionbomb = {
  name: "mentionbomb",
  aliases: ["pingall"],
  category: "Attack",
  description: "Spam mention all members N times. Owner only. Usage: .mentionbomb <count>",
  run: async ctx => {
    if (!isOwner(ctx)) return ctx.reply("⛔ Owner only.");
    const meta = await requireAdmin(ctx);
    if (!meta) return;
    const n = Math.min(parseInt(ctx.args) || 3, 20);
    const mentions = (meta.participants || []).map(p => p.id);
    const text = mentions.map(id => `@${id.split("@")[0]}`).join(" ");
    for (let i = 0; i < n; i++) {
      await ctx.sock.sendMessage(ctx.jid, { text, mentions });
      await new Promise(r => setTimeout(r, 500));
    }
  }
};

// ── nuke ─────────────────────────────────────────────────────────────────────
export const nuke = {
  name: "nuke",
  aliases: ["destroy"],
  category: "Attack",
  description: "Kick all non-admins, wipe desc, rename group. Owner only.",
  run: async ctx => {
    if (!isOwner(ctx)) return ctx.reply("⛔ Owner only.");
    const meta = await requireAdmin(ctx);
    if (!meta) return;
    const nonAdmins = (meta.participants || [])
      .filter(p => !p.admin)
      .map(p => p.id);
    for (const id of nonAdmins) {
      try { await ctx.sock.groupParticipantsUpdate(ctx.jid, [id], "remove"); } catch {}
    }
    try { await ctx.sock.groupUpdateDescription(ctx.jid, "💀"); } catch {}
    try { await ctx.sock.groupUpdateSubject(ctx.jid, "NUKED 💀"); } catch {}
    await ctx.reply(`💀 Nuked — kicked ${nonAdmins.length} members.`);
  }
};

// ── freeze ───────────────────────────────────────────────────────────────────
export const freeze = {
  name: "freeze",
  aliases: ["lockdown"],
  category: "Attack",
  description: "Lock group so only admins can send. Usage: .freeze <minutes>",
  run: async ctx => {
    const meta = await requireAdmin(ctx);
    if (!meta) return;
    const mins = Math.min(parseInt(ctx.args) || 60, 1440);
    try {
      await ctx.sock.groupSettingUpdate(ctx.jid, "announcement");
      await ctx.reply(`🔒 Locked for ${mins} min — admins only.`);
      setTimeout(async () => {
        try {
          await ctx.sock.groupSettingUpdate(ctx.jid, "not_announcement");
        } catch {}
      }, mins * 60000);
    } catch (e) { await ctx.reply(`Failed: ${e.message}`); }
  }
};

// ── unfreeze ─────────────────────────────────────────────────────────────────
export const unfreeze = {
  name: "unfreeze",
  aliases: ["unlock"],
  category: "Attack",
  description: "Reopen group to all members.",
  run: async ctx => {
    const meta = await requireAdmin(ctx);
    if (!meta) return;
    try {
      await ctx.sock.groupSettingUpdate(ctx.jid, "not_announcement");
      await ctx.reply("🔓 Unlocked — all members can send.");
    } catch (e) { await ctx.reply(`Failed: ${e.message}`); }
  }
};

// ── kick ──────────────────────────────────────────────────────────────────────
export const kick = {
  name: "kick",
  aliases: ["remove"],
  category: "Attack",
  description: "Kick mentioned member(s). Usage: .kick @user",
  run: async ctx => {
    const meta = await requireAdmin(ctx);
    if (!meta) return;
    const mentioned = ctx.msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentioned.length) return ctx.reply("Mention someone to kick.");
    for (const jid of mentioned) {
      try { await ctx.sock.groupParticipantsUpdate(ctx.jid, [jid], "remove"); } catch {}
    }
    await ctx.reply(`👢 Kicked ${mentioned.length} member(s).`);
  }
};

// ── promote ──────────────────────────────────────────────────────────────────
export const promote = {
  name: "promote",
  aliases: ["makeadmin"],
  category: "Attack",
  description: "Promote mentioned member to admin.",
  run: async ctx => {
    const meta = await requireAdmin(ctx);
    if (!meta) return;
    const mentioned = ctx.msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentioned.length) return ctx.reply("Mention someone to promote.");
    await ctx.sock.groupParticipantsUpdate(ctx.jid, mentioned, "promote");
    await ctx.reply(`👑 Promoted ${mentioned.length} member(s).`);
  }
};

// ── demote ───────────────────────────────────────────────────────────────────
export const demote = {
  name: "demote",
  aliases: ["removeadmin"],
  category: "Attack",
  description: "Demote mentioned admin.",
  run: async ctx => {
    const meta = await requireAdmin(ctx);
    if (!meta) return;
    const mentioned = ctx.msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentioned.length) return ctx.reply("Mention someone to demote.");
    await ctx.sock.groupParticipantsUpdate(ctx.jid, mentioned, "demote");
    await ctx.reply(`⬇️ Demoted ${mentioned.length} member(s).`);
  }
};

export default { tagall, massdm, msgbomb, mentionbomb, nuke, freeze, unfreeze, kick, promote, demote };
