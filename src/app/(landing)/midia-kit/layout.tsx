import { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://waveigl.com'

export const metadata: Metadata = {
  title: 'Mídia Kit WaveIGL - Anuncie para 2M+ Views/mês',
  description: 'Mídia Kit oficial do WaveIGL. Alcance uma audiência de 2M+ views mensais, 497k+ seguidores. Dados demográficos, formatos de anúncio e contato comercial.',
  keywords: [
    'mídia kit', 'WaveIGL mídia kit', 'anunciar streamer', 'publicidade gaming',
    'influencer CS2', 'patrocínio streamer', 'marketing gaming', 'anúncio Twitch'
  ],
  openGraph: {
    title: 'Mídia Kit WaveIGL - Anuncie para Gamers',
    description: 'Alcance 2M+ views mensais e 497k+ seguidores. Mídia Kit oficial com dados demográficos e formatos de anúncio.',
    url: `${siteUrl}/midia-kit`,
    type: 'website',
    images: [
      {
        url: '/og-midia-kit.jpg',
        width: 1200,
        height: 630,
        alt: 'WaveIGL Mídia Kit - Anuncie para Gamers',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mídia Kit WaveIGL - Anuncie para Gamers',
    description: 'Alcance 2M+ views mensais e 497k+ seguidores. Contato: csgoblackbelt@gmail.com',
    images: ['/og-midia-kit.jpg'],
  },
  alternates: {
    canonical: `${siteUrl}/midia-kit`,
  },
}

// JSON-LD Schema para Service (Publicidade)
const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Publicidade WaveIGL",
  "description": "Serviços de publicidade e patrocínio com o streamer WaveIGL. Formatos incluem overlay na live, menções ao vivo, posts em redes sociais, vídeos dedicados e sorteios patrocinados.",
  "provider": {
    "@type": "Person",
    "name": "WaveIGL",
    "url": `${siteUrl}/sobre`
  },
  "serviceType": "Influencer Marketing",
  "areaServed": {
    "@type": "Country",
    "name": "Brazil"
  },
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "BRL",
    "availability": "https://schema.org/InStock",
    "offerCount": "6"
  },
  "audience": {
    "@type": "Audience",
    "audienceType": "Gamers",
    "geographicArea": {
      "@type": "Country",
      "name": "Brazil"
    }
  }
}

export default function MidiaKitLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceSchema)
        }}
      />
      {children}
    </>
  )
}

