
import { buildMenu } from "../lib/menu.js";

/* ═══════════════════════════════════════
   𓆩⛧𓆪 DACREATOR-MD — INFERNAL EDITION
   ♛ GENERAL COMMAND SYSTEM
   ═══════════════════════════════════════ */

const BRAND = "『⚡』𝗗𝗔𝗖𝗥𝗘𝗔𝗧𝗢𝗥-𝗠𝗗";
const FOOTER = "♛ 𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗗𝗔𝗖𝗥𝗘𝗔𝗧𝗢𝗥 ♛";
const GITHUB = "https://github.com/dacreator001/DACREATOR-MD";

const gothic = text => {
  const normal = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const styled = [..."𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭"];

  return String(text).replace(/[A-Z]/gi, char => {
    const index = normal.indexOf(char.toUpperCase());
    return index >= 0 ? styled[index] : char;
  });
};

function panel(title, rows = []) {
  return [
    "╔═══〔 ⛧ " + gothic(title) + " ⛧ 〕═══╗",
    ...rows.map(row => "║ ☠ " + row),
    "╚══════════════╝",
    "",
    FOOTER
  ].join("\n");
}

function formatDuration(seconds) {
  let remaining = Math.max(0, Math.floor(Number(seconds) || 0));

  const days = Math.floor(remaining / 86400);
  remaining %= 86400;

  const hours = Math.floor(remaining / 3600);
  remaining %= 3600;

  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;

  const parts = [];

  if (days) parts.push(days + "d");
  if (hours) parts.push(hours + "h");
  if (minutes) parts.push(minutes + "m");
  if (secs || !parts.length) parts.push(secs + "s");

  return parts.join(" ");
}

function messageTimestampMs(message) {
  const raw = message && message.messageTimestamp;

  const value =
    raw && typeof raw.toNumber === "function"
      ? raw.toNumber()
      : Number(raw);

  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return value > 1000000000000
    ? value
    : value * 1000;
}

function ownerNumber(config) {
  const owners = Array.isArray(config.ownerNumbers)
    ? config.ownerNumbers
    : [];

  return String(owners[0] || "").replace(/\D/g, "");
}

const commands = [

  /* ━━━━━━━━━ MENU ━━━━━━━━━ */

  {
    name: "menu",
    aliases: ["helpme"],
    category: "General",
    description: "Open the infernal DACREATOR-MD command menu.",

    run: async ctx => {
      const menu = buildMenu({
        commands: ctx.commands,
        config: ctx.config,
        theme: ctx.theme
      });

      if (ctx.config.imageUrl) {
        try {
          await ctx.send({
            image: { url: ctx.config.imageUrl },

            caption: [
              BRAND,
              "",
              "╔═══〔 ⛧ 𝗕𝗢𝗧 𝗦𝗬𝗦𝗧𝗘𝗠 ⛧ 〕═══╗",
              "║ ☠ 𝗦𝗧𝗔𝗧𝗨𝗦: " +
                (ctx.connectionOpen ? "ONLINE 🟢" : "CONNECTING 🟡"),
              "║ ⚡ 𝗣𝗥𝗘𝗙𝗜𝗫: " + (ctx.config.prefix || "."),
              "║ ♛ 𝗢𝗪𝗡𝗘𝗥: " + ctx.config.ownerName,
              "╚══════════════╝",
              "",
              "⛧ 𝗢𝗙𝗙𝗜𝗖𝗜𝗔𝗟 𝗣𝗢𝗥𝗧𝗔𝗟",
              ctx.config.botUrl || GITHUB,
              "",
              FOOTER
            ].join("\n")
          });

        } catch (error) {
          console.warn(
            "DACREATOR-MD artwork unavailable:",
            error?.message || error
          );
        }
      }

      await ctx.reply(menu);
    }
  },

  /* ━━━━━━━━━ HELP ━━━━━━━━━ */

  {
    name: "help",
    category: "General",
    description: "Display all registered bot commands.",

    run: async ctx => {
      const rows = (ctx.commands || [])
        .filter(command => !command.hidden)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(command =>
          (ctx.config.prefix || ".") +
          command.name +
          (command.description
            ? " ┊ " + command.description
            : "")
        );

      const header = [
        "╔═══〔 ⛧ 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗔𝗥𝗖𝗛𝗜𝗩𝗘 ⛧ 〕═══╗",
        "║ ☠ " + rows.length + " " + gothic("Registered Commands"),
        "╚══════════════╝",
        ""
      ].join("\n");

      const chunks = [];
      let current = header;

      for (const row of rows) {
        const formatted = "⛧│ " + row;

        if (current.length + formatted.length + 1 > 3300) {
          chunks.push(current.trimEnd());

          current =
            "𓆩⛧𓆪 " +
            gothic("Command Archive Continued") +
            "\n\n";
        }

        current += formatted + "\n";
      }

      if (current.trim()) {
        chunks.push(current.trimEnd());
      }

      for (const chunk of chunks) {
        await ctx.reply(chunk);
      }
    }
  },

  /* ━━━━━━━━━ PING ━━━━━━━━━ */

  {
    name: "ping",
    category: "General",
    description: "Check response speed and bot connectivity.",

    run: async ctx => {
      const timestamp = messageTimestampMs(ctx.msg);

      const responseMs =
        timestamp === null
          ? null
          : Math.max(0, Date.now() - timestamp);

      await ctx.reply(panel("PONG SYSTEM", [
        "⚡ " + gothic("Status") + ": " +
          (ctx.connectionOpen ? "ONLINE 🟢" : "CONNECTING 🟡"),

        "𖤐 " + gothic("Response") + ": " +
          (responseMs === null
            ? "Unavailable"
            : responseMs + " ms"),

        "⏱ " + gothic("Uptime") + ": " +
          formatDuration(process.uptime()),

        "♛ " + gothic("Version") + ": " +
          ctx.config.version
      ]));
    }
  },

  /* ━━━━━━━━━ ALIVE ━━━━━━━━━ */

  {
    name: "alive",
    aliases: ["uptime"],
    category: "General",
    description: "Show bot status, mode and uptime.",

    run: async ctx => {
      await ctx.reply(panel("SYSTEM ALIVE", [
        "𖤐 " + BRAND,

        "⚡ " + gothic("Status") + ": " +
          (ctx.connectionOpen ? "ONLINE 🟢" : "CONNECTING 🟡"),

        "☠ " + gothic("Mode") + ": " +
          gothic(ctx.mode || "public"),

        "⏱ " + gothic("Uptime") + ": " +
          formatDuration(process.uptime()),

        "♛ " + gothic("Owner") + ": " +
          ctx.config.ownerName
      ]));
    }
  },

  /* ━━━━━━━━━ OWNER ━━━━━━━━━ */

  {
    name: "owner",
    category: "General",
    description: "Display the DACREATOR-MD owner details.",

    run: async ctx => {
      const number = ownerNumber(ctx.config);

      const rows = [
        "♛ " + gothic("Owner") + ": " +
          ctx.config.ownerName,

        "𖤐 " + gothic("Bot") + ": " +
          ctx.config.name
      ];

      if (number) {
        rows.push(
          "📱 " + gothic("Contact") + ": +" + number
        );
      }

      await ctx.reply(panel("SUPREME OWNER", rows));
    }
  },

  /* ━━━━━━━━━ SUPPORT ━━━━━━━━━ */

  {
    name: "support",
    category: "General",
    description: "Get setup assistance and support information.",

    run: async ctx => {
      await ctx.reply(panel("SUPPORT CENTER", [
        "𖤐 " + gothic("Bot") + ": " +
          ctx.config.name,

        "♛ " + gothic("Developer") + ": " +
          ctx.config.ownerName,

        "⚡ " + gothic("Assistance") + ":",
        "Setup help and bug reports",

        "⛧ " + gothic("GitHub") + ":",
        GITHUB
      ]));
    }
  },

  /* ━━━━━━━━━ TIME ━━━━━━━━━ */

  {
    name: "time",
    category: "General",
    description: "Show the current time in Nigeria.",

    run: async ctx => {
      const value = new Intl.DateTimeFormat("en-NG", {
        timeZone: "Africa/Lagos",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      }).format(new Date());

      await ctx.reply(panel("NIGERIA TIME", [
        "🕒 " + gothic("Current Time"),
        "⚡ " + value,
        "𖤐 " + gothic("Timezone") + ": WAT"
      ]));
    }
  },

  /* ━━━━━━━━━ DATE ━━━━━━━━━ */

  {
    name: "date",
    category: "General",
    description: "Show the current date in Nigeria.",

    run: async ctx => {
      const value = new Intl.DateTimeFormat("en-NG", {
        timeZone: "Africa/Lagos",
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
      }).format(new Date());

      await ctx.reply(panel("NIGERIA DATE", [
        "📅 " + gothic("Current Date"),
        "⚡ " + value,
        "𖤐 " + gothic("Timezone") + ": WAT"
      ]));
    }
  },

  /* ━━━━━━━━━ VERSION ━━━━━━━━━ */

  {
    name: "version",
    category: "General",
    description: "Display bot version and connection details.",

    run: async ctx => {
      await ctx.reply(panel("SYSTEM VERSION", [
        "𖤐 " + BRAND,

        "⚡ " + gothic("Version") + ": " +
          ctx.config.version,

        "🟢 " + gothic("Status") + ": " +
          (ctx.connectionOpen ? "ONLINE" : "CONNECTING"),

        "☠ " + gothic("Mode") + ": " +
          gothic(ctx.mode || "public"),

        "📦 " + gothic("Engine") + ": Baileys",

        "♛ " + gothic("Developer") + ": DACREATOR"
      ]));
    }
  },

  /* ━━━━━━━━━ JID ━━━━━━━━━ */

  {
    name: "jid",
    aliases: ["id"],
    category: "General",
    description: "Display current chat and sender identifiers.",

    run: async ctx => {
      await ctx.reply(panel("IDENTITY SCANNER", [
        "💬 " + gothic("Chat ID") + ":",
        String(ctx.jid || "Unavailable"),

        "👤 " + gothic("Sender ID") + ":",
        String(ctx.senderJid || "Unavailable")
      ]));
    }
  },

  /* ━━━━━━━━━ WHOAMI ━━━━━━━━━ */

  {
    name: "whoami",
    category: "General",
    description: "Display your WhatsApp account information.",

    run: async ctx => {
      await ctx.reply(panel("USER IDENTITY", [
        "👤 " + gothic("Name") + ": " +
          (ctx.msg?.pushName || "Unknown"),

        "🆔 " + gothic("Your ID") + ": " +
          (ctx.senderJid || "Unavailable"),

        "♛ " + gothic("Owner") + ": " +
          (ctx.owner ? "YES 👑" : "NO")
      ]));
    }
  },

  // Additional safe dot-prefix utilities.
  {
    name: "quote",
    category: "Normal",
    description: "Display an original motivational quote.",
    run: async ctx => {
      const quotes = [
        "Progress is built one consistent step at a time.",
        "Curiosity turns questions into discoveries.",
        "Practice creates confidence."
      ];
      await ctx.reply("💬 " + quotes[Math.floor(Math.random() * quotes.length)]);
    }
  },
  {
    name: "fliptext",
    category: "Encoding / Crypto",
    description: "Reverse the order of characters in text.",
    run: async ctx => ctx.reply(ctx.args ? [...ctx.args].reverse().join("") : "Usage: .fliptext hello")
  },
  {
    name: "rot13",
    category: "Encoding / Crypto",
    description: "Apply ROT13 to letters.",
    run: async ctx => ctx.reply(ctx.args ? ctx.args.replace(/[a-z]/gi, c => String.fromCharCode(c.charCodeAt(0) + (c.toLowerCase() <= "m" ? 13 : -13))) : "Usage: .rot13 hello")
  },
  {
    name: "atbash",
    category: "Encoding / Crypto",
    description: "Apply the Atbash substitution cipher.",
    run: async ctx => ctx.reply(ctx.args ? ctx.args.replace(/[a-z]/gi, c => String.fromCharCode((c === c.toUpperCase() ? 65 : 97) + 25 - (c.toLowerCase().charCodeAt(0) - 97))) : "Usage: .atbash hello")
  },
  {
    name: "urlencode",
    category: "Encoding / Crypto",
    description: "URL-encode a string.",
    run: async ctx => ctx.reply(ctx.args ? encodeURIComponent(ctx.args) : "Usage: .urlencode hello world")
  },
  {
    name: "urldecode",
    category: "Encoding / Crypto",
    description: "Decode URL-encoded text.",
    run: async ctx => {
      if (!ctx.args) return ctx.reply("Usage: .urldecode hello%20world");
      try { await ctx.reply(decodeURIComponent(ctx.args)); }
      catch { await ctx.reply("Invalid URL-encoded text."); }
    }
  },

];

export default commands;
