const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

function formatMinutes (ms) {
  if (ms == null || ms === -1) return "-";

  const minutes = ms / 1000 / 60;
  return minutes.toFixed(2);
}

function formatMinutesHumane (ms) {
  if (ms == null || ms === -1) return "-";

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString(10).padStart(2, "0")}s`;
}

function timeBar(value, width, maxValue = 30 * 60 * 1000, threshold = 10 * 60 * 1000) {
  if (!value) return "";

  const thresholdIndex = Math.floor(width * threshold / maxValue);
  const barSize = Math.min(width * value / maxValue, width);
  let bar = "▒".repeat(Math.min(barSize, thresholdIndex));
  if (barSize > thresholdIndex) {
    bar += "▓".repeat(barSize - thresholdIndex);
  }
  return bar.padEnd(width);
}

function padAlign(text, size, alignment) {
  if (alignment === "right") {
    return text.padStart(size);
  } else {
    return text.padEnd(size);
  }
}

function formatTable(fields, rows) {
  const baseDefinition = { name: "", width: 10, align: "left" };
  const fieldDefinitions = fields.map((field, index) => {
    let definition;
    if (typeof field === "string") {
      definition = { ...baseDefinition, name: field };
    } else {
      definition = { ...baseDefinition, ...field };
    }
    if (!field.width && Array.isArray(rows)) {
      definition.width = Math.max(
        10,
        definition.name.length,
        ...rows.map(r => (r[index]?.toString() ?? "").length)
      );
    }
    return definition;
  });

  const formattedRows = [
    `| ${fieldDefinitions.map(f => padAlign(f.name, f.width, f.align)).join(" | ")} |`,
    `| ${fieldDefinitions.map(f => "-".repeat(f.width)).join(" | ")} |`,
  ];

  for (const row of rows) {
    const formatted = row.map((cell, index) => {
      const text = cell?.toString() ?? "";
      const field = fieldDefinitions[index];
      return padAlign(text, field.width, field.align);
    });
    formattedRows.push(`| ${formatted.join(" | ")} |`);
  }

  return formattedRows.join("\n");
}

module.exports = {
  MINUTE,
  DAY,
  formatTable,
  formatMinutes,
  formatMinutesHumane,
  padAlign,
  timeBar,
}
