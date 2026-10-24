import fs from 'fs';
import path from 'path';

interface PlaceholderMatch {
  file: string;
  line: number;
  snippet: string;
}

function scanDirectory(dir: string, matches: PlaceholderMatch[] = []): PlaceholderMatch[] {
  if (!fs.existsSync(dir)) return matches;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath, matches);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.json'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('PLACEHOLDER')) {
          matches.push({
            file: path.relative(process.cwd(), fullPath),
            line: index + 1,
            snippet: line.trim(),
          });
        }
      });
    }
  }

  return matches;
}

function run() {
  const contentDir = path.join(process.cwd(), 'src', 'content');
  console.log(`[CHECK:PLACEHOLDERS] Scanning for unsupplied client items in: ${contentDir}`);

  const matches = scanDirectory(contentDir);

  if (matches.length === 0) {
    console.log('[CHECK:PLACEHOLDERS] SUCCESS: 0 placeholders found. All client content is verified.');
    process.exit(0);
  }

  console.log(`\n========================================================================`);
  console.log(`[CHECK:PLACEHOLDERS] IDENTIFIED ${matches.length} PLACEHOLDER ITEMS IN CONTENT:`);
  console.log(`========================================================================`);
  matches.forEach((m) => {
    console.log(`  - ${m.file}:${m.line} -> ${m.snippet}`);
  });
  console.log(`========================================================================\n`);

  const allowPlaceholders = process.env.ALLOW_PLACEHOLDERS === 'true';

  if (allowPlaceholders) {
    console.log(`[CHECK:PLACEHOLDERS] ALLOW_PLACEHOLDERS=true is set. Permitting build for non-production / development.`);
    process.exit(0);
  } else {
    console.error(
      `[CHECK:PLACEHOLDERS] PRODUCTION BUILD FAILURE:\n` +
      `  Strict mode: Build cannot complete while ${matches.length} unsupplied client item(s) remain.\n` +
      `  To permit building during development or staging with placeholders, set ALLOW_PLACEHOLDERS=true.\n`
    );
    process.exit(1);
  }
}

run();
