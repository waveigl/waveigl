'use client'

import { FC, useState } from 'react'
import { AdminPanel } from '@/components/AdminPanel'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'

interface DashboardWithAdminProps {
  children: React.ReactNode
}

/**
 * Wrapper para dashboard que inclui botão de admin
 * O painel admin só aparece para Gabriel Toth
 */
export const DashboardWithAdmin: FC<DashboardWithAdminProps> = ({ children }) => {
  const [showAdminPanel, setShowAdminPanel] = useState(false)

  return (
    <div className="relative">
      {/* Conteúdo principal */}
      {children}

      {/* Botão flutuante de admin (só aparece para admin) */}
      <AdminPanelButton onClick={() => setShowAdminPanel(!showAdminPanel)} />

      {/* Painel admin (só renderiza para admin) */}
      {showAdminPanel && (
        <AdminPanel onClose={() => setShowAdminPanel(false)} />
      )}
    </div>
  )
}

/**
 * Botão flutuante para abrir painel admin
 * Só aparece para Gabriel Toth
 */
const AdminPanelButton: FC<{ onClick: () => void }> = ({ onClick }) => {
  const [isAdmin, setIsAdmin] = useState(false)
  const [checked, setChecked] = useState(false)

  // Verificar se é admin apenas uma vez
  if (!checked) {
    setChecked(true)
    fetch('/api/admin/verify')
      .then(r => r.json())
      .then(data => setIsAdmin(data.isAdmin))
      .catch(() => setIsAdmin(false))
  }

  if (!isAdmin) {
    return null
  }

  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition z-40"
      title="Painel Admin"
    >
      <Settings className="w-6 h-6" />
    </button>
  )
}
