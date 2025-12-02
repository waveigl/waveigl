```mermaid
flowchart TD
  A[Solicitar desvinculação] --> B[Cria pending_unlinks]
  B --> C[effective_at = now()+15m]
  C --> D{Cron}
  D -->|agora >= effective_at| E[Remove de linked_accounts]
  E --> F[status=processed, processed_at]
```


