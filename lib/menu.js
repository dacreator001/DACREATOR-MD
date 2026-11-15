
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

export function buildMenu({
  commands = [],
  config = {},
  theme = {}
} = {}) {

  const menu = theme.menu || {};
  const sections = Array.isArray(theme.sections)
    ? theme.sections
    : [];

  const prefix = String(config.prefix || ".");

  const safeName = String(
    config.name || "『⚡』𝗗𝗔𝗖𝗥𝗘𝗔𝗧𝗢𝗥-𝗠𝗗"
  ).replace(/[\r\n]/g, " ").slice(0, 40);

  const top = String(menu.top || "━━━〔 ⚡ ");
  const titleEnd = String(menu.titleEnd || " 〕━━━");
  const infoLine = String(menu.infoLine || "◈ ");
  const itemLine = String(menu.itemLine || "◈ ");
  const blankLine = String(menu.blankLine || "");
  const bottom = String(menu.bottom || "━━━━━━━━━━━━━━━━");

  const visibleCommands = commands.filter(
    command => !command.hidden
  );

  const lines = [
    top + safeName + titleEnd,

    infoLine + "♛ " + gothic("Version") +
      " : " + String(config.version || "1.0.0"),

    infoLine + "⛧ " + gothic("Prefix") +
      " : " + prefix,

    infoLine + "☠ " + gothic("Commands Loaded") +
      " : " + visibleCommands.length,

    infoLine + "⚡ " + gothic("Mode") +
      " : " + gothic(config.defaultMode || "PUBLIC"),

    bottom,
    blankLine
  ];

  if (!commands.length) {

    lines.push(
      infoLine +
      gothic("Command modules are being prepared")
      + "..."
    );

  } else {

    const assigned = new Set();

    for (const section of sections) {

      const members = getSectionCommands(
        section,
        commands
      ).filter(command =>
        !assigned.has(command.name)
      );

      const sectionTitle = String(
        section.title || gothic(section.key)
      );

      lines.push(
        top + sectionTitle + titleEnd
      );

      if (!members.length) {

        lines.push(
          itemLine + "☠ " + gothic("No commands yet")
        );

      } else {

        for (const command of members) {

          assigned.add(command.name);

          const commandName =
            prefix + String(command.name);

          const description = command.description
            ? " ┊ " + String(command.description)
            : "";

          lines.push(
            itemLine +
            "𖤐 " +
            commandName +
            description
          );
        }
      }

      lines.push(bottom, "");
    }

    const ungrouped = commands.filter(
      command =>
        !command.hidden &&
        !assigned.has(command.name)
    );

    if (ungrouped.length) {

      lines.push(
        top + "☠ " + gothic("Other Commands") +
        titleEnd
      );

      for (const command of ungrouped) {

        lines.push(
          itemLine +
          "𖤐 " +
          prefix +
          command.name
        );
      }

      lines.push(bottom, "");
    }
  }

  lines.push(
    "━━━━━━━━━━━━━━━━━━━━",
    "𓆩⛧𓆪 " + gothic("Powered By"),
    "♛ " + gothic("Dacreator Empire") + " ♛",
    "☠ " + gothic("The Dark System") + " ☠",
    "━━━━━━━━━━━━━━━━━━━━"
  );

  return lines.join("\n");
}
