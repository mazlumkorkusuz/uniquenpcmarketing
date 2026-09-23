/// <reference lib="deno.ns" />
// Supabase Edge Function: fetch-kick-avatars
//
// Processes one batch of up to 50 kick_streamers rows whose profile_image_url
// is still null: looks each username up on Kick's public channel API, pulls
// user.profile_pic out of the response, and writes it back to the row.
//
// Trigger manually (see the admin button on /yayincilar/kick), or repeatedly,
// until `remaining` in the response reaches 0.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BATCH_SIZE = 50
const DELAY_MS = 1000

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Supabase credentials not configured for this function' }, 500)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { data: streamers, error: fetchError } = await supabase
    .from('kick_streamers')
    .select('id, username')
    .is('profile_image_url', null)
    .limit(BATCH_SIZE)

  if (fetchError) {
    return json({ error: fetchError.message }, 500)
  }

  const batch = streamers ?? []
  let updated = 0
  let failed = 0
  const errors: { username: string; reason: string }[] = []

  for (let i = 0; i < batch.length; i++) {
    const streamer = batch[i]
    try {
      const res = await fetch(`https://kick.com/api/v1/channels/${encodeURIComponent(streamer.username)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; UniqueNPCMarketingBot/1.0)',
          Accept: 'application/json',
        },
      })

      if (!res.ok) {
        failed++
        errors.push({ username: streamer.username, reason: `HTTP ${res.status}` })
      } else {
        const payload = await res.json()
        const profilePic: string | null = payload?.user?.profile_pic ?? null

        if (!profilePic) {
          failed++
          errors.push({ username: streamer.username, reason: 'No profile_pic in response' })
        } else {
          const { error: updateError } = await supabase
            .from('kick_streamers')
            .update({ profile_image_url: profilePic })
            .eq('id', streamer.id)

          if (updateError) {
            failed++
            errors.push({ username: streamer.username, reason: updateError.message })
          } else {
            updated++
          }
        }
      }
    } catch (err) {
      failed++
      errors.push({ username: streamer.username, reason: err instanceof Error ? err.message : 'Unknown error' })
    }

    if (i < batch.length - 1) {
      await sleep(DELAY_MS)
    }
  }

  const { count: remaining } = await supabase
    .from('kick_streamers')
    .select('id', { count: 'exact', head: true })
    .is('profile_image_url', null)

  return json({
    processed: batch.length,
    updated,
    failed,
    remaining: remaining ?? 0,
    errors: errors.slice(0, 10),
  })
})
