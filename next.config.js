/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static-cdn.jtvnw.net',
      },
      {
        protocol: 'https',
        hostname: 'yt3.ggpht.com',
      },
      {
        protocol: 'https',
        hostname: 'kick.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  // Configuração vazia do Turbopack para silenciar o aviso do Next.js 16
  // A maioria das aplicações funciona bem sem configuração específica
  turbopack: {},
  // Configuração do Webpack para módulos nativos (fallback caso use --webpack)
  webpack: (config, { isServer }) => {
    // Evitar bundle de módulos nativos opcionais usados por discord.js/@discordjs/ws
    config.externals = config.externals || []
    if (isServer) {
      config.externals.push({
        'bufferutil': 'commonjs bufferutil',
        'utf-8-validate': 'commonjs utf-8-validate',
        'zlib-sync': 'commonjs zlib-sync'
      })
    }
    return config
  },
}

module.exports = nextConfig
