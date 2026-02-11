---
inclusion: always
---

# 🚨 Error Handling & Discord Notifications

Complete guide for error handling and production notifications.

## 📊 Error Levels

### CRITICAL (Critical)
Affects the entire system, requires immediate action.

```typescript
// Examples:
- Database connection lost
- Payment processing completely down
- Authentication system failure
- Discord bot offline
```

### ERROR (Error)
Affects specific functionality, needs to be fixed.

```typescript
// Examples:
- User subscription creation failed
- Discord sync error
- Mercado Pago webhook error
- Email sending failed
```

### WARNING (Warning)
Abnormal but recoverable situation.

```typescript
// Examples:
- Retry attempt #3 of 5
- Rate limit approaching
- Deprecated API usage
- Slow query detected
```

### INFO (Information)
Important events for audit.

```typescript
// Examples:
- User logged in
- Subscription created
- Payment received
- Discord role assigned
```

## 🔔 Discord Notifications System

### Configuration

```typescript
// .env.local
DISCORD_ERROR_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_INFO_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_CRITICAL_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### Notification Function

```typescript
// src/lib/notifications/error-handler.ts
import { notifyDiscord } from '@/lib/notifications/discord'

export interface ErrorNotification {
  level: 'info' | 'warning' | 'error' | 'critical'
  title: string
  message: string
  context?: Record<string, unknown>
  stackTrace?: string
  userId?: string
  timestamp?: string
}

export async function handleError(notification: ErrorNotification) {
  const {
    level,
    title,
    message,
    context = {},
    stackTrace,
    userId,
    timestamp = new Date().toISOString()
  } = notification

  // Structured log
  console.error(`[${level.toUpperCase()}] ${title}`, {
    message,
    context,
    userId,
    timestamp
  })

  // Notify Discord only for ERROR and CRITICAL
  if (level === 'error' || level === 'critical') {
    await notifyDiscord({
      level,
      title,
      message,
      context: {
        ...context,
        userId,
        timestamp,
        environment: process.env.NODE_ENV,
        url: process.env.NEXT_PUBLIC_APP_URL
      },
      stackTrace
    })
  }

  // Return for additional handling
  return {
    success: false,
    error: message,
    level
  }
}
```

## 🛡️ Handling Patterns

### Basic Try-Catch

```typescript
// ✅ GOOD
try {
  const result = await riskyOperation()
  return { success: true, data: result }
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error'
  
  await handleError({
    level: 'error',
    title: 'Operation Failed',
    message,
    context: { operation: 'riskyOperation' }
  })
  
  return { success: false, error: message }
}

// ❌ BAD
const result = await riskyOperation()
return { success: true, data: result }
```

### API Routes

```typescript
// ✅ GOOD
import { NextRequest, NextResponse } from 'next/server'
import { handleError } from '@/lib/notifications/error-handler'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    if (!body.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Process
    const result = await processData(body)

    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    await handleError({
      level: 'error',
      title: 'API Error: POST /api/endpoint',
      message,
      context: {
        endpoint: '/api/endpoint',
        method: 'POST'
      },
      stackTrace: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Async Operations

```typescript
// ✅ GOOD
async function createSubscription(userId: string) {
  try {
    // Validate
    if (!userId) {
      throw new Error('User ID is required')
    }

    // Create
    const subscription = await mercadoPago.createPreApproval({
      external_reference: userId,
      // ... other data
    })

    console.log('[Subscription] Created:', { userId, subscriptionId: subscription.id })

    return { success: true, data: subscription }

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    await handleError({
      level: 'error',
      title: 'Subscription Creation Failed',
      message,
      context: { userId },
      stackTrace: error instanceof Error ? error.stack : undefined
    })

    throw error // Re-throw for upper handling
  }
}
```

### Database Operations

```typescript
// ✅ GOOD
async function getUserData(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    if (!data) {
      throw new Error('User not found')
    }

    return data

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    await handleError({
      level: 'error',
      title: 'Database Query Failed',
      message,
      context: { userId, table: 'profiles' }
    })

    return null
  }
}
```

## 🎯 Specific Use Cases

### Payment Failed

```typescript
async function handlePaymentError(error: Error, userId: string, amount: number) {
  await handleError({
    level: 'critical', // Critical because it affects revenue
    title: 'Payment Processing Failed',
    message: error.message,
    context: {
      userId,
      amount,
      provider: 'mercadopago',
      timestamp: new Date().toISOString()
    },
    stackTrace: error.stack
  })

  // Notify user
  await sendEmailToUser(userId, {
    subject: 'Error processing payment',
    body: 'There was an error processing your payment. Please try again.'
  })
}
```

### Discord Sync Failed

```typescript
async function handleDiscordSyncError(error: Error, userId: string) {
  await handleError({
    level: 'error',
    title: 'Discord Sync Failed',
    message: error.message,
    context: {
      userId,
      service: 'discord',
      action: 'add_member_to_server'
    }
  })

  // Automatic retry
  setTimeout(() => {
    retryDiscordSync(userId)
  }, 5000)
}
```

### Invalid Webhook

```typescript
async function handleWebhookError(error: Error, provider: string, payload: unknown) {
  await handleError({
    level: 'warning',
    title: `Invalid Webhook from ${provider}`,
    message: error.message,
    context: {
      provider,
      payloadType: typeof payload,
      payloadSize: JSON.stringify(payload).length
    }
  })
}
```

## 📝 Structured Logging

### Standard Format

```typescript
// ✅ GOOD
console.log('[FeatureName] Event description:', {
  userId: 'user-123',
  action: 'subscription_created',
  timestamp: new Date().toISOString(),
  metadata: { planId: 'plan-1', price: 9.90 }
})

// ❌ BAD
console.log('done')
console.log('user subscribed')
```

### Important Context

```typescript
// ✅ GOOD: Include relevant context
console.error('[Payment] Mercado Pago error:', {
  error: error.message,
  userId: userId,
  amount: amount,
  currency: 'BRL',
  provider: 'mercadopago',
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV,
  requestId: generateRequestId() // For tracking
})

// ❌ BAD: Without context
console.error('Payment error:', error)
```

## 🔄 Retry Logic

```typescript
// ✅ GOOD: Retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt)
        console.warn(`[Retry] Attempt ${attempt + 1}/${maxRetries}, retrying in ${delay}ms`, {
          error: lastError.message
        })
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

// Usage
try {
  const result = await retryWithBackoff(
    () => mercadoPago.createPreApproval(data),
    3,
    1000
  )
} catch (error) {
  await handleError({
    level: 'critical',
    title: 'Mercado Pago Failed After Retries',
    message: error instanceof Error ? error.message : 'Unknown error'
  })
}
```

## 🎓 Best Practices

### 1. Always Validate Input

```typescript
// ✅ GOOD
if (!userId || typeof userId !== 'string') {
  throw new Error('Invalid userId')
}

// ❌ BAD
const user = await getUser(userId) // Can fail silently
```

### 2. Use Specific Types

```typescript
// ✅ GOOD
interface PaymentError {
  code: string
  message: string
  retryable: boolean
}

// ❌ BAD
const error: any = { ... }
```

### 3. Document Possible Errors

```typescript
/**
 * Creates a subscription
 * @throws Error if user not found
 * @throws Error if invalid data
 * @throws Error if Mercado Pago unavailable
 */
async function createSubscription(userId: string) {
  // ...
}
```

### 4. Don't Swallow Errors

```typescript
// ✅ GOOD: Re-throw after logging
try {
  await riskyOperation()
} catch (error) {
  console.error('Operation failed:', error)
  throw error // Re-throw
}

// ❌ BAD: Swallow error silently
try {
  await riskyOperation()
} catch (error) {
  // Nothing here
}
```

### 5. Use Descriptive Messages

```typescript
// ✅ GOOD
throw new Error('Failed to create subscription: Mercado Pago returned 401 Unauthorized')

// ❌ BAD
throw new Error('Error')
```

## 📊 Monitoring

### Important Metrics

- Error rate per endpoint
- API response time
- Retry rate
- Unhandled errors
- Discord alerts received

### Dashboard

Create Discord dashboard with:
- Real-time critical errors
- Performance alerts
- Success/failure rate
- Affected users

## 🔐 Security

### Don't Log Sensitive Data

```typescript
// ✅ GOOD
console.log('[Auth] Login attempt:', { userId, timestamp })

// ❌ BAD
console.log('[Auth] Login attempt:', { userId, password, token })
```

### Sanitize Error Messages

```typescript
// ✅ GOOD: Generic message for user
return NextResponse.json(
  { error: 'An error occurred. Please try again.' },
  { status: 500 }
)

// ❌ BAD: Expose internal details
return NextResponse.json(
  { error: `Database connection failed: ${error.message}` },
  { status: 500 }
)
```

## 📞 Support

Questions about error handling?
- Check examples in `src/lib/notifications/`
- See implementations in `src/app/api/`
- Review tests in `tests/error-handling/`

## 📊 Níveis de Erro

### CRITICAL (Crítico)
Afeta todo o sistema, requer ação imediata.

```typescript
// Exemplos:
- Database connection lost
- Payment processing completely down
- Authentication system failure
- Discord bot offline
```

### ERROR (Erro)
Afeta funcionalidade específica, precisa ser corrigido.

```typescript
// Exemplos:
- User subscription creation failed
- Discord sync error
- Mercado Pago webhook error
- Email sending failed
```

### WARNING (Aviso)
Situação anormal mas recuperável.

```typescript
// Exemplos:
- Retry attempt #3 of 5
- Rate limit approaching
- Deprecated API usage
- Slow query detected
```

### INFO (Informação)
Eventos importantes para auditoria.

```typescript
// Exemplos:
- User logged in
- Subscription created
- Payment received
- Discord role assigned
```

## 🔔 Sistema de Notificações Discord

### Configuração

```typescript
// .env.local
DISCORD_ERROR_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_INFO_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_CRITICAL_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### Função de Notificação

```typescript
// src/lib/notifications/error-handler.ts
import { notifyDiscord } from '@/lib/notifications/discord'

export interface ErrorNotification {
  level: 'info' | 'warning' | 'error' | 'critical'
  title: string
  message: string
  context?: Record<string, unknown>
  stackTrace?: string
  userId?: string
  timestamp?: string
}

export async function handleError(notification: ErrorNotification) {
  const {
    level,
    title,
    message,
    context = {},
    stackTrace,
    userId,
    timestamp = new Date().toISOString()
  } = notification

  // Log estruturado
  console.error(`[${level.toUpperCase()}] ${title}`, {
    message,
    context,
    userId,
    timestamp
  })

  // Notificar Discord apenas para ERROR e CRITICAL
  if (level === 'error' || level === 'critical') {
    await notifyDiscord({
      level,
      title,
      message,
      context: {
        ...context,
        userId,
        timestamp,
        environment: process.env.NODE_ENV,
        url: process.env.NEXT_PUBLIC_APP_URL
      },
      stackTrace
    })
  }

  // Retornar para tratamento adicional
  return {
    success: false,
    error: message,
    level
  }
}
```

## 🛡️ Padrões de Tratamento

### Try-Catch Básico

```typescript
// ✅ BOM
try {
  const result = await riskyOperation()
  return { success: true, data: result }
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error'
  
  await handleError({
    level: 'error',
    title: 'Operation Failed',
    message,
    context: { operation: 'riskyOperation' }
  })
  
  return { success: false, error: message }
}

// ❌ RUIM
const result = await riskyOperation()
return { success: true, data: result }
```

### API Routes

```typescript
// ✅ BOM
import { NextRequest, NextResponse } from 'next/server'
import { handleError } from '@/lib/notifications/error-handler'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar entrada
    if (!body.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Processar
    const result = await processData(body)

    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    await handleError({
      level: 'error',
      title: 'API Error: POST /api/endpoint',
      message,
      context: {
        endpoint: '/api/endpoint',
        method: 'POST'
      },
      stackTrace: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Async Operations

```typescript
// ✅ BOM
async function createSubscription(userId: string) {
  try {
    // Validar
    if (!userId) {
      throw new Error('User ID is required')
    }

    // Criar
    const subscription = await mercadoPago.createPreApproval({
      external_reference: userId,
      // ... outros dados
    })

    console.log('[Subscription] Created:', { userId, subscriptionId: subscription.id })

    return { success: true, data: subscription }

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    await handleError({
      level: 'error',
      title: 'Subscription Creation Failed',
      message,
      context: { userId },
      stackTrace: error instanceof Error ? error.stack : undefined
    })

    throw error // Re-throw para tratamento superior
  }
}
```

### Database Operations

```typescript
// ✅ BOM
async function getUserData(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    if (!data) {
      throw new Error('User not found')
    }

    return data

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    await handleError({
      level: 'error',
      title: 'Database Query Failed',
      message,
      context: { userId, table: 'profiles' }
    })

    return null
  }
}
```

## 🎯 Casos de Uso Específicos

### Pagamento Falhou

```typescript
async function handlePaymentError(error: Error, userId: string, amount: number) {
  await handleError({
    level: 'critical', // Crítico pois afeta receita
    title: 'Payment Processing Failed',
    message: error.message,
    context: {
      userId,
      amount,
      provider: 'mercadopago',
      timestamp: new Date().toISOString()
    },
    stackTrace: error.stack
  })

  // Notificar usuário
  await sendEmailToUser(userId, {
    subject: 'Erro ao processar pagamento',
    body: 'Houve um erro ao processar seu pagamento. Tente novamente.'
  })
}
```

### Discord Sync Falhou

```typescript
async function handleDiscordSyncError(error: Error, userId: string) {
  await handleError({
    level: 'error',
    title: 'Discord Sync Failed',
    message: error.message,
    context: {
      userId,
      service: 'discord',
      action: 'add_member_to_server'
    }
  })

  // Retry automático
  setTimeout(() => {
    retryDiscordSync(userId)
  }, 5000)
}
```

### Webhook Inválido

```typescript
async function handleWebhookError(error: Error, provider: string, payload: unknown) {
  await handleError({
    level: 'warning',
    title: `Invalid Webhook from ${provider}`,
    message: error.message,
    context: {
      provider,
      payloadType: typeof payload,
      payloadSize: JSON.stringify(payload).length
    }
  })
}
```

## 📝 Logging Estruturado

### Formato Padrão

```typescript
// ✅ BOM
console.log('[FeatureName] Event description:', {
  userId: 'user-123',
  action: 'subscription_created',
  timestamp: new Date().toISOString(),
  metadata: { planId: 'plan-1', price: 9.90 }
})

// ❌ RUIM
console.log('done')
console.log('user subscribed')
```

### Contexto Importante

```typescript
// ✅ BOM: Incluir contexto relevante
console.error('[Payment] Mercado Pago error:', {
  error: error.message,
  userId: userId,
  amount: amount,
  currency: 'BRL',
  provider: 'mercadopago',
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV,
  requestId: generateRequestId() // Para rastrear
})

// ❌ RUIM: Sem contexto
console.error('Payment error:', error)
```

## 🔄 Retry Logic

```typescript
// ✅ BOM: Retry com backoff exponencial
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt)
        console.warn(`[Retry] Attempt ${attempt + 1}/${maxRetries}, retrying in ${delay}ms`, {
          error: lastError.message
        })
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

// Uso
try {
  const result = await retryWithBackoff(
    () => mercadoPago.createPreApproval(data),
    3,
    1000
  )
} catch (error) {
  await handleError({
    level: 'critical',
    title: 'Mercado Pago Failed After Retries',
    message: error instanceof Error ? error.message : 'Unknown error'
  })
}
```

## 🎓 Boas Práticas

### 1. Sempre Validar Entrada

```typescript
// ✅ BOM
if (!userId || typeof userId !== 'string') {
  throw new Error('Invalid userId')
}

// ❌ RUIM
const user = await getUser(userId) // Pode falhar silenciosamente
```

### 2. Usar Tipos Específicos

```typescript
// ✅ BOM
interface PaymentError {
  code: string
  message: string
  retryable: boolean
}

// ❌ RUIM
const error: any = { ... }
```

### 3. Documentar Erros Possíveis

```typescript
/**
 * Cria uma assinatura
 * @throws Error se usuário não encontrado
 * @throws Error se dados inválidos
 * @throws Error se Mercado Pago indisponível
 */
async function createSubscription(userId: string) {
  // ...
}
```

### 4. Não Engolir Erros

```typescript
// ✅ BOM: Re-throw após logar
try {
  await riskyOperation()
} catch (error) {
  console.error('Operation failed:', error)
  throw error // Re-throw
}

// ❌ RUIM: Engolir erro silenciosamente
try {
  await riskyOperation()
} catch (error) {
  // Nada aqui
}
```

### 5. Usar Mensagens Descritivas

```typescript
// ✅ BOM
throw new Error('Failed to create subscription: Mercado Pago returned 401 Unauthorized')

// ❌ RUIM
throw new Error('Error')
```

## 📊 Monitoramento

### Métricas Importantes

- Taxa de erro por endpoint
- Tempo de resposta das APIs
- Taxa de retry
- Erros não tratados
- Alertas Discord recebidos

### Dashboard

Criar dashboard no Discord com:
- Erros críticos em tempo real
- Alertas de performance
- Taxa de sucesso/falha
- Usuários afetados

## 🔐 Segurança

### Não Logar Dados Sensíveis

```typescript
// ✅ BOM
console.log('[Auth] Login attempt:', { userId, timestamp })

// ❌ RUIM
console.log('[Auth] Login attempt:', { userId, password, token })
```

### Sanitizar Mensagens de Erro

```typescript
// ✅ BOM: Mensagem genérica para usuário
return NextResponse.json(
  { error: 'An error occurred. Please try again.' },
  { status: 500 }
)

// ❌ RUIM: Expor detalhes internos
return NextResponse.json(
  { error: `Database connection failed: ${error.message}` },
  { status: 500 }
)
```

## 📞 Suporte

Dúvidas sobre tratamento de erros?
- Consulte exemplos em `src/lib/notifications/`
- Veja implementações em `src/app/api/`
- Revise testes em `tests/error-handling/`
