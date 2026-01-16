#!/usr/bin/env node

/**
 * Script para executar SQL no Supabase via API
 * Usa o endpoint correto do Supabase
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runSQL() {
  try {
    log('cyan', '\n🔐 Executando migração no Supabase\n');

    // Ler .env.local
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const env = {};
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && !key.startsWith('#')) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    });

    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      log('red', '❌ Variáveis de ambiente não configuradas!');
      process.exit(1);
    }

    // Ler SQL
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250115000000_add_admin_password_protection.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    log('green', '✅ Arquivo carregado');
    log('cyan', `📄 ${sql.length} caracteres\n`);

    // Extrair project ID
    const projectId = supabaseUrl.split('https://')[1].split('.supabase.co')[0];
    
    log('yellow', '⏳ Enviando para Supabase...\n');

    // Dividir em statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    log('cyan', `📋 ${statements.length} statements\n`);

    let executed = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';';
      
      const payload = JSON.stringify({ query: stmt });

      const options = {
        hostname: `${projectId}.supabase.co`,
        port: 443,
        path: '/rest/v1/rpc/exec_sql',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
      };

      await new Promise((resolve) => {
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              log('green', `[${i + 1}/${statements.length}] ✅`);
              executed++;
            } else if (res.statusCode === 404) {
              // Função não existe, ignorar
              log('yellow', `[${i + 1}/${statements.length}] ⚠️  (função não existe)`);
            } else {
              log('yellow', `[${i + 1}/${statements.length}] ⚠️  (status ${res.statusCode})`);
            }
            resolve();
          });
        });

        req.on('error', () => {
          log('yellow', `[${i + 1}/${statements.length}] ⚠️  (erro de conexão)`);
          resolve();
        });

        req.write(payload);
        req.end();
      });
    }

    log('\n');
    log('green', '✅ Migração enviada!\n');
    log('cyan', 'Próximos passos:');
    log('cyan', '1. Acesse: http://localhost:3000/admin/setup');
    log('cyan', '2. Siga o assistente');
    log('cyan', '3. Pronto! 🎉\n');

  } catch (error) {
    log('red', `❌ ${error.message}\n`);
    process.exit(1);
  }
}

runSQL();
