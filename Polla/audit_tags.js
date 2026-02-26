const fs = require('fs');

const content = fs.readFileSync('apps/web/src/modules/enterprise-league/components/EnterpriseLeagueHome.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];
let errors = [];

lines.forEach((line, i) => {
  const ln = i + 1;
  // Simplistic tag extractor
  const tags = line.match(/<div|<\/div|<header|<\/header|<main|<\/main/g);
  if (tags) {
    tags.forEach(tag => {
      if (tag === '<div' || tag === '<header' || tag === '<main') {
        // Check if it's self-closing
        const startIdx = line.indexOf(tag);
        const rest = line.substring(startIdx);
        const endIdx = rest.indexOf('>');
        if (endIdx !== -1 && rest.substring(0, endIdx + 1).endsWith('/>')) {
          // self closing, ignore
        } else {
          stack.push({ tag, ln });
        }
      } else {
        const last = stack.pop();
        const expected = tag.replace('/', '');
        if (!last || last.tag !== expected) {
          errors.push(`Error at L${ln}: found ${tag} but expected close for ${last ? last.tag : 'nothing'} from L${last ? last.ln : '?'}`);
          if (last) stack.push(last); // put back
        }
      }
    });
  }
});

console.log('Balance result:');
if (stack.length > 0) {
  stack.forEach(s => console.log(`Unclosed ${s.tag} from line ${s.ln}`));
}
if (errors.length > 0) {
  errors.forEach(e => console.log(e));
}
if (stack.length === 0 && errors.length === 0) {
  console.log('All tags balanced perfectly!');
}
