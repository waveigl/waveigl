```mermaid
erDiagram
  USERS ||--o{ LINKED_ACCOUNTS : has
  USERS {
    UUID id PK
    TEXT email
  }
  LINKED_ACCOUNTS {
    UUID id PK
    UUID user_id FK
    TEXT platform
    TEXT platform_user_id
    TEXT platform_username
  }
```


