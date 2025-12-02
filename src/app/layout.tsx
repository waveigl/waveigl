import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WaveIGL - Clube Exclusivo de Membros | R$9,90/mês',
  description: 'Entre para o Clube do WaveIGL e tenha acesso a conteúdo exclusivo, chat unificado e comunidade VIP por apenas R$9,90 por mês.',
  keywords: ['WaveIGL', 'Wave', 'clube de membros', 'streaming', 'comunidade'],
  openGraph: {
    title: 'WaveIGL - Clube Exclusivo',
    description: 'Clube com chat unificado Twitch, YouTube e Kick',
    images: ['/og-image.jpg'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WaveIGL - Clube Exclusivo',
    description: 'Entre para o clube por R$9,90/mês',
  },
  robots: 'index, follow',
  alternates: {
    canonical: 'https://waveigl.com'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "WaveIGL",
              "alternateName": "Wave",
              "url": "https://waveigl.com",
              "logo": "https://waveigl.com/logo.png",
              "sameAs": [
                "https://twitch.tv/waveigl",
                "https://youtube.com/@waveigl",
                "https://kick.com/waveigloficial"
              ],
              "offers": {
                "@type": "Offer",
                "price": "9.90",
                "priceCurrency": "BRL",
                "availability": "https://schema.org/InStock",
                "description": "Assinatura mensal do Clube WaveIGL"
              }
            })
          }}
        />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
