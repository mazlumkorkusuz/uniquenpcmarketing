let cachedToken: { token: string; expiresAt: number } | null = null

export async function getTwitchToken(): Promise<string> {
  const clientId = process.env.TWITCH_CLIENT_ID
  const clientSecret = process.env.TWITCH_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Twitch credentials not configured')

  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token
  }

  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
    { method: 'POST' }
  )
  if (!res.ok) throw new Error('Failed to get Twitch token')
  const data = await res.json()
  cachedToken = { token: data.access_token as string, expiresAt: Date.now() + (data.expires_in as number) * 1000 }
  return cachedToken.token
}

export async function twitchHeaders(): Promise<Record<string, string>> {
  const clientId = process.env.TWITCH_CLIENT_ID
  if (!clientId) throw new Error('Twitch credentials not configured')
  const token = await getTwitchToken()
  return { 'Client-ID': clientId, Authorization: `Bearer ${token}` }
}
