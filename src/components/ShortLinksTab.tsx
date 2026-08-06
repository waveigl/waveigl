'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Copy,
  ExternalLink,
  Plus,
  CheckCircle2,
  Trash2,
  Link2,
  Pencil,
} from 'lucide-react'
import type { ShortLink } from '@/types/short-link.types'

export default function ShortLinksTab() {
  const [links, setLinks] = useState<ShortLink[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [originalUrl, setOriginalUrl] = useState('')
  const [description, setDescription] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('dev-user-001')

  const [editingLink, setEditingLink] = useState<ShortLink | null>(null)
  const [editUrl, setEditUrl] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    fetchLinks()
    fetchCurrentUserId()
  }, [])

  const fetchCurrentUserId = async () => {
    try {
      const response = await fetch('/api/me')
      const data = await response.json()
      if (data.user?.id) {
        setCurrentUserId(data.user.id)
      }
    } catch (error) {
      console.error('[ShortLinksTab] Error fetching current user:', error)
    }
  }

  const fetchLinks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/short-links')
      const data = await response.json()
      if (data.success) {
        setLinks(data.data)
      }
    } catch (error) {
      console.error('[ShortLinksTab] Error fetching links:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/r/${token}`
    navigator.clipboard.writeText(url)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const handleCreate = async () => {
    if (!originalUrl.trim()) {
      setUrlError('Informe a URL original')
      return
    }

    try {
      setIsSubmitting(true)
      setUrlError(null)
      const response = await fetch('/api/short-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalUrl: originalUrl.trim(),
          description: description.trim() || undefined,
          createdBy: currentUserId,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        setUrlError(data.error || 'Erro ao criar link')
        return
      }

      setOriginalUrl('')
      setDescription('')
      setShowForm(false)
      await fetchLinks()
    } catch (error) {
      console.error('[ShortLinksTab] Error creating link:', error)
      setUrlError('Erro ao criar link')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este link curto?')) return

    try {
      const response = await fetch('/api/short-links', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, deletedBy: currentUserId }),
      })
      if (response.ok) {
        await fetchLinks()
      }
    } catch (error) {
      console.error('[ShortLinksTab] Error deleting link:', error)
    }
  }

  const openEdit = (link: ShortLink) => {
    setEditingLink(link)
    setEditUrl(link.originalUrl)
    setEditDescription(link.description || '')
    setEditError(null)
  }

  const handleUpdate = async () => {
    if (!editingLink) return

    try {
      setIsEditing(true)
      setEditError(null)
      const response = await fetch('/api/short-links', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingLink.id,
          originalUrl: editUrl.trim(),
          description: editDescription.trim() || undefined,
          updatedBy: currentUserId,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        setEditError(data.error || 'Erro ao atualizar link')
        return
      }

      setEditingLink(null)
      await fetchLinks()
    } catch (error) {
      console.error('[ShortLinksTab] Error updating link:', error)
      setEditError('Erro ao atualizar link')
    } finally {
      setIsEditing(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando links...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Links Curtos</h2>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="w-4 h-4 mr-1" />
          {showForm ? 'Cancelar' : 'Encurtar URL'}
        </Button>
      </div>

      {showForm && (
        <Card className="bg-card border-border mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="original-url">URL original</Label>
              <Input
                id="original-url"
                placeholder="https://example.com/pagina-longa..."
                value={originalUrl}
                onChange={(e) => {
                  setOriginalUrl(e.target.value)
                  setUrlError(null)
                }}
              />
              {urlError && <p className="text-sm text-red-500">{urlError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="short-link-description">Descrição (opcional)</Label>
              <Textarea
                id="short-link-description"
                placeholder="Identifique onde esse link será usado..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting ? 'Criando...' : 'Criar link curto'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {links.length === 0 ? (
        <Card className="bg-card/50 border border-border">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              Nenhum link curto criado ainda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {links.map((link) => {
            const shortUrl = `${window.location.origin}/r/${link.token}`
            return (
              <Card key={link.id} className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <a
                        href={shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 font-mono text-primary text-sm break-all hover:underline"
                      >
                        <Link2 className="w-4 h-4 shrink-0" />
                        {shortUrl}
                      </a>
                      <p className="mt-1 text-sm text-muted-foreground break-all">
                        {link.originalUrl}
                      </p>
                      {link.description && (
                        <p className="mt-1 text-xs text-muted-foreground">{link.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Editar"
                        onClick={() => openEdit(link)}
                      >
                        <Pencil className="w-4 h-4 text-yellow-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Copiar"
                        onClick={() => copyToClipboard(link.token)}
                      >
                        {copiedToken === link.token ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" title="Abrir" asChild>
                        <a href={shortUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Excluir"
                        onClick={() => handleDelete(link.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {link.clicks} clique{link.clicks === 1 ? '' : 's'}
                    </span>
                    <span>Criado em: {new Date(link.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={!!editingLink} onOpenChange={(open) => !open && setEditingLink(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Editar Link Curto</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-original-url">URL original</Label>
              <Input
                id="edit-original-url"
                placeholder="https://example.com/pagina-longa..."
                value={editUrl}
                onChange={(e) => {
                  setEditUrl(e.target.value)
                  setEditError(null)
                }}
              />
              {editError && <p className="text-sm text-red-500">{editError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-short-link-description">Descrição (opcional)</Label>
              <Textarea
                id="edit-short-link-description"
                placeholder="Identifique onde esse link será usado..."
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              A URL não pode conter espaços nem se repetir em outro link.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingLink(null)}
              disabled={isEditing}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={isEditing}>
              {isEditing ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
