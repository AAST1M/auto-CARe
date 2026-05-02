const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, 'frontend', 'src');
const backendEnv = path.join(__dirname, 'backend', '.env');
const backendIndex = path.join(__dirname, 'backend', 'src', 'index.ts');

function replaceInFile(filePath) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('5000')) {
      content = content.replace(/5000/g, '5001');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated', filePath);
    }
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      replaceInFile(fullPath);
    }
  }
}

walk(frontendDir);
replaceInFile(backendEnv);
replaceInFile(backendIndex);
console.log('Ports updated from 5000 to 5001');
