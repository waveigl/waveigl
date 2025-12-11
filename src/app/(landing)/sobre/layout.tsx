import { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://waveigl.com'

export const metadata: Metadata = {
  title: 'Sobre WaveIGL - Conrado Koerich | História e Trajetória',
  description: 'Conheça a história do WaveIGL (Conrado Koerich): Professor de CS2 com mais de 35k de horas, com alunos que jogaram MUNDIAL.',
  keywords: [
    'WaveIGL', 'Conrado Koerich', 'streamer CS2', 'professor CS2', 'aulas CS2',
    '35k horas', 'Giuzinha', 'Florianópolis', 'streamer brasileiro', 'Twitch Brasil'
  ],
  openGraph: {
    title: 'Sobre WaveIGL - Conrado Koerich',
    description: 'Professor de CS2 com 35k+ horas de jogo. Aluna Giuzinha conquistou Top 5 Mundial pela Team Brazil.',
    url: `${siteUrl}/sobre`,
    type: 'profile',
    images: [
      {
        url: '/og-sobre.jpg',
        width: 1200,
        height: 630,
        alt: 'WaveIGL - Conrado Koerich',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sobre WaveIGL - Conrado Koerich',
    description: 'Professor de CS2 com 35k+ horas de jogo. Aluna Giuzinha conquistou Top 5 Mundial pela Team Brazil.',
    images: ['/og-sobre.jpg'],
  },
  alternates: {
    canonical: `${siteUrl}/sobre`,
  },
}

// JSON-LD Schema para Person
const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Conrado Koerich",
  "alternateName": ["WaveIGL", "Wave", "DJ Hope"],
  "url": `${siteUrl}/sobre`,
  "image": `${siteUrl}/images/waveigl_profile.webp`,
  "description": "Streamer e professor de CS2 brasileiro com 35k+ horas de jogo. Formou a aluna Giuzinha, Top 5 Mundial pela Team Brazil.",
  "jobTitle": "Streamer e Professor de CS2",
  "birthDate": "1984-11-12",
  "birthPlace": {
    "@type": "Place",
    "name": "Florianópolis, Santa Catarina, Brasil"
  },
  "nationality": "Brazilian",
  "knowsAbout": ["Counter-Strike 2", "Counter-Strike 1.6", "Streaming", "Gaming", "DJing"],
  "sameAs": [
    "https://twitch.tv/waveigl",
    "https://youtube.com/@waveigl",
    "https://instagram.com/waveigl",
    "https://kick.com/waveigloficial",
    "https://tiktok.com/@waveigloficial",
    "https://facebook.com/waveigl"
  ],
  "worksFor": {
    "@type": "Organization",
    "name": "Clube WaveIGL"
  }
}

export default function SobreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personSchema)
        }}
      />
      {children}
    </>
  )
}

