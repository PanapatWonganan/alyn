#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const files = [
  'src/components/screens/HomeScreen.tsx',
  'src/components/screens/ExploreScreen.tsx',
  'src/components/screens/NovelDetailScreen.tsx',
  'src/components/screens/LibraryScreen.tsx',
  'src/components/screens/ProfileScreen.tsx',
  'src/components/screens/LoginScreen.tsx',
  'src/components/screens/RegisterScreen.tsx',
];

console.log('Fixing component prop errors...\n');

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // NovelCard fixes - coverUrl -> coverImage
  content = content.replace(/coverUrl=/g, 'coverImage=');

  // NovelCard fixes - views -> viewCount
  content = content.replace(/\bviews=/g, 'viewCount=');

  // NovelCard fixes - chapters -> chapterCount
  content = content.replace(/\bchapters=/g, 'chapterCount=');

  // NovelCard - remove width prop
  content = content.replace(/\s+width=\{\d+\}/g, '');

  // NovelCard - remove onPress prop (uses router.push internally)
  content = content.replace(/\s+onPress=\{[^}]+\}/g, '');

  // Badge fixes - variant="filled" -> variant="default"
  content = content.replace(/variant="filled"/g, 'variant="default"');

  // Badge fixes - variant="primary" is not valid, use "default"
  content = content.replace(/\bvariant="primary"/g, 'variant="default"');

  // Badge fixes - variant="success" is not valid for Badge, use status="success"
  content = content.replace(/<Badge ([^>]*)variant="success"/g, '<Badge $1variant="status" status="success"');

  // Badge fixes - text -> label
  content = content.replace(/<Badge\s+text=/g, '<Badge label=');

  // CoinBadge fixes - balance -> count
  content = content.replace(/<CoinBadge\s+balance=/g, '<CoinBadge count=');

  // CoinBadge fixes - amount -> count
  content = content.replace(/<CoinBadge\s+amount=/g, '<CoinBadge count=');

  // CoinBadge - remove onPress prop
  content = content.replace(/<CoinBadge([^>]*)\s+onPress=\{[^}]+\}/g, '<CoinBadge$1');

  // SectionHeader fixes - onSeeAll -> onSeeAllPress
  content = content.replace(/onSeeAll=/g, 'onSeeAllPress=');

  // SectionHeader - remove subtitle prop (doesn't exist)
  content = content.replace(/\s+subtitle=[^\s/>]+/g, '');

  // Button fixes - title prop -> children
  content = content.replace(/<Button([^>]*)\s+title="([^"]+)"([^>]*)>/g, '<Button$1$3>$2');
  content = content.replace(/<Button([^>]*)\s+title=\{`([^`]+)`\}([^>]*)>/g, '<Button$1$3>{`$2`}');
  content = content.replace(/<Button([^>]*)\s+title=\{([^}]+)\}([^>]*)>/g, '<Button$1$3>{$2}');

  // Fix fontSize references that should be .size
  content = content.replace(/fontSize:\s*typography\.fontSize\.(\w+)(?!\.size)/g, 'fontSize: typography.fontSize.$1.size');
  content = content.replace(/fontSize:\s*typography\.fontSize\.(['"]2xl['"])(?!\.size)/g, "fontSize: typography.fontSize['2xl'].size");
  content = content.replace(/fontSize:\s*typography\.fontSize\.(['"]3xl['"])(?!\.size)/g, "fontSize: typography.fontSize['3xl'].size");

  // Fix lineHeight references
  content = content.replace(/lineHeight:\s*typography\.fontSize\.(\w+)(?!\.lineHeight)/g, 'lineHeight: typography.fontSize.$1.lineHeight');
  content = content.replace(/lineHeight:\s*typography\.fontSize\.(['"]2xl['"])(?!\.lineHeight)/g, "lineHeight: typography.fontSize['2xl'].lineHeight");
  content = content.replace(/lineHeight:\s*typography\.fontSize\.(['"]3xl['"])(?!\.lineHeight)/g, "lineHeight: typography.fontSize['3xl'].lineHeight");

  // Fix colors.brand.coin -> colors.coin.primary
  content = content.replace(/colors\.brand\.coin(?!\.)/g, 'colors.coin.primary');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed: ${file}`);
  } else {
    console.log(`- No changes: ${file}`);
  }
});

console.log('\n✓ Component prop fixes complete!');
