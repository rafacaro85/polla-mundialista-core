const fs = require('fs');

const files = [
  'apps/api/src/brackets/brackets.service.ts',
  'apps/api/src/predictions/predictions.service.ts'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Insert Logger into @nestjs/common imports
  const nestJsCommonImportRegex = /import\s+{(.*?)}\s+from\s+['"]@nestjs\/common['"]/s;
  const match = content.match(nestJsCommonImportRegex);
  if (match) {
      let innerImports = match[1];
      if (!innerImports.includes('Logger')) {
         innerImports = innerImports.trim();
         if (innerImports.endsWith(',')) {
             innerImports = innerImports + ' Logger';
         } else {
             innerImports = innerImports + ', Logger';
         }
         content = content.replace(nestJsCommonImportRegex, `import { ${innerImports} } from '@nestjs/common';`);
      }
  }

  // Insert private readonly logger inside class
  const classRegex = /export\s+class\s+([A-Za-z0-9_]+)\s*\{/;
  const classMatch = content.match(classRegex);
  if (classMatch) {
      const className = classMatch[1];
      if (!content.includes('private readonly logger = ')) {
          content = content.replace(classMatch[0], classMatch[0] + `\n  private readonly logger = new Logger(${className}.name);\n`);
      }
  }

  let lines = content.split('\n');
  let newLines = [];
  
  for (let i = 0; i < lines.length; i++) {
     let line = lines[i];

     if (/console\./.test(line)) {
        if (/error\.stack|token|password/i.test(line)) {
            continue;
        }

        line = line.replace(/console\.log\(/g, "this.logger.log(");
        line = line.replace(/console\.warn\(/g, "this.logger.warn(");
        line = line.replace(/console\.error\(/g, "this.logger.error(");
     }
     newLines.push(line);
  }

  fs.writeFileSync(file, newLines.join('\n'));
});
