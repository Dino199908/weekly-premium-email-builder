#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const args = parseArgs(process.argv.slice(2));
const codexHome = args.codexHome || process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
const indexPath = path.join(codexHome, "session_index.jsonl");

main();

function main() {
  if (args.help || (!args.thread && !args.id && !args.list)) {
    printHelp();
    return;
  }

  const index = readJsonl(indexPath).filter((item) => item.id);

  if (args.list) {
    const rows = filterIndex(index, args.list === true ? "" : args.list);
    printThreadList(rows);
    return;
  }

  const threads = args.id
    ? index.filter((item) => item.id === args.id)
    : filterIndex(index, args.thread);

  if (!threads.length) {
    fail(`No Codex thread matched "${args.id || args.thread}".`);
  }

  threads
    .sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")))
    .slice(0, args.all ? threads.length : 1)
    .forEach((thread, indexNumber) => {
      if (indexNumber > 0) process.stdout.write("\n\n");
      printThread(thread);
    });
}

function printHelp() {
  process.stdout.write(`Read local Codex thread history.

Usage:
  npm run read-thread -- --list "Portal"
  npm run read-thread -- --thread "Portal Updates"
  npm run read-thread -- --thread "Portal Updates" --query "tier hours" --context 3
  npm run read-thread -- --id 019e4d8f-1a98-7242-a48e-e7f9743b5749 --include-tools

Options:
  --list [text]         List known threads, optionally filtered by title.
  --thread <title>      Read the newest thread whose title contains this text.
  --id <thread-id>      Read an exact thread id.
  --query <text>        Only show matching messages, plus optional context.
  --context <number>    Show this many nearby messages around each match. Default: 0.
  --limit <number>      Limit messages printed. Default: 80.
  --max-chars <number>  Truncate each message to this length. Default: 2200.
  --include-tools       Include command/tool calls and outputs.
  --all                 Read all matching threads instead of only the newest.
`);
}

function printThreadList(rows) {
  if (!rows.length) {
    process.stdout.write("No matching threads found.\n");
    return;
  }

  rows
    .sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")))
    .forEach((row) => {
      process.stdout.write(`${row.updated_at || "unknown"}  ${row.thread_name || "(untitled)"}  ${row.id}\n`);
    });
}

function printThread(thread) {
  const files = findThreadFiles(thread.id);
  process.stdout.write(`# ${thread.thread_name || "(untitled)"}\n`);
  process.stdout.write(`id: ${thread.id}\n`);
  process.stdout.write(`updated: ${thread.updated_at || "unknown"}\n`);

  if (!files.length) {
    process.stdout.write("No transcript JSONL file found for this thread.\n");
    return;
  }

  process.stdout.write(`file: ${files[0]}\n\n`);

  const messages = extractMessages(readJsonl(files[0]));
  const selected = selectMessages(messages);
  if (!selected.length) {
    process.stdout.write(args.query
      ? `No messages matched "${args.query}". Try --include-tools if the text may be inside command output.\n`
      : "No readable messages found.\n");
    return;
  }

  selected.slice(0, args.limit).forEach((message) => {
    const header = `[${message.timestamp || "no-time"}] ${message.role}`;
    process.stdout.write(`${header}\n${truncate(message.text, args.maxChars)}\n\n`);
  });

  if (selected.length > args.limit) {
    process.stdout.write(`... ${selected.length - args.limit} more message(s). Increase --limit to show more.\n`);
  }
}

function selectMessages(messages) {
  if (!args.query) return messages;

  const needle = args.query.toLowerCase();
  const matched = new Set();
  const context = Math.max(Number(args.context || 0), 0);

  messages.forEach((message, index) => {
    if (!message.text.toLowerCase().includes(needle)) return;
    for (let offset = -context; offset <= context; offset += 1) {
      const target = index + offset;
      if (target >= 0 && target < messages.length) matched.add(target);
    }
  });

  return [...matched].sort((a, b) => a - b).map((index) => messages[index]);
}

function extractMessages(items) {
  const messages = [];

  items.forEach((item) => {
    const payload = item.payload || {};

    if (item.type === "event_msg" && payload.type === "user_message") {
      pushMessage(messages, item.timestamp, "user", payload.message);
      return;
    }

    if (item.type === "event_msg" && payload.type === "agent_message") {
      pushMessage(messages, item.timestamp, payload.phase === "commentary" ? "assistant update" : "assistant", payload.message);
      return;
    }

    if (item.type === "response_item" && payload.type === "message") {
      pushMessage(messages, item.timestamp, payload.role || "message", contentText(payload.content));
      return;
    }

    if (!args.includeTools) return;

    if (item.type === "response_item" && payload.type === "function_call") {
      pushMessage(messages, item.timestamp, `tool call: ${payload.name || "unknown"}`, payload.arguments);
      return;
    }

    if (item.type === "response_item" && payload.type === "function_call_output") {
      pushMessage(messages, item.timestamp, "tool output", payload.output);
    }
  });

  return messages;
}

function pushMessage(messages, timestamp, role, text) {
  const clean = cleanText(text);
  if (!clean) return;
  messages.push({ timestamp, role, text: clean });
}

function contentText(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => part?.text || part?.input_text || part?.output_text || "")
    .filter(Boolean)
    .join("\n");
}

function cleanText(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function truncate(value, maxChars) {
  if (!maxChars || value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}\n[truncated ${value.length - maxChars} chars]`;
}

function filterIndex(index, query) {
  const needle = String(query || "").toLowerCase();
  return index.filter((item) => String(item.thread_name || "").toLowerCase().includes(needle));
}

function findThreadFiles(id) {
  const roots = [
    path.join(codexHome, "sessions"),
    path.join(codexHome, "archived_sessions")
  ];

  const files = [];
  roots.forEach((root) => walk(root, (file) => {
    if (file.endsWith(".jsonl") && path.basename(file).includes(id)) {
      files.push(file);
    }
  }));
  return files.sort((a, b) => a.length - b.length);
}

function walk(root, onFile) {
  if (!fs.existsSync(root)) return;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, onFile);
    } else {
      onFile(fullPath);
    }
  }
}

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function parseArgs(rawArgs) {
  const parsed = {
    context: 0,
    limit: 80,
    maxChars: 2200
  };

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else if (arg === "--list") {
      const next = rawArgs[index + 1];
      parsed.list = next && !next.startsWith("--") ? rawArgs[++index] : true;
    } else if (arg === "--thread") {
      parsed.thread = rawArgs[++index] || "";
    } else if (arg === "--id") {
      parsed.id = rawArgs[++index] || "";
    } else if (arg === "--query") {
      parsed.query = rawArgs[++index] || "";
    } else if (arg === "--context") {
      parsed.context = Number(rawArgs[++index] || 0);
    } else if (arg === "--limit") {
      parsed.limit = Number(rawArgs[++index] || 80);
    } else if (arg === "--max-chars") {
      parsed.maxChars = Number(rawArgs[++index] || 2200);
    } else if (arg === "--codex-home") {
      parsed.codexHome = rawArgs[++index] || "";
    } else if (arg === "--include-tools") {
      parsed.includeTools = true;
    } else if (arg === "--all") {
      parsed.all = true;
    } else if (!parsed.thread) {
      parsed.thread = arg;
    }
  }

  return parsed;
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
