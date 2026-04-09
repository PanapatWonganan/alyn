#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to fix
const screenFiles = [
  'src/components/screens/HomeScreen.tsx',
  'src/components/screens/ExploreScreen.tsx',
  'src/components/screens/NovelDetailScreen.tsx',
  'src/components/screens/ReaderScreen.tsx',
  'src/components/screens/LibraryScreen.tsx',
  'src/components/screens/ProfileScreen.tsx',
  'src/components/screens/LoginScreen.tsx',
  'src/components/screens/RegisterScreen.tsx',
];

// Fix patterns - order matters!
const fixes = [
  // Theme color fixes
  { pattern: /colors\.semantic\.background/g, replacement: 'colors.background' },
  { pattern: /colors\.semantic\.text(?!Secondary|Muted)/g, replacement: 'colors.text.primary' },
  { pattern: /colors\.semantic\.textSecondary/g, replacement: 'colors.text.secondary' },
  { pattern: /colors\.semantic\.textMuted/g, replacement: 'colors.text.secondary' },
  { pattern: /colors\.semantic\.border/g, replacement: 'colors.border' },
  { pattern: /colors\.semantic\.error/g, replacement: 'colors.error.DEFAULT' },
  { pattern: /colors\.semantic\.surface/g, replacement: 'colors.card.background' },
  { pattern: /colors\.background\.cream/g, replacement: 'colors.brand.cream' },
  { pattern: /colors\.rosegold/g, replacement: 'colors.brand.rosegold' },
  { pattern: /colors\.brandBlack/g, replacement: 'colors.brand.black' },
  { pattern: /colors\.creamDark/g, replacement: 'colors.brand.creamDark' },
  { pattern: /colors\.cream/g, replacement: 'colors.brand.cream' },
  { pattern: /colors\.lightRosegold/g, replacement: 'colors.brand.rosegoldLight' },
  { pattern: /colors\.white(?![:\s]*\{)/g, replacement: 'colors.brand.white' },
  { pattern: /colors\.textSecondary/g, replacement: 'colors.text.secondary' },
  { pattern: /colors\.textMuted/g, replacement: 'colors.text.secondary' },
  { pattern: /colors\.text(?!\.)/g, replacement: 'colors.text.primary' },
  { pattern: /colors\.surface/g, replacement: 'colors.card.background' },
  { pattern: /colors\.primary(?!\.)/g, replacement: 'colors.primary.DEFAULT' },
  { pattern: /colors\.error(?!\.)/g, replacement: 'colors.error.DEFAULT' },
  { pattern: /colors\.success(?!\.)/g, replacement: 'colors.success.DEFAULT' },
  { pattern: /colors\.border/g, replacement: 'colors.border' },
  { pattern: /colors\.coin(?!\.)/g, replacement: 'colors.coin.primary' },
  { pattern: /colors\.accent\.coin/g, replacement: 'colors.coin.primary' },
  { pattern: /colors\.primary\.rosegold/g, replacement: 'colors.brand.rosegold' },

  // Typography fixes
  { pattern: /typography\.sizes\.(\w+)\.fontSize/g, replacement: 'typography.fontSize.$1.size' },
  { pattern: /typography\.sizes\.(\w+)\.lineHeight/g, replacement: 'typography.fontSize.$1.lineHeight' },
  { pattern: /typography\.sizes\.(\w+)/g, replacement: 'typography.fontSize.$1' },
  { pattern: /typography\.weights\.bold/g, replacement: 'typography.fontWeight.bold' },
  { pattern: /typography\.weights\.semibold/g, replacement: 'typography.fontWeight.semiBold' },
  { pattern: /typography\.weights\.medium/g, replacement: 'typography.fontWeight.medium' },
  { pattern: /typography\.families\.notoSansThai/g, replacement: 'typography.fontFamily.regular' },
  { pattern: /typography\.fontFamily\.primary/g, replacement: 'typography.fontFamily.regular' },
  { pattern: /typography\.fonts\.regular/g, replacement: 'typography.fontFamily.regular' },
  { pattern: /typography\.fonts\.medium/g, replacement: 'typography.fontFamily.medium' },
  { pattern: /typography\.fonts\.semibold/g, replacement: 'typography.fontFamily.semiBold' },
  { pattern: /typography\.fonts\.bold/g, replacement: 'typography.fontFamily.bold' },
  { pattern: /typography\.xl/g, replacement: 'typography.heading.h3' },
  { pattern: /typography\.base/g, replacement: 'typography.body.medium' },
  { pattern: /typography\.sm/g, replacement: 'typography.body.small' },
  { pattern: /typography\.xs/g, replacement: 'typography.caption' },

  // Spacing and borderRadius fixes
  { pattern: /spacing\.borderRadius\.(\w+)/g, replacement: 'borderRadius.$1' },
  { pattern: /theme\.spacing\.md/g, replacement: 'theme.borderRadius.md' },
  { pattern: /theme\.spacing\.sm/g, replacement: 'theme.borderRadius.sm' },
  { pattern: /theme\.spacing\.lg/g, replacement: 'theme.borderRadius.lg' },

  // Shadow fixes
  { pattern: /shadows\.medium/g, replacement: 'shadows.md' },
];

console.log('Fixing theme errors in screen files...\n');

screenFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  fixes.forEach(({ pattern, replacement }) => {
    content = content.replace(pattern, replacement);
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed: ${file}`);
  } else {
    console.log(`- No changes: ${file}`);
  }
});

console.log('\n✓ Theme error fixes complete!');
