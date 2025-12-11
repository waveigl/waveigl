import { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://waveigl.com'

export const metadata: Metadata = {
  title: 'Clube WaveIGL - Aulas de CS2 por R$9,90/mês',
  description: 'Clube WaveIGL: O mesmo conhecimento das aulas particulares de R$149 por apenas R$9,90/mês. Discord VIP, aulas ao vivo exclusivas. Início em 01/01/2026.',
  keywords: [
    'Clube WaveIGL', 'aulas CS2', 'curso CS2', 'aprender CS2', 'professor CS2',
    'Discord VIP', 'aulas ao vivo', 'WaveIGL', 'Counter-Strike 2'
  ],
  openGraph: {
    title: 'Clube WaveIGL - Aulas de CS2 por R$9,90/mês',
    description: 'O mesmo conhecimento das aulas particulares de R$149 por apenas R$9,90/mês. Discord VIP, aulas ao vivo exclusivas.',
    url: `${siteUrl}/clube-do-waveigl`,
    type: 'website',
    images: [
      {
        url: '/og-clube.jpg',
        width: 1200,
        height: 630,
        alt: 'Clube WaveIGL - Aulas de CS2',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clube WaveIGL - Aulas de CS2 por R$9,90/mês',
    description: 'O mesmo conhecimento das aulas particulares de R$149 por apenas R$9,90/mês. Início em 01/01/2026.',
    images: ['/og-clube.jpg'],
  },
  alternates: {
    canonical: `${siteUrl}/clube-do-waveigl`,
  },
}

// JSON-LD Schema para Product/Service
const clubeSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Clube WaveIGL",
  "description": "Comunidade exclusiva de aprendizado de CS2 com aulas ao vivo no Discord VIP. O mesmo conhecimento das aulas particulares por uma fração do preço.",
  "brand": {
    "@type": "Brand",
    "name": "WaveIGL"
  },
  "offers": [
    {
      "@type": "Offer",
      "name": "Clube Mensal",
      "price": "9.90",
      "priceCurrency": "BRL",
      "availability": "https://schema.org/PreOrder",
      "validFrom": "2026-01-01"
    },
    {
      "@type": "Offer",
      "name": "Clube Vitalício",
      "price": "499.00",
      "priceCurrency": "BRL",
      "availability": "https://schema.org/PreOrder",
      "validFrom": "2026-01-01"
    }
  ],
  "provider": {
    "@type": "Person",
    "name": "WaveIGL",
    "url": siteUrl
  }
}

export default function ClubeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(clubeSchema)
        }}
      />
      {children}
    </>
  )
}

