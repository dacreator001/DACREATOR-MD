const digits = value => String(value || "").replace(/\D/g, "");

const configuredOwnerNumber = digits(process.env.OWNER_NUMBER);
const ownerNumber = configuredOwnerNumber || "2348088662811";
const configuredPrefix = process.env.PREFIX;
const prefix = configuredPrefix === undefined || configuredPrefix === "" ? "." : String(configuredPrefix);

const channel = Object.freeze({
  name: "『⚡』𝘿𝘼𝘾𝙍𝙀𝘼𝙏𝙊𝙍-𝙈𝘿 〆",
  jid: "120207123456789@newsletter"
});

export default Object.freeze({
  name: String(process.env.BOT_NAME || "『⚡』𝘿𝘼𝘾𝙍𝙀𝘼𝙏𝙊𝙍-𝙈𝘿 〆").trim() || "『⚡』𝘿𝘼𝘾𝙍𝙀𝘼𝙏𝙊𝙍-𝙈𝘿 〆",
  version: String(process.env.BOT_VERSION || "1.0.0").trim() || "1.0.0",
  prefix,
  ownerName: String(process.env.OWNER_NAME || "『⚡』𝘿𝘼𝘾𝙍𝙀𝘼𝙏𝙊𝙍〆").trim() || "『⚡』𝘿𝘼𝘾𝙍𝙀𝘼𝙏𝙊𝙍〆",
  ownerNumber,
  ownerNumbers: Object.freeze([ownerNumber]),
  defaultMode: String(process.env.BOT_MODE || "public").toLowerCase() === "private" ? "private" : "public",
  sessionDirectory: String(process.env.FEI_SESSION_DIR || "./auth_info_baileys").trim() || "./auth_info_baileys",
  dataDirectory: String(process.env.FEI_DATA_DIR || "./data").trim() || "./data",
  logLevel: String(process.env.LOG_LEVEL || "info").trim().toLowerCase(),
  browser: "Chrome",
  channel,
  imageUrl: String(
    process.env.BOT_IMAGE_URL ||
    "https://res.cloudinary.com/dqqyvozdw/image/upload/v1794707287/qy9dhrv1k4wnndouh3fb.png"
  ).trim(),
  botUrl: String(process.env.BOT_URL || "https://fei-xmd.benfeilab.com").trim()
});
