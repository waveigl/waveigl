import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chat - WaveIGL',
  description: 'Chat unificado do WaveIGL',
}

export default function ChatPopupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

