'use client'

import { Button } from '@/components/ui/button'
import ShortLinksTab from '@/components/ShortLinksTab'

export default function LinksPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Links Curtos</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/auth/login'}>
              Login
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <ShortLinksTab />
      </main>
    </div>
  )
}
