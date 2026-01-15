#!/usr/bin/env node

/**
 * Script automático para configurar a senha do painel admin
 * Execute: node scripts/setup-admin-password-auto.js
 * 
 * Este script:
 * 1. Busca seu User ID automaticamente via API
 * 2. Lê a senha do stdin
 * 3. Gera o hash bcrypt
 * 4. Exibe o comando SQL completo pronto para usar
 */

const bcrypt = require('bcrypt')
const readline = require('readline')
const https = require('https')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

async function setupPassword() {
  console.log('\n🔐 Configurador Automático de Senha do Painel Admin\n')
  console.log('Este script irá:')
  console.log('1. Buscar seu User ID automaticamente')
  console.log('2. Gerar um hash bcrypt para sua senha')
  console.log('3. Exibir o comando SQL pronto para usar\n')

  // Perguntar pela URL do site
  rl.question('Digite a URL do seu site (ex: https://waveigl.com): ', async (siteUrl) => {
    if (!siteUrl.startsWith('http')) {
      console.log('\n❌ URL inválida! Deve começar com http:// ou https://')
      rl.close()
      process.exit(1)
    }

    try {
      console.log('\n⏳ Buscando seu User ID...\n')

      // Buscar User ID via API
      const userId = await fetchUserIdFromApi(siteUrl)

      if (!userId) {
        console.log('❌ Não foi possível obter seu User ID.')
        console.log('Verifique se:')
        console.log('- A URL está correta')
        console.log('- Você está autenticado no site')
        console.log('- Você é Gabriel Toth (ogabrieltoth)\n')
        rl.close()
        process.exit(1)
      }

      console.log(`✅ User ID encontrado: ${userId}\n`)

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
          console.log(`  '${userId}',`)
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
    } catch (error) {
      console.error('\n❌ Erro:', error.message)
      rl.close()
      process.exit(1)
    }
  })
}

function fetchUserIdFromApi(siteUrl) {
  return new Promise((resolve, reject) => {
    const url = new URL('/api/admin/my-user-id', siteUrl)

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Cookie': getCookieFromLocalStorage()
      }
    }

    const protocol = url.protocol === 'https:' ? https : require('http')

    const req = protocol.request(options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        try {
          const response = JSON.parse(data)
          if (response.success && response.userId) {
            resolve(response.userId)
          } else {
            reject(new Error(response.message || 'Erro ao obter User ID'))
          }
        } catch (error) {
          reject(new Error('Resposta inválida da API'))
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.end()
  })
}

function getCookieFromLocalStorage() {
  // Nota: Este script não tem acesso ao localStorage do navegador
  // O usuário precisa estar autenticado no site para que a API funcione
  // A autenticação é feita via cookie de sessão
  return ''
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
