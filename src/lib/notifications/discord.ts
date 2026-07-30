export async function notifyDiscord(event: string, data: Record<string, any>) {
  if (!process.env.DISCORD_WEBHOOK_URL) {
    return
  }

  try {
    await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `**[${event}]** ${JSON.stringify(data)}`,
      }),
    })
  } catch (error) {
    console.error('[Discord] Failed to send notification:', error)
  }
}