import { chatHub } from './hub'

let readerStarted = false

export async function startYouTubeReader(): Promise<void> {
  if (readerStarted) return
  readerStarted = true
  // Placeholder: integrar com YouTube Live Chat API
  // Estratégia simples: polling periódico do liveChatMessages.list no vídeo ao vivo do canal @waveigl
  // Aqui, omitimos por simplicidade (limites de quota em dev).
}

export async function sendYouTubeMessage(accessToken: string, liveChatId: string, message: string): Promise<void> {
  // Enviar mensagem usando OAuth do usuário
  await fetch('https://www.googleapis.com/youtube/v3/liveChat/messages?part=snippet', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      snippet: {
        type: 'textMessageEvent',
        liveChatId,
        textMessageDetails: { messageText: message }
      }
    })
  })
  // Opcional: publicar localmente para feedback instantâneo
  chatHub.publish({
    id: `${Date.now()}-${Math.random()}`,
    platform: 'youtube',
    username: 'you', // substituído no conector final
    userId: 'self',
    message,
    timestamp: Date.now(),
    badges: []
  })
}


