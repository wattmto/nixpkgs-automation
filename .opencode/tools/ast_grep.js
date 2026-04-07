import path from "node:path"

import { tool } from "@opencode-ai/plugin"

function indentBlock(text, spaces) {
  const prefix = " ".repeat(spaces)
  return text.split("\n").map((line) => `${prefix}${line}`).join("\n")
}

function buildInlineRule(language, pattern) {
  return [
    "id: ast-grep-inline-search",
    `language: ${language}`,
    "rule:",
    "  pattern: |",
    indentBlock(pattern, 4),
  ].join("\n")
}

function formatMatch(match) {
  return {
    file: match.file,
    line: (match.range?.start?.line ?? 0) + 1,
    column: (match.range?.start?.column ?? 0) + 1,
    language: match.language,
    text: match.text,
    lines: match.lines,
    metaVariables: match.metaVariables,
  }
}

export const search = tool({
  description: "Search code structurally with ast-grep patterns.",
  args: {
    pattern: tool.schema.string().describe("AST pattern to search for."),
    language: tool.schema.string().describe("ast-grep language name, for example yaml, javascript, or typescript."),
    paths: tool.schema.array(tool.schema.string()).optional().describe("Paths to search. Defaults to the whole repository."),
    globs: tool.schema.array(tool.schema.string()).optional().describe("Optional ast-grep globs to include or exclude paths."),
    context: tool.schema.number().int().min(0).max(10).optional().describe("Context lines to include around each match."),
    max_results: tool.schema.number().int().min(1).max(200).optional().describe("Maximum number of matches to return."),
    include_hidden: tool.schema.boolean().optional().describe("Include hidden files and directories."),
  },
  async execute(args, context) {
    const astGrepBinary = path.join(
      context.worktree,
      ".opencode",
      "node_modules",
      ".bin",
      process.platform === "win32" ? "ast-grep.cmd" : "ast-grep",
    )

    const command = [
      astGrepBinary,
      "scan",
      "--inline-rules",
      buildInlineRule(args.language, args.pattern),
      "--json=stream",
    ]

    if (typeof args.context === "number") {
      command.push("--context", String(args.context))
    }

    if (typeof args.max_results === "number") {
      command.push("--max-results", String(args.max_results))
    }

    if (args.include_hidden) {
      command.push("--no-ignore", "hidden")
    }

    for (const glob of args.globs ?? []) {
      command.push("--globs", glob)
    }

    command.push(...(args.paths?.length ? args.paths : [context.worktree]))

    const proc = Bun.spawn(command, {
      cwd: context.worktree,
      stdout: "pipe",
      stderr: "pipe",
    })

    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ])

    if (exitCode !== 0) {
      throw new Error(stderr.trim() || `ast-grep exited with status ${exitCode}`)
    }

    const matches = stdout
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line))
      .map(formatMatch)

    return JSON.stringify(
      {
        pattern: args.pattern,
        language: args.language,
        matchCount: matches.length,
        matches,
      },
      null,
      2,
    )
  },
})
