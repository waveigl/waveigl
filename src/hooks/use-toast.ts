import { useState, useEffect } from 'react'

type ToastProps = {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function useToast() {
  // Placeholder simples se não houver sistema de toast completo
  const toast = (props: ToastProps) => {
    console.log('Toast:', props)
    // Aqui poderia despachar evento ou atualizar estado global
  }
  return { toast }
}

