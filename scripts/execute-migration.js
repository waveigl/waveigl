#!/usr/bin/env node

/**
 * Script para executar a migração de admin password protection
 * Usa a API SQL do Supabase diretamente
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Cores para terminal
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

function makeRequest(url, options, payload) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', reject);
    
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function executeMigration() {
  try {
    log('cyan', '🔐 Executando migração de admin password protection...\n');

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
      log('red', 'Verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
      process.exit(1);
    }

    log('green', '✅ Variáveis de ambiente carregadas');
    log('cyan', `📍 Supabase URL: ${supabaseUrl}\n`);

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
      log('red', `Procurando em: ${migrationPath}`);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    log('green', '✅ Arquivo de migração carregado');
    log('cyan', `📄 Tamanho: ${migrationSQL.length} caracteres\n`);

    // Executar migração via API SQL
    log('yellow', '⏳ Enviando migração para o Supabase...\n');

    const urlObj = new URL(supabaseUrl);
    const projectId = urlObj.hostname.split('.')[0];
    
    const apiUrl = `https://${projectId}.supabase.co/rest/v1/`;
    
    const payload = JSON.stringify({
      query: migrationSQL
    });

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

    const response = await makeRequest(`https://${projectId}.supabase.co/rest/v1/rpc/exec_sql`, options, payload);

    if (response.statusCode === 404) {
      // Função RPC não existe, tentar via GraphQL ou SQL direto
      log('yellow', '⚠️  Função RPC não disponível, tentando método alternativo...\n');
      
      // Tentar via endpoint de query SQL
      const sqlPayload = JSON.stringify({
        sql: migrationSQL
      });

      const sqlOptions = {
        hostname: `${projectId}.supabase.co`,
        port: 443,
        path: '/rest/v1/rpc/sql',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(sqlPayload),
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
      };

      const sqlResponse = await makeRequest(`https://${projectId}.supabase.co/rest/v1/rpc/sql`, sqlOptions, sqlPayload);
      
      if (sqlResponse.statusCode >= 200 && sqlResponse.statusCode < 300) {
        log('green', '✅ Migração executada com sucesso!\n');
        log('green', '🎉 As tabelas foram criadas no seu banco de dados!\n');
        log('cyan', 'Próximos passos:');
        log('cyan', '1. Acesse: http://localhost:3000/admin/setup');
        log('cyan', '2. Siga o assistente para configurar sua senha');
        log('cyan', '3. Pronto! 🎉\n');
        return;
      }
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      log('green', '✅ Migração executada com sucesso!\n');
      log('green', '🎉 As tabelas foram criadas no seu banco de dados!\n');
      log('cyan', 'Próximos passos:');
      log('cyan', '1. Acesse: http://localhost:3000/admin/setup');
      log('cyan', '2. Siga o assistente para configurar sua senha');
      log('cyan', '3. Pronto! 🎉\n');
    } else {
      log('red', `❌ Erro ao executar migração (Status: ${response.statusCode})\n`);
      log('red', 'Resposta do servidor:');
      log('red', response.data);
      throw new Error(`HTTP ${response.statusCode}`);
    }

  } catch (error) {
    log('red', `❌ Erro: ${error.message}\n`);
    
    log('yellow', 'Alternativa: Execute o SQL manualmente\n');
    log('cyan', '1. Acesse: https://supabase.com/dashboard');
    log('cyan', '2. Vá para: SQL Editor');
    log('cyan', '3. Cole o conteúdo de: supabase/migrations/20250115000000_add_admin_password_protection.sql');
    log('cyan', '4. Clique em "Run"\n');
    
    process.exit(1);
  }
}

executeMigration();
