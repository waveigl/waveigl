# ============================================================================
# Script para fazer push da migração para o Supabase (Windows)
# ============================================================================
#
# INSTRUÇÕES:
# 1. Instale Supabase CLI: https://supabase.com/docs/guides/cli/getting-started
# 2. Execute: powershell -ExecutionPolicy Bypass -File scripts/push-migration.ps1
# 3. Pronto! A migração será executada automaticamente
#
# ============================================================================

Write-Host "🔐 Fazendo push da migração para o Supabase..." -ForegroundColor Cyan
Write-Host ""

# Verificar se supabase CLI está instalado
$supabaseCmd = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseCmd) {
    Write-Host "❌ Supabase CLI não está instalado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Instale com:" -ForegroundColor Yellow
    Write-Host "  npm install -g supabase" -ForegroundColor White
    Write-Host ""
    Write-Host "Ou siga: https://supabase.com/docs/guides/cli/getting-started" -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ Supabase CLI encontrado" -ForegroundColor Green
Write-Host ""

# Fazer push da migração
Write-Host "⏳ Enviando migração..." -ForegroundColor Yellow
supabase db push

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migração enviada com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "As tabelas foram criadas no seu banco de dados." -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Cyan
    Write-Host "1. Acesse: https://seu-site.com/admin/setup" -ForegroundColor White
    Write-Host "2. Siga o assistente para configurar sua senha" -ForegroundColor White
    Write-Host "3. Pronto! 🎉" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Erro ao enviar migração" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifique:" -ForegroundColor Yellow
    Write-Host "1. Se você está logado no Supabase: supabase login" -ForegroundColor White
    Write-Host "2. Se o projeto está vinculado: supabase link" -ForegroundColor White
    Write-Host "3. Se a migração está no diretório correto" -ForegroundColor White
}
