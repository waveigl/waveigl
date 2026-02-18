---
description: Padrões de engenharia obrigatórios para todas as tarefas (Testes, Git e Validação)
---

# 🚀 Padronização de Desenvolvimento WaveIGL

Este documento define o caminho obrigatório que a Antigravity (e outros agentes) deve seguir em todas as tarefas deste repositório.

## 🧪 1. Testes Primeiro (Mandatário)
Sempre que uma correção ou functionalidade for implementada:
- **Criar Script de Verificação**: Deve ser criado um arquivo (ex: `verify-[feature].js`) para testar a lógica central.
- **Validar Estados**: Testar não apenas o caso de sucesso, mas também estados limítrofes (ex: Twitch offline vs online).
- **Sem Placeholders**: Nunca usar placeholders; os testes devem ser funcionais e executáveis no ambiente atual.

## 🔄 2. Recursividade e Validação Pré-Commit
Antes de considerar uma tarefa como "pronta":
- **Testes Locais**: Executar o script de verificação via terminal (`node ...`).
- **Prevenir Regressões**: Verificar se a nova mudança não quebra funções críticas (Dashboard, Autenticação).
- **Identificação de Erros Precoces**: O objetivo é falhar localmente antes que o código chegue ao Vercel ou Supabase.

## 📦 3. Workflow de Git (Atomic Commits)
Sempre que uma alteração for validada com sucesso:
// turbo-all
1. **Adicionar**: `git add .`
2. **Commit**: `git commit -m "[tipo]: [descrição clara em português/inglês]"`
   - Tipos sugeridos: `fix:`, `feat:`, `perf:`, `chore:`, `refactor:`
3. **Push**: `git push`

## 📡 4. Consciência de Infraestrutura
- **Supabase**: Sempre considerar o custo de queries e refresh de tabelas.
- **Twitch/Kick**: Respeitar limites de rate-limit e preferir o sinal da Twitch como mestre.
- **Vercel**: Evitar processos longos em rotas de API (timeout de 10s no plano free).

---
**Instrução para o Agente:** SEMPRE leia este arquivo no início de cada nova tarefa usando o comando `view_file`.
