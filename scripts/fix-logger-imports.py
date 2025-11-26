#!/usr/bin/env python3
"""
Fix logger imports that were incorrectly inserted in the middle of import type blocks
"""

import re
import glob
import os

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern: import type { \n import { logger }
    pattern = r'(import type \{)\s*\nimport \{ logger \} from [\'"]@/core/utils/logger[\'"];'

    if re.search(pattern, content):
        print(f"Fixing: {filepath}")

        # Remove the misplaced logger import
        content = re.sub(
            r'\nimport \{ logger \} from [\'"]@/core/utils/logger[\'"];(?=\s+\w)',
            '',
            content
        )

        # Add logger import before the import type block
        content = re.sub(
            r'(import .+ from .+;\n)(import type \{)',
            r'\1import { logger } from \'@/core/utils/logger\';\n\2',
            content
        )

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

        return True
    return False

# Find all TS/TSX files
files = glob.glob('src/**/*.ts', recursive=True) + glob.glob('src/**/*.tsx', recursive=True)

fixed_count = 0
for filepath in files:
    if fix_file(filepath):
        fixed_count += 1

print(f"\nFixed {fixed_count} files")
