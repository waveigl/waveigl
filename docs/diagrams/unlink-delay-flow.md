```mermaid
flowchart TD
  A[POST /api/auth/unlink {platform}] --> B[Criar pending_unlinks (now+15m)]
  B --> C[Cron /api/auth/unlink/process 1m]
  C -->|>= effective_at| D[Remover linked_accounts]
  D --> E[Marcar processed]
```


