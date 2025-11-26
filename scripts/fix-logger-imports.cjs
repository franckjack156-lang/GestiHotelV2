#!/usr/bin/env node
/**
 * Fix logger imports that were incorrectly inserted in the middle of import type blocks
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

async function fixFile(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');

  // Check if file has the problem
  if (content.includes('import type {') && content.match(/import type \{\s*\nimport \{ logger \}/)) {
    console.log(`Fixing: ${filepath}`);

    // Fix: Move logger import before import type
    let fixed = content;

    // Remove misplaced logger import from within import type block
    fixed = fixed.replace(/import type \{\s*\nimport \{ logger \} from ['"]@\/core\/utils\/logger['"];/g, 'import type {');

    // Find the last regular import before import type
    const lines = fixed.split('\n');
    let lastImportIndex = -1;
    let importTypeIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('import ') && !line.startsWith('import type')) {
        lastImportIndex = i;
      }
      if (line.startsWith('import type {')) {
        importTypeIndex = i;
        break;
      }
    }

    // Insert logger import before import type
    if (importTypeIndex > -1 && !fixed.includes("import { logger } from '@/core/utils/logger'")) {
      lines.splice(importTypeIndex, 0, "import { logger } from '@/core/utils/logger';");
      fixed = lines.join('\n');
    }

    fs.writeFileSync(filepath, fixed, 'utf8');
    return true;
  }

  return false;
}

async function main() {
  // Find all TS/TSX files
  const files = await glob('src/**/*.{ts,tsx}', { ignore: 'node_modules/**' });

  let fixedCount = 0;
  for (const file of files) {
    try {
      if (await fixFile(file)) {
        fixedCount++;
      }
    } catch (err) {
      console.error(`Error fixing ${file}:`, err.message);
    }
  }

  console.log(`\n✓ Fixed ${fixedCount} files`);
}

main().catch(console.error);
