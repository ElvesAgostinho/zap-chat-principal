const fs = require('fs');
let content = fs.readFileSync('supabase/functions/whatsapp-webhook/index.ts', 'utf8');

// Replace common emojis used in the code
content = content.replace(/🛑/g, '[STOP]');
content = content.replace(/🐛/g, '[BUG]');
content = content.replace(/✅/g, '[OK]');
content = content.replace(/❌/g, '[ERRO]');
content = content.replace(/⚠️/g, '[AVISO]');
content = content.replace(/🚀/g, '[ROCKET]');

fs.writeFileSync('supabase/functions/whatsapp-webhook/index.ts', content);
console.log('Emojis replaced in index.ts');
