import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const siteConfig = {
  name: 'WaveIGL',
  description: 'Entre para o Clube do WaveIGL e tenha acesso a conteúdo exclusivo, chat unificado e comunidade VIP. Aprenda CS2 com quem foi Top 9 nacional.',
  url: process.env.NEXT_PUBLIC_BASE_URL || 'https://waveigl.com',
  ogImage: '/og-image.jpg',
  creator: 'Conrado Koerich',
  twitterHandle: '@waveigl',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: 'WaveIGL - Clube Exclusivo de Membros | Aprenda CS2',
    template: '%s | WaveIGL'
  },
  description: siteConfig.description,
  keywords: [
    'WaveIGL', 'Wave', 'clube de membros', 'streaming', 'comunidade', 
    'CS2', 'Counter-Strike 2', 'Counter-Strike', 'aulas CS2', 'professor CS2',
    'Twitch', 'streamer brasileiro', 'gaming', 'esports', 'BlackBelt CSGO'
  ],
  authors: [{ name: siteConfig.creator, url: siteConfig.url }],
  creator: siteConfig.creator,
  publisher: siteConfig.name,
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteConfig.url,
    title: 'WaveIGL - Clube Exclusivo de Membros',
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: 'WaveIGL - Clube Exclusivo de CS2',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WaveIGL - Clube Exclusivo de Membros',
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: siteConfig.twitterHandle,
    site: siteConfig.twitterHandle,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteConfig.url,
    languages: {
      'pt-BR': siteConfig.url,
    },
  },
  category: 'gaming',
  verification: {
    // Adicione quando tiver os códigos de verificação
    // google: 'seu-codigo-google',
    // yandex: 'seu-codigo-yandex',
  },
  other: {
    'fb:app_id': '', // Adicione seu Facebook App ID se tiver
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#E38817' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0B0F' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

// JSON-LD Schemas
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${siteConfig.url}/#organization`,
  "name": "WaveIGL",
  "alternateName": ["Wave", "WaveIGL Clube", "BlackBelt CSGO"],
  "url": siteConfig.url,
  "logo": {
    "@type": "ImageObject",
    "url": `${siteConfig.url}/waveigl.webp`,
    "width": 512,
    "height": 512
  },
  "image": `${siteConfig.url}/og-image.jpg`,
  "description": siteConfig.description,
  "founder": {
    "@type": "Person",
    "name": "Conrado Koerich",
    "alternateName": "WaveIGL",
    "jobTitle": "Streamer e Professor de CS2",
    "sameAs": [
      "https://twitch.tv/waveigl",
      "https://youtube.com/@waveigl",
      "https://instagram.com/waveigl"
    ]
  },
  "foundingDate": "2017",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Florianópolis",
    "addressRegion": "SC",
    "addressCountry": "BR"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "csgoblackbelt@gmail.com",
    "contactType": "customer service",
    "availableLanguage": "Portuguese"
  },
  "sameAs": [
    "https://twitch.tv/waveigl",
    "https://youtube.com/@waveigl",
    "https://kick.com/waveigloficial",
    "https://instagram.com/waveigl",
    "https://tiktok.com/@waveigloficial",
    "https://facebook.com/waveigl",
    "https://kwai.com/@waveigl"
  ]
}

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteConfig.url}/#website`,
  "url": siteConfig.url,
  "name": "WaveIGL",
  "description": siteConfig.description,
  "publisher": {
    "@id": `${siteConfig.url}/#organization`
  },
  "inLanguage": "pt-BR"
}

const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Clube WaveIGL",
  "description": "Assinatura mensal do Clube WaveIGL com acesso a chat unificado, Discord VIP, aulas de CS2 e sorteios exclusivos",
  "brand": {
    "@type": "Brand",
    "name": "WaveIGL"
  },
  "offers": {
    "@type": "Offer",
    "price": "9.90",
    "priceCurrency": "BRL",
    "availability": "https://schema.org/InStock",
    "priceValidUntil": "2025-12-31",
    "url": `${siteConfig.url}/auth/login`,
    "seller": {
      "@id": `${siteConfig.url}/#organization`
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "400",
    "bestRating": "5",
    "worstRating": "1"
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
        {/* Preconnect to important domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/favicon.webp" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationSchema, websiteSchema, productSchema])
          }}
        />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
