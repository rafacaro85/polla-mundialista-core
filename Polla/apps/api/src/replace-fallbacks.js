const fs = require('fs');
const path = require('path');

const filesToProcess = [
  'apps/api/src/matches/matches.service.ts',
  'apps/api/src/matches/matches.controller.ts',
  'apps/api/src/leagues/leagues.service.ts',
  'apps/api/src/leagues/leagues.controller.ts',
  'apps/api/src/knockout-phases/knockout-phases.service.ts',
  'apps/api/src/knockout-phases/knockout-phases.controller.ts',
  'apps/api/src/knockout-phases/knockout-phases-init.service.ts',
  'apps/api/src/demo/demo.service.ts',
  'apps/api/src/notifications/listeners/phase-completed.listener.ts'
];

// Resolving absolute paths based on cwd (c:/AppWeb/Polla)
const processFile = (filePath) => {
  const absolutePath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absolutePath)) {
    console.log(`File not found: ${absolutePath}`);
    return;
  }

  let content = fs.readFileSync(absolutePath, 'utf8');
  let originalContent = content;

  // Reemplazar fallbacks directos
  content = content.replace(/\|\|\s*'WC2026'/g, '|| DEFAULT_TOURNAMENT_ID');
  content = content.replace(/=\s*'WC2026'/g, '= DEFAULT_TOURNAMENT_ID');
  content = content.replace(/===\s*'WC2026'/g, '=== DEFAULT_TOURNAMENT_ID');

  if (content !== originalContent) {
    console.log(`Changes detected in ${filePath}`);
    
    // Check if import already exists
    if (!content.includes('DEFAULT_TOURNAMENT_ID')) {
      // This shouldn't happen if we just replaced it, but just in case
    } else {
      if (!content.includes('import { DEFAULT_TOURNAMENT_ID }')) {
        // Calculate relative path to constants
        const constantsPath = 'apps/api/src/common/constants/tournament.constants';
        const fileDir = path.dirname(filePath);
        
        let relPath = path.relative(fileDir, constantsPath);
        if (!relPath.startsWith('.')) {
          relPath = './' + relPath;
        }
        // Normalize backslashes for imports
        relPath = relPath.replace(/\\/g, '/');
        
        const importStatement = `import { DEFAULT_TOURNAMENT_ID } from '${relPath}';\n`;
        
        // Find the first line after imports or just put it at top after last import
        const lines = content.split('\n');
        let lastImportIndex = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('import ')) {
            lastImportIndex = i;
          }
        }
        
        lines.splice(lastImportIndex + 1, 0, importStatement);
        content = lines.join('\n');
      }
    }
    
    fs.writeFileSync(absolutePath, content, 'utf8');
    
    // Contar reemplazos
    const occurrences = (originalContent.match(/'WC2026'/g) || []).length - (content.match(/'WC2026'/g) || []).length;
    console.log(`Replaced in ${filePath}: ${occurrences} occurrences`);
  } else {
    console.log(`No changes made to ${filePath} (likely 'WC2026' was not found or was in a non-target format)`);
  }
};

filesToProcess.forEach(processFile);
console.log('Script completed.');
