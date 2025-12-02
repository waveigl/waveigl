```mermaid
flowchart TD
  A[Inicia OAuth] --> B[Troca code por tokens]
  B --> C[Busca/Cria user]
  C --> D[Upsert linked_accounts on (user_id, platform)]
  D --> E[Cria sessão]
  E --> F[Redirect dashboard]
```


