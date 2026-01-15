#!/usr/bin/env node

/**
 * Script para configurar a senha do painel admin
 * Execute: node scripts/setup-admin-password.js
 * 
 * Este script:
 * 1. Lê a senha do stdin (não fica no histórico)
 * 2. Gera o hash bcrypt
 * 3. Exibe o comando SQL para inserir no banco
 */

const bcrypt = require('bcrypt')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

async function setupPassword() {
  console.log('\n🔐 Configurador de Senha do Painel Admin\n')
  console.log('Este script irá gerar um hash bcrypt para sua senha.\n')

  // Perguntar pela senha
  rl.question('Digite sua senha: ', async (password) => {
    // Validar força da senha
    const validation = validatePasswordStrength(password)
    
    if (!validation.isValid) {
      console.log('\n❌ Senha fraca! Requisitos:')
      validation.errors.forEach(error => {
        console.log(`   - ${error}`)
      })
      rl.close()
      process.exit(1)
    }

    try {
      console.log('\n⏳ Gerando hash bcrypt (isso pode levar alguns segundos)...\n')
      
      const hash = await bcrypt.hash(password, 12)
      
      console.log('✅ Hash gerado com sucesso!\n')
      console.log('=' .repeat(80))
      console.log('\n📋 Execute este comando SQL no Supabase:\n')
      console.log('```sql')
      console.log("INSERT INTO admin_security_config (")
      console.log("  admin_user_id,")
      console.log("  password_hash,")
      console.log("  password_salt")
      console.log(") VALUES (")
      console.log("  'SEU_USER_ID_AQUI',")
      console.log(`  '${hash}',`)
      console.log("  'salt'")
      console.log(");")
      console.log('```\n')
      console.log('=' .repeat(80))
      console.log('\n📝 Passos:')
      console.log('1. Acesse: https://supabase.com/dashboard')
      console.log('2. Vá para: SQL Editor')
      console.log('3. Cole o comando acima')
      console.log('4. Clique em "Run"')
      console.log('5. Pronto! Sua senha está configurada.\n')
      
      rl.close()
      process.exit(0)
    } catch (error) {
      console.error('\n❌ Erro ao gerar hash:', error.message)
      rl.close()
      process.exit(1)
    }
  })
}

function validatePasswordStrength(password) {
  const errors = []

  if (!password) {
    errors.push('Senha é obrigatória')
    return { isValid: false, errors }
  }

  if (password.length < 8) {
    errors.push('Senha deve ter no mínimo 8 caracteres')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Senha deve conter pelo menos um número')
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Senha deve conter pelo menos um caractere especial (!@#$%^&*)')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

setupPassword()
