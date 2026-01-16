const https = require('https');

// Tentar via página de about
const url = 'https://www.youtube.com/@waveigl/about';

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
  }
};

https.get(url, options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Tentar várias formas de extrair o channelId
    const patterns = [
      /"channelId":"([^"]+)"/,
      /"externalChannelId":"([^"]+)"/,
      /channel\/([UC][a-zA-Z0-9_-]{22})/,
      /"browseId":"([UC][a-zA-Z0-9_-]{22})"/
    ];
    
    for (const pattern of patterns) {
      const match = data.match(pattern);
      if (match) {
        console.log('Channel ID encontrado:', match[1]);
        return;
      }
    }
    
    // Se não encontrou, mostrar parte do HTML para debug
    console.log('Channel ID não encontrado');
    console.log('Tamanho do HTML:', data.length);
    
    // Procurar por UC (início de channel IDs)
    const ucMatch = data.match(/UC[a-zA-Z0-9_-]{22}/g);
    if (ucMatch) {
      console.log('Possíveis Channel IDs encontrados:', [...new Set(ucMatch)]);
    }
  });
}).on('error', err => console.error('Error:', err.message));
