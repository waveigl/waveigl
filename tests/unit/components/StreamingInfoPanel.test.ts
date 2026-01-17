import { describe, it, expect } from 'vitest'
import {
  TWITCH_CATEGORIES,
  YOUTUBE_CATEGORIES,
  KICK_CATEGORIES,
  LANGUAGES,
} from '@/types/streaming.types'

describe('Streaming Info Types', () => {
  describe('Categories', () => {
    it('deve ter categorias para Twitch', () => {
      expect(TWITCH_CATEGORIES.length).toBeGreaterThan(0)
      expect(TWITCH_CATEGORIES[0]).toHaveProperty('id')
      expect(TWITCH_CATEGORIES[0]).toHaveProperty('name')
    })

    it('deve ter categorias para YouTube', () => {
      expect(YOUTUBE_CATEGORIES.length).toBeGreaterThan(0)
      expect(YOUTUBE_CATEGORIES[0]).toHaveProperty('id')
      expect(YOUTUBE_CATEGORIES[0]).toHaveProperty('name')
    })

    it('deve ter categorias para Kick', () => {
      expect(KICK_CATEGORIES.length).toBeGreaterThan(0)
      expect(KICK_CATEGORIES[0]).toHaveProperty('id')
      expect(KICK_CATEGORIES[0]).toHaveProperty('name')
    })

    it('todas as categorias devem ter id e name únicos', () => {
      const allCategories = [...TWITCH_CATEGORIES, ...YOUTUBE_CATEGORIES, ...KICK_CATEGORIES]
      const ids = allCategories.map(c => c.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })
  })

  describe('Languages', () => {
    it('deve ter pelo menos 10 idiomas', () => {
      expect(LANGUAGES.length).toBeGreaterThanOrEqual(10)
    })

    it('cada idioma deve ter code e name', () => {
      LANGUAGES.forEach(lang => {
        expect(lang).toHaveProperty('code')
        expect(lang).toHaveProperty('name')
        expect(typeof lang.code).toBe('string')
        expect(typeof lang.name).toBe('string')
      })
    })

    it('deve incluir português brasileiro', () => {
      const ptBr = LANGUAGES.find(l => l.code === 'pt-BR')
      expect(ptBr).toBeDefined()
      expect(ptBr?.name).toBe('Português (Brasil)')
    })

    it('deve incluir inglês americano', () => {
      const enUs = LANGUAGES.find(l => l.code === 'en-US')
      expect(enUs).toBeDefined()
      expect(enUs?.name).toBe('English (US)')
    })

    it('todos os códigos de idioma devem ser únicos', () => {
      const codes = LANGUAGES.map(l => l.code)
      const uniqueCodes = new Set(codes)
      expect(uniqueCodes.size).toBe(codes.length)
    })
  })

  describe('Validação de Dados', () => {
    it('categorias não devem ter nomes vazios', () => {
      const allCategories = [...TWITCH_CATEGORIES, ...YOUTUBE_CATEGORIES, ...KICK_CATEGORIES]
      allCategories.forEach(cat => {
        expect(cat.name.trim().length).toBeGreaterThan(0)
      })
    })

    it('categorias não devem ter ids vazios', () => {
      const allCategories = [...TWITCH_CATEGORIES, ...YOUTUBE_CATEGORIES, ...KICK_CATEGORIES]
      allCategories.forEach(cat => {
        expect(cat.id.trim().length).toBeGreaterThan(0)
      })
    })

    it('idiomas não devem ter codes vazios', () => {
      LANGUAGES.forEach(lang => {
        expect(lang.code.trim().length).toBeGreaterThan(0)
      })
    })

    it('idiomas não devem ter names vazios', () => {
      LANGUAGES.forEach(lang => {
        expect(lang.name.trim().length).toBeGreaterThan(0)
      })
    })
  })
})
