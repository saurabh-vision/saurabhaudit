/**
 * Minimal YAML frontmatter parser and serializer for Node.js (zero dependencies).
 */

export function parseYamlLines(rawYaml) {
  const frontmatter = {};
  const lines = rawYaml.split(/\r?\n/);
  let currentKey = null;
  let inList = false;
  let inNestedObj = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // List item under an array key: "- item"
    const listMatch = line.match(/^\s*-\s+(.*)$/);
    if (listMatch && currentKey && inList) {
      let val = listMatch[1].trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      frontmatter[currentKey].push(val);
      continue;
    }

    // Nested key: value (e.g. under links:)
    const nestedMatch = line.match(/^\s{2,}([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (nestedMatch && currentKey && inNestedObj) {
      const nestedKey = nestedMatch[1];
      let val = nestedMatch[2].trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      } else if (val === "true") val = true;
      else if (val === "false") val = false;
      frontmatter[currentKey][nestedKey] = val;
      continue;
    }

    // Top-level key: value
    const keyValMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (keyValMatch) {
      currentKey = keyValMatch[1];
      let val = keyValMatch[2].trim();
      if (val === "" || val === "[]") {
        // Could be empty list or nested object header
        // We'll peek or initialize based on context; default to empty list or empty object
        // If next line is nested key, we can switch, or initialize
        if (currentKey === "links") {
          frontmatter[currentKey] = {};
          inNestedObj = true;
          inList = false;
        } else {
          frontmatter[currentKey] = [];
          inList = true;
          inNestedObj = false;
        }
      } else if (val.startsWith("[") && val.endsWith("]")) {
        frontmatter[currentKey] = val
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
        inList = false;
        inNestedObj = false;
      } else {
        inList = false;
        inNestedObj = false;
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        } else if (val === "true") {
          val = true;
        } else if (val === "false") {
          val = false;
        }
        frontmatter[currentKey] = val;
      }
    }
  }

  return frontmatter;
}

export function parseFrontmatter(fileContent) {
  if (!fileContent || typeof fileContent !== "string") {
    return { frontmatter: {}, body: "" };
  }

  // 1. Check for standard YAML block delimited by '---'
  const yamlMatch = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (yamlMatch) {
    const rawYaml = yamlMatch[1];
    const body = yamlMatch[2];
    const frontmatter = parseYamlLines(rawYaml);
    return { frontmatter, body };
  }

  // 2. Check for plain key: value lines or header block at the top of the file
  const lines = fileContent.split(/\r?\n/);
  const headerLines = [];
  const bodyLines = [];
  let inHeaderPreamble = true;
  let hasFoundHeaderKey = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!inHeaderPreamble) {
      bodyLines.push(line);
      continue;
    }

    // A blank line after we have already found header keys marks the end of preamble
    if (trimmed === "") {
      if (hasFoundHeaderKey) {
        inHeaderPreamble = false;
      } else {
        bodyLines.push(line);
      }
      continue;
    }

    // Markdown heading: e.g. # Title
    if (trimmed.startsWith("#")) {
      bodyLines.push(line);
      continue;
    }

    // HTML comment: e.g. <!-- ... -->
    if (trimmed.startsWith("<!--")) {
      bodyLines.push(line);
      continue;
    }

    // Top-level key: value (e.g. title: ..., github: ...)
    if (/^[a-zA-Z0-9_-]+:\s*.*$/.test(trimmed)) {
      headerLines.push(line);
      hasFoundHeaderKey = true;
      continue;
    }

    // Indented line or list item under a key (e.g. "  - tag", "  key: val")
    if (
      hasFoundHeaderKey &&
      (/^\s*-\s+.*$/.test(line) || /^\s{2,}[a-zA-Z0-9_-]+:\s*.*$/.test(line))
    ) {
      headerLines.push(line);
      continue;
    }

    // Any other line means we hit regular body text
    inHeaderPreamble = false;
    bodyLines.push(line);
  }

  if (hasFoundHeaderKey && headerLines.length > 0) {
    const frontmatter = parseYamlLines(headerLines.join("\n"));
    const body = bodyLines.join("\n");
    return { frontmatter, body };
  }

  // 3. No headers found
  return { frontmatter: {}, body: fileContent };
}

export function serializeFrontmatter(data, body = "") {
  const lines = ["---"];

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;

    if (value === null) {
      lines.push(`${key}: null`);
    } else if (typeof value === "boolean" || typeof value === "number") {
      lines.push(`${key}: ${value}`);
    } else if (typeof value === "string") {
      lines.push(`${key}: "${value.replace(/"/g, '\\"')}"`);
    } else if (value instanceof Date) {
      lines.push(`${key}: ${value.toISOString()}`);
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
      } else {
        lines.push(`${key}:`);
        for (const item of value) {
          lines.push(`  - "${String(item).replace(/"/g, '\\"')}"`);
        }
      }
    } else if (typeof value === "object") {
      const subEntries = Object.entries(value).filter(
        ([, v]) => v !== undefined && v !== null && v !== "",
      );
      if (subEntries.length === 0) {
        lines.push(`${key}: {}`);
      } else {
        lines.push(`${key}:`);
        for (const [subKey, subVal] of subEntries) {
          lines.push(`  ${subKey}: "${String(subVal).replace(/"/g, '\\"')}"`);
        }
      }
    }
  }

  lines.push("---");
  lines.push("");

  const cleanBody = body.trimStart();
  return lines.join("\n") + cleanBody;
}
