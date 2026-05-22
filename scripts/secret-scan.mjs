import { readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const files = execFileSync("git", ["ls-files"], {
  cwd: root,
  encoding: "utf8",
})
  .split("\n")
  .filter(Boolean)
  .filter((file) => !file.startsWith("reference/"));

const patterns = [
  /npg_[A-Za-z0-9]+/,
  /postgresql:\/\/neondb_owner:[^@\s]+@/i,
  /re_[A-Za-z0-9_]{16,}/,
  /PAYLOAD_SECRET=["']?(?!replace-with|local-development)[^"'\n]{24,}/,
];

const findings = [];

for (const file of files) {
  const content = readFileSync(join(root, file), "utf8");
  for (const pattern of patterns) {
    if (pattern.test(content)) findings.push(file);
  }
}

if (findings.length) {
  console.error(`Potential secrets found in:\n${[...new Set(findings)].join("\n")}`);
  process.exit(1);
}

console.log("No known secret patterns found.");
