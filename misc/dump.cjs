// Запуск с рута проекта:
// node ./misc/dump.cjs 

const fs = require('fs');
const path = require('path');

const ROOT_DIR = '.';
const OUTPUT_FILE = 'misc/project_dump.md';

const INCLUDE_EXTENSIONS = new Set([
    '.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.scss', 
    '.html', '.vue', '.svelte', '.md', '.yaml', '.yml', '.graphql'
]);

const IGNORE_DIRS = new Set([
    'node_modules', 'dist', 'build', '.next', '.nuxt', '.git', 
    '.vscode', '.idea', 'coverage', '.turbo', '.cache', 'out', '.output', '.vercel',
    'misc'
]);

const IGNORE_FILES = new Set([
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb', '.env', '.env.local'
]);

let outputContent = '';
let fileCount = 0;
let totalChars = 0;

function getLanguage(ext) {
    const map = {
        '.ts': 'typescript', '.tsx': 'tsx', '.js': 'javascript', '.jsx': 'jsx',
        '.json': 'json', '.css': 'css', '.scss': 'scss', '.html': 'html',
        '.vue': 'vue', '.svelte': 'svelte', '.md': 'markdown', 
        '.yaml': 'yaml', '.yml': 'yaml', '.graphql': 'graphql'
    };
    return map[ext] || 'text';
}

function walk(dir) {
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
        return;
    }

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
            if (!IGNORE_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
                walk(fullPath);
            }
        } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            
            if (INCLUDE_EXTENSIONS.has(ext) && !IGNORE_FILES.has(entry.name)) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    const lang = getLanguage(ext);
                    const relativePath = path.relative(ROOT_DIR, fullPath).replace(/\\/g, '/');

                    outputContent += `\n## ${relativePath}\n\n`;
                    outputContent += `\`\`\`${lang}\n${content}\n\`\`\`\n`;
                    
                    fileCount++;
                    totalChars += content.length;
                } catch (err) {
                    console.warn(`⚠️ Не удалось прочитать ${fullPath}: ${err.message}`);
                }
            }
        }
    }
}

console.log('🔍 Сканирую проект...');
walk(ROOT_DIR);

const header = `# Project Dump\n**Generated:** ${new Date().toLocaleString()}\n**Files:** ${fileCount}\n**Approx chars:** ${totalChars}\n\n---\n`;

fs.writeFileSync(OUTPUT_FILE, header + outputContent, 'utf-8');

console.log(`✅ Готово! Собрано ${fileCount} файлов.`);
console.log(`📄 Результат сохранен в: ${OUTPUT_FILE}`);
console.log(`⚠️  Размер: ~${Math.round(totalChars / 1024)} KB (проверь, влезает ли это в контекст твоей ИИ!)`);
