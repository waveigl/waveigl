declare module 'tmi.js' {
  // Minimal typings to satisfy our usage
  export interface ClientOptions {
    identity?: {
      username: string
      password: string
    }
    channels?: string[]
    connection?: {
      secure?: boolean
      reconnect?: boolean
    }
  }

  export class Client {
    constructor(options?: ClientOptions)
    connect(): Promise<[string, number]>
    disconnect(): Promise<[string, number]>
    say(channel: string, message: string): Promise<[string, number]>
    on(
      event: 'message',
      listener: (channel: string, userstate: Record<string, any>, message: string, self: boolean) => void
    ): this
  }

  const tmi: {
    Client: typeof Client
  }
  export default tmi
}


