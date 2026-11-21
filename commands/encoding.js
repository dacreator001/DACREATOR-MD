// commands/encoding.js — encoding, hashing, cipher tools (ESM)
import { createHash } from "crypto";

const MORSE_ENC = {
  a:".-",b:"-...",c:"-.-.",d:"-..",e:".",f:"..-.",g:"--.",h:"....",i:"..",j:".---",
  k:"-.-",l:".-..",m:"--",n:"-.",o:"---",p:".--.",q:"--.-",r:".-.",s:"...",t:"-",
  u:"..-",v:"...-",w:".--",x:"-..-",y:"-.--",z:"--..",
  "0":"-----","1":".----","2":"..---","3":"...--","4":"....-","5":".....",
  "6":"-....","7":"--...","8":"---..","9":"----."," ":"/"
};
const MORSE_DEC = Object.fromEntries(Object.entries(MORSE_ENC).map(([k,v])=>[v,k]));

// ── hash ──────────────────────────────────────────────────────────────────────
export const hash = {
  name: "hash",
  aliases: ["hashall"],
  category: "Encoding",
  description: "Hash text with MD5/SHA1/SHA256/SHA512. Usage: .hash <text>",
  run: async ctx => {
    const text = String(ctx.args || "").trim();
    if (!text) return ctx.reply("Usage: .hash <text>");
    await ctx.reply(
      `*Hashes: "${text.slice(0, 40)}"*\nMD5:    ${createHash("md5").update(text).digest("hex")}\nSHA1:   ${createHash("sha1").update(text).digest("hex")}\nSHA256: ${createHash("sha256").update(text).digest("hex")}\nSHA512: ${createHash("sha512").update(text).digest("hex")}`
    );
  }
};

// ── b64 ───────────────────────────────────────────────────────────────────────
export const b64encode = {
  name: "b64",
  aliases: ["base64", "b64encode"],
  category: "Encoding",
  description: "Base64 encode. Usage: .b64 <text>",
  run: async ctx => {
    const text = String(ctx.args || "").trim();
    if (!text) return ctx.reply("Usage: .b64 <text>");
    await ctx.reply(Buffer.from(text).toString("base64"));
  }
};

// ── b64decode ─────────────────────────────────────────────────────────────────
export const b64decode = {
  name: "b64decode",
  aliases: ["unbase64", "fromb64"],
  category: "Encoding",
  description: "Base64 decode. Usage: .b64decode <text>",
  run: async ctx => {
    const text = String(ctx.args || "").trim();
    if (!text) return ctx.reply("Usage: .b64decode <text>");
    try { await ctx.reply(Buffer.from(text, "base64").toString("utf8")); }
    catch (e) { await ctx.reply(`Error: ${e.message}`); }
  }
};

// ── hex ───────────────────────────────────────────────────────────────────────
export const hexencode = {
  name: "hex",
  aliases: ["tohex"],
  category: "Encoding",
  description: "Hex encode text. Usage: .hex <text>",
  run: async ctx => {
    const text = String(ctx.args || "").trim();
    if (!text) return ctx.reply("Usage: .hex <text>");
    await ctx.reply(Buffer.from(text).toString("hex"));
  }
};

// ── unhex ─────────────────────────────────────────────────────────────────────
export const hexdecode = {
  name: "unhex",
  aliases: ["fromhex", "hexdecode"],
  category: "Encoding",
  description: "Hex decode. Usage: .unhex <hexstring>",
  run: async ctx => {
    const text = String(ctx.args || "").trim().replace(/\s/g, "");
    if (!text) return ctx.reply("Usage: .unhex <hexstring>");
    try { await ctx.reply(Buffer.from(text, "hex").toString("utf8")); }
    catch (e) { await ctx.reply(`Error: ${e.message}`); }
  }
};

// ── urlencode ─────────────────────────────────────────────────────────────────
export const urlencode = {
  name: "urlencode",
  aliases: ["urlenc"],
  category: "Encoding",
  description: "URL encode. Usage: .urlencode <text>",
  run: async ctx => {
    const text = String(ctx.args || "").trim();
    if (!text) return ctx.reply("Usage: .urlencode <text>");
    await ctx.reply(encodeURIComponent(text));
  }
};

// ── urldecode ─────────────────────────────────────────────────────────────────
export const urldecode = {
  name: "urldecode",
  aliases: ["urldec"],
  category: "Encoding",
  description: "URL decode. Usage: .urldecode <text>",
  run: async ctx => {
    const text = String(ctx.args || "").trim();
    if (!text) return ctx.reply("Usage: .urldecode <text>");
    try { await ctx.reply(decodeURIComponent(text)); }
    catch (e) { await ctx.reply(`Error: ${e.message}`); }
  }
};

// ── binary ────────────────────────────────────────────────────────────────────
export const binary = {
  name: "binary",
  aliases: ["tobin", "texttobin"],
  category: "Encoding",
  description: "Text → binary. Usage: .binary <text>",
  run: async ctx => {
    const text = String(ctx.args || "").trim();
    if (!text) return ctx.reply("Usage: .binary <text>");
    await ctx.reply(text.split("").map(c => c.charCodeAt(0).toString(2).padStart(8, "0")).join(" "));
  }
};

// ── unbinary ──────────────────────────────────────────────────────────────────
export const unbinary = {
  name: "unbinary",
  aliases: ["frombin", "bintodec"],
  category: "Encoding",
  description: "Binary → text. Usage: .unbinary <bits>",
  run: async ctx => {
    const text = String(ctx.args || "").trim();
    if (!text) return ctx.reply("Usage: .unbinary <space-separated binary>");
    try {
      await ctx.reply(text.split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2))).join(""));
    } catch (e) { await ctx.reply(`Error: ${e.message}`); }
  }
};

// ── rot13 ─────────────────────────────────────────────────────────────────────
export const rot13 = {
  name: "rot13",
  aliases: ["rot"],
  category: "Encoding",
  description: "ROT13 cipher. Usage: .rot13 <text>",
  run: async ctx => {
    const text = String(ctx.args || "").trim();
    if (!text) return ctx.reply("Usage: .rot13 <text>");
    await ctx.reply(text.replace(/[a-zA-Z]/g, c => {
      const base = c <= "Z" ? 65 : 97;
      return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
    }));
  }
};

// ── caesar ────────────────────────────────────────────────────────────────────
export const caesar = {
  name: "caesar",
  aliases: ["shift"],
  category: "Encoding",
  description: "Caesar cipher. Usage: .caesar <shift> <text>",
  run: async ctx => {
    const parts = String(ctx.args || "").trim().split(/\s+/);
    const shift = parseInt(parts[0]);
    if (isNaN(shift) || parts.length < 2) return ctx.reply("Usage: .caesar <shift> <text>");
    const text = parts.slice(1).join(" ");
    await ctx.reply(text.replace(/[a-zA-Z]/g, c => {
      const base = c <= "Z" ? 65 : 97;
      return String.fromCharCode(((c.charCodeAt(0) - base + shift) % 26 + 26) % 26 + base);
    }));
  }
};

// ── morse ─────────────────────────────────────────────────────────────────────
export const morse = {
  name: "morse",
  aliases: ["tomorse"],
  category: "Encoding",
  description: "Text → Morse code. Usage: .morse <text>",
  run: async ctx => {
    const text = String(ctx.args || "").trim();
    if (!text) return ctx.reply("Usage: .morse <text>");
    await ctx.reply(text.toLowerCase().split("").map(c => MORSE_ENC[c] || "?").join(" "));
  }
};

// ── unmorse ───────────────────────────────────────────────────────────────────
export const unmorse = {
  name: "unmorse",
  aliases: ["frommorse", "decodemorse"],
  category: "Encoding",
  description: "Morse code → text. Usage: .unmorse <morse>",
  run: async ctx => {
    const text = String(ctx.args || "").trim();
    if (!text) return ctx.reply("Usage: .unmorse <morse>");
    await ctx.reply(text.split(" ").map(c => MORSE_DEC[c] || "?").join(""));
  }
};

// ── xor ───────────────────────────────────────────────────────────────────────
export const xor = {
  name: "xor",
  aliases: ["xorcipher"],
  category: "Encoding",
  description: "XOR key cipher. Usage: .xor <key> <text>",
  run: async ctx => {
    const parts = String(ctx.args || "").trim().split(/\s+/);
    if (parts.length < 2) return ctx.reply("Usage: .xor <key> <text>");
    const key = parts[0];
    const text = parts.slice(1).join(" ");
    const result = text.split("").map((c, i) =>
      String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))
    ).join("");
    await ctx.reply(`*XOR key="${key}"*\nHex: ${Buffer.from(result).toString("hex")}`);
  }
};

// ── atbash ────────────────────────────────────────────────────────────────────
export const atbash = {
  name: "atbash",
  category: "Encoding",
  description: "Atbash cipher (A↔Z). Usage: .atbash <text>",
  run: async ctx => {
    const text = String(ctx.args || "").trim();
    if (!text) return ctx.reply("Usage: .atbash <text>");
    await ctx.reply(text.replace(/[a-zA-Z]/g, c => {
      const base = c <= "Z" ? 65 : 97;
      return String.fromCharCode(base + 25 - (c.charCodeAt(0) - base));
    }));
  }
};

// ── md5 ───────────────────────────────────────────────────────────────────────
export const md5 = {
  name: "md5",
  category: "Encoding",
  description: "MD5 hash. Usage: .md5 <text>",
  run: async ctx => {
    const text = String(ctx.args || "").trim();
    if (!text) return ctx.reply("Usage: .md5 <text>");
    await ctx.reply(createHash("md5").update(text).digest("hex"));
  }
};

// ── sha256 ────────────────────────────────────────────────────────────────────
export const sha256 = {
  name: "sha256",
  category: "Encoding",
  description: "SHA256 hash. Usage: .sha256 <text>",
  run: async ctx => {
    const text = String(ctx.args || "").trim();
    if (!text) return ctx.reply("Usage: .sha256 <text>");
    await ctx.reply(createHash("sha256").update(text).digest("hex"));
  }
};

export default {
  hash, b64encode, b64decode, hexencode, hexdecode,
  urlencode, urldecode, binary, unbinary,
  rot13, caesar, morse, unmorse, xor, atbash, md5, sha256
};
