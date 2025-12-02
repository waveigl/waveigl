import { http, HttpResponse } from 'msw'

export const handlers = [
  // Example: Google OAuth token endpoint mock
  http.post('https://oauth2.googleapis.com/token', () => {
    return HttpResponse.json({
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600,
      token_type: 'Bearer'
    })
  }),

  // Example: Google userinfo mock
  http.get('https://www.googleapis.com/oauth2/v2/userinfo', () => {
    return HttpResponse.json({
      id: '123',
      email: 'user@example.com',
      name: 'User Example'
    })
  })
]


