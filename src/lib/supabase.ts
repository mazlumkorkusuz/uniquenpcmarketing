import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function getClient(): SupabaseClient {
  if (!_client) {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    const url = isValidUrl(rawUrl) ? rawUrl : 'https://placeholder.supabase.co'
    const key = rawKey.length > 10 ? rawKey : 'placeholder-anon-key'
    _client = createClient(url, key)
  }
  return _client
}

// Proxy so `supabase.from(...)` still works but client is only created on first call
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop: string) {
    const client = getClient()
    const val = client[prop as keyof SupabaseClient]
    return typeof val === 'function' ? val.bind(client) : val
  },
})

export type Database = {
  public: {
    Tables: {
      budget_expenses: {
        Row: {
          id: string
          created_at: string
          title: string
          amount: number
          category: string
          date: string
          description?: string
          platform?: string
          status?: string
        }
      }
      budget_settings: {
        Row: {
          id: string
          created_at: string
          monthly_budget: number
          year: number
          month: number
          currency?: string
          notes?: string
        }
      }
      crm_platforms: {
        Row: {
          id: string
          created_at: string
          name: string
          type?: string
          website?: string
          contact_name?: string
          contact_email?: string
          contact_phone?: string
          status?: string
          notes?: string
        }
      }
      curators: {
        Row: {
          id: string
          created_at: string
          name: string
          platform?: string
          followers?: number
          email?: string
          website?: string
          genre?: string
          status?: string
          notes?: string
        }
      }
      kick_streamers: {
        Row: {
          id: string
          created_at: string
          username: string
          channel_name?: string
          followers?: number
          avg_viewers?: number
          language?: string
          status?: string
          contact_email?: string
          notes?: string
        }
      }
      marketing_data: {
        Row: {
          id: string
          created_at: string
          platform: string
          metric_name: string
          metric_value: number
          date: string
          campaign?: string
          notes?: string
        }
      }
      meeting_notes: {
        Row: {
          id: string
          created_at: string
          meeting_id: string
          content: string
          author?: string
        }
      }
      meetings: {
        Row: {
          id: string
          created_at: string
          title: string
          date: string
          time?: string
          platform?: string
          attendees?: string
          agenda?: string
          status?: string
          notes?: string
        }
      }
      notes: {
        Row: {
          id: string
          created_at: string
          title: string
          content: string
          category?: string
          tags?: string
          author?: string
          updated_at?: string
        }
      }
      publishers: {
        Row: {
          id: string
          created_at: string
          name: string
          website?: string
          contact_name?: string
          contact_email?: string
          genre?: string
          region?: string
          status?: string
          deal_type?: string
          notes?: string
        }
      }
      reddit_account_stats: {
        Row: {
          id: string
          created_at: string
          account_id: string
          karma?: number
          post_karma?: number
          comment_karma?: number
          followers?: number
          date: string
        }
      }
      reddit_accounts: {
        Row: {
          id: string
          created_at: string
          username: string
          karma?: number
          created?: string
          status?: string
          subreddits?: string
          notes?: string
        }
      }
      reddit_posts: {
        Row: {
          id: string
          created_at: string
          account_id?: string
          title: string
          subreddit: string
          url?: string
          upvotes?: number
          comments?: number
          posted_at?: string
          status?: string
          notes?: string
        }
      }
      reddit_shared_posts: {
        Row: {
          id: string
          created_at: string
          post_id?: string
          platform?: string
          shared_at?: string
          engagement?: number
          notes?: string
        }
      }
      social_posts: {
        Row: {
          id: string
          created_at: string
          platform: string
          content: string
          media_url?: string
          scheduled_at?: string
          posted_at?: string
          status?: string
          likes?: number
          shares?: number
          comments?: number
          campaign?: string
        }
      }
      soop_streamers: {
        Row: {
          id: string
          created_at: string
          username: string
          channel_name?: string
          followers?: number
          avg_viewers?: number
          language?: string
          status?: string
          contact_email?: string
          notes?: string
        }
      }
      streamer_comments: {
        Row: {
          id: string
          created_at: string
          streamer_id: string
          streamer_type: string
          comment: string
          author?: string
          sentiment?: string
        }
      }
      streamer_favorites: {
        Row: {
          id: string
          created_at: string
          streamer_id: string
          streamer_type: string
          added_by?: string
          notes?: string
        }
      }
      streamer_tracking: {
        Row: {
          id: string
          created_at: string
          streamer_id: string
          streamer_type: string
          status?: string
          priority?: string
          assigned_to?: string
          last_contact?: string
          next_action?: string
          notes?: string
        }
      }
      twitch_streamers: {
        Row: {
          id: string
          created_at: string
          username: string
          display_name?: string
          followers?: number
          avg_viewers?: number
          language?: string
          game?: string
          status?: string
          contact_email?: string
          notes?: string
        }
      }
      twitter_accounts: {
        Row: {
          id: string
          created_at: string
          username: string
          display_name?: string
          followers?: number
          following?: number
          tweets?: number
          status?: string
          notes?: string
        }
      }
      twitter_notes: {
        Row: {
          id: string
          created_at: string
          account_id?: string
          content: string
          author?: string
          tags?: string
        }
      }
      youtube_channels: {
        Row: {
          id: string
          created_at: string
          channel_name: string
          channel_id?: string
          subscribers?: number
          avg_views?: number
          language?: string
          genre?: string
          status?: string
          contact_email?: string
          notes?: string
        }
      }
      youtube_notes: {
        Row: {
          id: string
          created_at: string
          channel_id?: string
          content: string
          author?: string
          tags?: string
        }
      }
    }
  }
}
