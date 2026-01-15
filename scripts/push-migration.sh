#!/bin/bash

# ============================================================================
# Script para fazer push da migração para o Supabase
# ============================================================================
#
# INSTRUÇÕES:
# 1. Instale Supabase CLI: https://supabase.com/docs/guides/cli/getting-started
# 2. Execute: bash scripts/push-migration.sh
# 3. Pronto! A migração será executada automaticamente
#
# ============================================================================

echo "🔐 Fazendo push da migração para o Supabase..."
echo ""

# Verificar se supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não está instalado!"
    echo ""
    echo "Instale com:"
    echo "  npm install -g supabase"
    echo ""
    echo "Ou siga: https://supabase.com/docs/guides/cli/getting-started"
    exit 1
fi

echo "✅ Supabase CLI encontrado"
echo ""

# Fazer push da migração
echo "⏳ Enviando migração..."
supabase db push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migração enviada com sucesso!"
    echo ""
    echo "As tabelas foram criadas no seu banco de dados."
    echo ""
    echo "Próximos passos:"
    echo "1. Acesse: https://seu-site.com/admin/setup"
    echo "2. Siga o assistente para configurar sua senha"
    echo "3. Pronto! 🎉"
else
    echo ""
    echo "❌ Erro ao enviar migração"
    echo ""
    echo "Verifique:"
    echo "1. Se você está logado no Supabase: supabase login"
    echo "2. Se o projeto está vinculado: supabase link"
    echo "3. Se a migração está no diretório correto"
fi
