```mermaid
flowchart LR
  A[Twitch] --> G
  Y[YouTube] --> G
  K[Kick] --> G
  G[ChatHub in-memory] --> S[SSE /api/chat/stream]
  S --> UI[UnifiedChat]
```


