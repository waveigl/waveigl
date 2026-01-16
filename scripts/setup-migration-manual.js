#!/usr/bin/env node

/**
 * Script para guiar o usuário a executar a migração manualmente no Supabase Dashboard
 * Copia o SQL para a clipboard e abre o dashboard
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function setupMigration() {
  try {
    log('cyan', '\n🔐 Setup da Migração - Admin Password Protection\n');
    log('cyan', '═'.repeat(60) + '\n');

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
    if (!supabaseUrl) {
      log('red', '❌ NEXT_PUBLIC_SUPABASE_URL não configurada!');
      process.exit(1);
    }

    // Extrair project ID
    const projectId = supabaseUrl.split('https://')[1].split('.supabase.co')[0];
    const dashboardUrl = `https://supabase.com/dashboard/project/${projectId}/sql/new`;

    log('green', '✅ Variáveis de ambiente carregadas\n');

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
    log('green', '✅ Arquivo de migração carregado\n');

    // Salvar SQL em arquivo temporário para copiar
    const tempSqlPath = path.join(__dirname, '..', 'temp-migration.sql');
    fs.writeFileSync(tempSqlPath, migrationSQL);

    log('cyan', '📋 INSTRUÇÕES PARA EXECUTAR A MIGRAÇÃO:\n');
    log('cyan', '═'.repeat(60) + '\n');

    log('yellow', '1️⃣  COPIAR O SQL\n');
    log('blue', '   Arquivo: supabase/migrations/20250115000000_add_admin_password_protection.sql\n');
    log('blue', `   Tamanho: ${migrationSQL.length} caracteres\n`);
    
    // Copiar para clipboard (Windows)
    try {
      const clipboardCmd = `echo ${migrationSQL.replace(/"/g, '\\"').replace(/\n/g, '\\n')} | clip`;
      exec(clipboardCmd, (error) => {
        if (!error) {
          log('green', '   ✅ SQL copiado para a clipboard!\n');
        }
      });
    } catch (e) {
      log('yellow', '   ⚠️  Não foi possível copiar para clipboard\n');
    }

    log('yellow', '2️⃣  ABRIR O SUPABASE DASHBOARD\n');
    log('blue', `   URL: ${dashboardUrl}\n`);
    log('blue', `   Project ID: ${projectId}\n`);

    log('yellow', '3️⃣  EXECUTAR O SQL\n');
    log('blue', '   a) Clique em "SQL Editor" no menu esquerdo\n');
    log('blue', '   b) Clique em "New Query"\n');
    log('blue', '   c) Cole o SQL (Ctrl+V)\n');
    log('blue', '   d) Clique em "Run" ou pressione Ctrl+Enter\n');

    log('yellow', '4️⃣  VERIFICAR SE FUNCIONOU\n');
    log('blue', '   a) Vá para "Table Editor"\n');
    log('blue', '   b) Procure por "admin_security_config"\n');
    log('blue', '   c) Se aparecer, funcionou! ✅\n');

    log('cyan', '═'.repeat(60) + '\n');

    log('green', '✅ Próximos passos:\n');
    log('cyan', '1. Acesse: http://localhost:3000/admin/setup\n');
    log('cyan', '2. Siga o assistente para configurar sua senha\n');
    log('cyan', '3. Pronto! 🎉\n');

    // Tentar abrir o dashboard no navegador
    log('yellow', '⏳ Abrindo Supabase Dashboard...\n');
    
    const openCmd = process.platform === 'win32' 
      ? `start ${dashboardUrl}`
      : process.platform === 'darwin'
      ? `open ${dashboardUrl}`
      : `xdg-open ${dashboardUrl}`;

    exec(openCmd, (error) => {
      if (error) {
        log('yellow', `⚠️  Não foi possível abrir o navegador automaticamente\n`);
        log('cyan', `Abra manualmente: ${dashboardUrl}\n`);
      } else {
        log('green', '✅ Dashboard aberto no navegador!\n');
      }

      // Limpar arquivo temporário
      setTimeout(() => {
        try {
          fs.unlinkSync(tempSqlPath);
        } catch (e) {
          // Ignorar erro
        }
      }, 1000);
    });

  } catch (error) {
    log('red', `❌ Erro: ${error.message}\n`);
    process.exit(1);
  }
}

setupMigration();
