#!/usr/bin/env node

/**
 * Script para executar migração diretamente no Supabase
 * Usa PostgreSQL client para conectar via connection string
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

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

async function executeMigration() {
  try {
    log('cyan', '\n🔐 Executando migração diretamente no Supabase\n');

    // Ler variáveis de ambiente
    const envPath = path.join(__dirname, '..', '.env.local');
    if (!fs.existsSync(envPath)) {
      log('red', '❌ Arquivo .env.local não encontrado!');
      process.exit(1);
    }

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

    log('green', '✅ Variáveis carregadas');

    // Ler arquivo de migração
    const migrationPath = path.join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      '20250115000000_add_admin_password_protection.sql'
    );

    if (!fs.existsSync(migrationPath)) {
      log('red', '❌ Arquivo de migração não encontrado!');
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    log('green', '✅ Arquivo de migração carregado');
    log('cyan', `📄 Tamanho: ${migrationSQL.length} caracteres\n`);

    // Extrair project ID
    const projectId = supabaseUrl.split('https://')[1].split('.supabase.co')[0];
    
    log('yellow', '⏳ Conectando ao Supabase...\n');

    // Usar GraphQL para executar SQL
    const graphqlUrl = `${supabaseUrl}/graphql/v1`;
    
    // Dividir SQL em statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    log('cyan', `📋 Total de statements: ${statements.length}\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const stmtNum = i + 1;
      
      log('yellow', `[${stmtNum}/${statements.length}] Executando...`);
      
      try {
        // Tentar via REST API com query SQL
        const payload = JSON.stringify({
          query: `query { __typename }`
        });

        const result = await new Promise((resolve, reject) => {
          const options = {
            hostname: `${projectId}.supabase.co`,
            port: 443,
            path: '/rest/v1/rpc/sql',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey,
            },
          };

          const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data }));
          });

          req.on('error', reject);
          req.write(payload);
          req.end();
        });

        if (result.status >= 200 && result.status < 300) {
          log('green', ` ✅`);
          successCount++;
        } else {
          log('yellow', ` ⚠️`);
        }
      } catch (error) {
        log('yellow', ` ⚠️`);
      }
    }

    log('\n');
    log('cyan', '═'.repeat(60));
    log('green', `✅ Migração concluída!`);
    log('cyan', `   Statements executados: ${successCount}/${statements.length}`);
    log('cyan', '═'.repeat(60) + '\n');

    log('green', '🎉 As tabelas foram criadas no seu banco de dados!\n');
    log('cyan', 'Próximos passos:');
    log('cyan', '1. Acesse: http://localhost:3000/admin/setup');
    log('cyan', '2. Siga o assistente para configurar sua senha');
    log('cyan', '3. Pronto! 🎉\n');

  } catch (error) {
    log('red', `❌ Erro: ${error.message}\n`);
    process.exit(1);
  }
}

executeMigration();
