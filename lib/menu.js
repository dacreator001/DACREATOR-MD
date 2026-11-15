
const gothic = text => {
  const normal = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const styled = [..."𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭"];

  return String(text).replace(/[A-Z]/gi, char => {
    const index = normal.indexOf(char.toUpperCase());
    return index >= 0 ? styled[index] : char;
  });
};

export function getSectionCommands(section, commands = []) {
  const visible = commands.filter(command => !command.hidden);

  if (Array.isArray(section.commandNames)) {
    const selected = new Set(
      section.commandNames.map(value =>
        String(value).toLowerCase()
      )
    );

    return visible.filter(command =>
      selected.has(String(command.name).toLowerCase())
    );
  }

  const categories =
    Array.isArray(section.categories) && section.categories.length
      ? section.categories
      : [section.key];

  const excluded = new Set(section.excludeNames || []);

  return visible.filter(command =>
    categories.includes(command.category) &&
    !excluded.has(command.name)
  );
}

export function buildMenu({ commands = [], config = {}, theme = {} } = {}) {
  const sections = Array.isArray(theme.sections) ? theme.sections : [];
  const prefix = String(config.prefix || ".");
  const visible = commands.filter(command => !command.hidden);
  const title = "『👿』 DACREATOR DAEMON";
  const line = "━━━━━━━━━━━━━━━━━━━━";
  const lines = [
    "╭━━━〔 ⛧ DAEMON COMMAND CENTER ⛧ 〕━━━╮",
    "┃ " + title,
    "┃ ♛ Version: " + (config.version || "1.0.0"),
    "┃ ⚡ Prefix: " + prefix + "   •   ☠ Commands: " + visible.length,
    "┃ ◉ Mode: " + String(config.defaultMode || "public").toUpperCase(),
    "╰━━━━━━━━━━━━━━━━━━━━╯",
    "",
    "𖤐  Select a command below. Use " + prefix + "help for the full archive.",
    ""
  ];

  const assigned = new Set();
  for (const section of sections) {
    const members = getSectionCommands(section, visible)
      .filter(command => !assigned.has(command.name));
    if (!members.length) continue;
    for (const command of members) assigned.add(command.name);
    lines.push("┏━ " + section.title + " 〔" + members.length + "〕");
    for (const command of members) {
      const description = String(command.description || "")
        .replace(/\s+/g, " ").trim();
      // Keep the full command registry visible without WhatsApp wrapping every line.
      const short = description.length > 46
        ? description.slice(0, 43).trimEnd() + "…"
        : description;
      lines.push("┃ " + prefix + command.name + (short ? "  ·  " + short : ""));
    }
    lines.push("┗" + line, "");
  }

  const other = visible.filter(command => !assigned.has(command.name));
  if (other.length) {
    lines.push("┏━ ☠ " + gothic("Other Commands") + " 〔" + other.length + "〕");
    for (const command of other) {
      lines.push("┃ " + prefix + command.name);
    }
    lines.push("┗" + line, "");
  }

  lines.push(
    "𓆩⛧𓆪 " + gothic("Dacreator Empire"),
    "♛ " + gothic("The Dark System") + " ♛"
  );
  return lines.join("\n");
}
