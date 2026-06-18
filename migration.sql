-- ============================================================
-- Unique NPC Marketing Dashboard — Full Database Migration
-- Run once in the Supabase SQL Editor
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================

create extension if not exists "uuid-ossp";


-- ============================================================
-- 1. CRM PLATFORMS
-- ============================================================

create table if not exists crm_platforms (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  type          text,
  contact_name  text,
  contact_email text,
  website       text,
  status        text not null default 'Aktif',
  created_at    timestamptz not null default now()
);


-- ============================================================
-- 2. MEETINGS
-- ============================================================

create table if not exists meetings (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  date        date,
  time        text,
  platform    text,
  attendees   text,
  notes       text,
  status      text not null default 'Planlandı',
  created_at  timestamptz not null default now()
);


-- ============================================================
-- 3. MEETING NOTES
-- ============================================================

create table if not exists meeting_notes (
  id          uuid primary key default gen_random_uuid(),
  meeting_id  uuid references meetings(id) on delete cascade,
  content     text,
  author      text,
  created_at  timestamptz not null default now()
);


-- ============================================================
-- 4. NOTES (General)
-- ============================================================

create table if not exists notes (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  content     text,
  category    text,
  tags        text,
  author      text,
  created_at  timestamptz not null default now()
);


-- ============================================================
-- 5. BUDGET EXPENSES
-- ============================================================

create table if not exists budget_expenses (
  id          uuid primary key default gen_random_uuid(),
  title       text,
  amount      numeric(14, 2) not null default 0,
  category    text,
  platform    text,
  date        date,
  status      text not null default 'Beklemede',
  description text,
  created_at  timestamptz not null default now()
);


-- ============================================================
-- 6. BUDGET SETTINGS
-- ============================================================

create table if not exists budget_settings (
  id             uuid primary key default gen_random_uuid(),
  year           integer,
  month          integer,
  monthly_budget numeric(14, 2) not null default 0,
  currency       text not null default 'USD',
  notes          text,
  created_at     timestamptz not null default now()
);


-- ============================================================
-- 7. PUBLISHERS
-- ============================================================

create table if not exists publishers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  platform      text,
  contact_name  text,
  contact_email text,
  website       text,
  status        text not null default 'Aktif',
  notes         text,
  created_at    timestamptz not null default now()
);


-- ============================================================
-- 8. CURATORS (Steam & other)
-- ============================================================

create table if not exists curators (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  platform    text,
  genre       text,
  followers   integer not null default 0,
  email       text,
  status      text not null default 'Aktif',
  created_at  timestamptz not null default now()
);


-- ============================================================
-- 9. TWITCH STREAMERS
-- ============================================================

create table if not exists twitch_streamers (
  id            uuid primary key default gen_random_uuid(),
  username      text,
  display_name  text,
  followers     integer not null default 0,
  avg_viewers   integer not null default 0,
  language      text,
  game          text,
  contact_email text,
  status        text not null default 'Aktif',
  created_at    timestamptz not null default now()
);


-- ============================================================
-- 10. KICK STREAMERS
-- ============================================================

create table if not exists kick_streamers (
  id            uuid primary key default gen_random_uuid(),
  username      text,
  channel_name  text,
  followers     integer not null default 0,
  avg_viewers   integer not null default 0,
  language      text,
  contact_email text,
  status        text not null default 'Aktif',
  created_at    timestamptz not null default now()
);


-- ============================================================
-- 11. SOOP STREAMERS
-- ============================================================

create table if not exists soop_streamers (
  id            uuid primary key default gen_random_uuid(),
  username      text,
  channel_name  text,
  followers     integer not null default 0,
  avg_viewers   integer not null default 0,
  language      text,
  contact_email text,
  status        text not null default 'Aktif',
  created_at    timestamptz not null default now()
);


-- ============================================================
-- 12. YOUTUBE CHANNELS
--     Used by both /yayincilar/youtube and /sosyal-medya/youtube
-- ============================================================

create table if not exists youtube_channels (
  id            uuid primary key default gen_random_uuid(),
  channel_name  text,
  username      text,
  subscribers   integer not null default 0,
  avg_views     integer not null default 0,
  language      text,
  genre         text,
  contact_email text,
  following     integer not null default 0,
  video_count   integer not null default 0,
  status        text not null default 'Aktif',
  created_at    timestamptz not null default now()
);


-- ============================================================
-- 13. NICONICO STREAMERS
-- ============================================================

create table if not exists niconico_streamers (
  id            uuid primary key default gen_random_uuid(),
  username      text,
  channel_name  text,
  followers     integer not null default 0,
  avg_viewers   integer not null default 0,
  language      text,
  contact_email text,
  status        text not null default 'Aktif',
  created_at    timestamptz not null default now()
);


-- ============================================================
-- 14. CHZZK STREAMERS
-- ============================================================

create table if not exists chzzk_streamers (
  id            uuid primary key default gen_random_uuid(),
  username      text,
  channel_name  text,
  followers     integer not null default 0,
  avg_viewers   integer not null default 0,
  language      text,
  contact_email text,
  status        text not null default 'Aktif',
  created_at    timestamptz not null default now()
);


-- ============================================================
-- 15. BILIBILI STREAMERS
-- ============================================================

create table if not exists bilibili_streamers (
  id            uuid primary key default gen_random_uuid(),
  username      text,
  channel_name  text,
  followers     integer not null default 0,
  avg_viewers   integer not null default 0,
  language      text,
  contact_email text,
  status        text not null default 'Aktif',
  created_at    timestamptz not null default now()
);


-- ============================================================
-- 16. DOUYIN STREAMERS
-- ============================================================

create table if not exists douyin_streamers (
  id            uuid primary key default gen_random_uuid(),
  username      text,
  channel_name  text,
  followers     integer not null default 0,
  avg_viewers   integer not null default 0,
  language      text,
  contact_email text,
  status        text not null default 'Aktif',
  created_at    timestamptz not null default now()
);


-- ============================================================
-- 17. REDDIT ACCOUNTS
-- ============================================================

create table if not exists reddit_accounts (
  id          uuid primary key default gen_random_uuid(),
  username    text not null,
  karma       integer not null default 0,
  subreddits  text,
  post_count  integer not null default 0,
  niche       text,
  status      text not null default 'Aktif',
  created     date,
  created_at  timestamptz not null default now()
);


-- ============================================================
-- 18. REDDIT POSTS
-- ============================================================

create table if not exists reddit_posts (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid references reddit_accounts(id) on delete set null,
  title       text,
  subreddit   text,
  upvotes     integer not null default 0,
  comments    integer not null default 0,
  status      text not null default 'Aktif',
  posted_at   timestamptz,
  url         text,
  created_at  timestamptz not null default now()
);


-- ============================================================
-- 19. REDDIT ACCOUNT STATS
-- ============================================================

create table if not exists reddit_account_stats (
  id            uuid primary key default gen_random_uuid(),
  account_id    uuid references reddit_accounts(id) on delete cascade,
  karma         integer not null default 0,
  post_karma    integer not null default 0,
  comment_karma integer not null default 0,
  followers     integer not null default 0,
  date          date,
  created_at    timestamptz not null default now()
);


-- ============================================================
-- 20. SOCIAL POSTS (multi-platform: Instagram, TikTok, Twitter, YouTube)
-- ============================================================

create table if not exists social_posts (
  id          uuid primary key default gen_random_uuid(),
  platform    text,
  content     text,
  status      text not null default 'Taslak',
  posted_at   timestamptz,
  likes       integer not null default 0,
  shares      integer not null default 0,
  comments    integer not null default 0,
  campaign    text,
  created_at  timestamptz not null default now()
);


-- ============================================================
-- 21. TWITTER ACCOUNTS
-- ============================================================

create table if not exists twitter_accounts (
  id           uuid primary key default gen_random_uuid(),
  username     text not null,
  display_name text,
  followers    integer not null default 0,
  following    integer not null default 0,
  tweets       integer not null default 0,
  post_count   integer not null default 0,
  status       text not null default 'Aktif',
  created_at   timestamptz not null default now()
);


-- ============================================================
-- 22. MARKETING DATA (metrics per platform)
-- ============================================================

create table if not exists marketing_data (
  id           uuid primary key default gen_random_uuid(),
  platform     text,
  metric_name  text,
  metric_value numeric(14, 2) not null default 0,
  date         date,
  campaign     text,
  created_at   timestamptz not null default now()
);


-- ============================================================
-- 23. STREAMER TRACKING (historical snapshots)
-- ============================================================

create table if not exists streamer_tracking (
  id           uuid primary key default gen_random_uuid(),
  platform     text not null,
  username     text not null,
  channel_name text,
  followers    integer not null default 0,
  avg_viewers  integer not null default 0,
  date         date,
  notes        text,
  created_at   timestamptz not null default now()
);


-- ============================================================
-- 24. STREAMER COMMENTS (internal notes per streamer)
-- ============================================================

create table if not exists streamer_comments (
  id           uuid primary key default gen_random_uuid(),
  platform     text,
  username     text,
  channel_name text,
  content      text,
  author       text,
  created_at   timestamptz not null default now()
);


-- ============================================================
-- 25. STREAMER FAVORITES
-- ============================================================

create table if not exists streamer_favorites (
  id           uuid primary key default gen_random_uuid(),
  platform     text not null,
  username     text not null,
  channel_name text,
  followers    integer not null default 0,
  language     text,
  added_by     text,
  notes        text,
  status       text not null default 'Aktif',
  created_at   timestamptz not null default now()
);


-- ============================================================
-- BONUS: tables referenced in app code but not in the list above
-- ============================================================

-- reddit_shared_posts  (used in /reddit page)
create table if not exists reddit_shared_posts (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid references reddit_posts(id) on delete set null,
  platform    text,
  engagement  integer not null default 0,
  shared_at   timestamptz,
  created_at  timestamptz not null default now()
);

-- twitter_notes  (used in /sosyal-medya/twitter page)
create table if not exists twitter_notes (
  id         uuid primary key default gen_random_uuid(),
  username   text,
  note       text,
  created_at timestamptz not null default now()
);

-- youtube_notes  (used in /yayincilar/youtube and /sosyal-medya/youtube pages)
create table if not exists youtube_notes (
  id           uuid primary key default gen_random_uuid(),
  channel_id   text,
  channel_name text,
  note         text,
  content      text,
  tags         text,
  author       text,
  created_at   timestamptz not null default now()
);

-- instagram_accounts  (used by Hesap Ekle modal on /sosyal-medya/instagram)
create table if not exists instagram_accounts (
  id         uuid primary key default gen_random_uuid(),
  username   text not null,
  followers  integer not null default 0,
  following  integer not null default 0,
  post_count integer not null default 0,
  status     text not null default 'Aktif',
  created_at timestamptz not null default now()
);

-- tiktok_accounts  (used by Hesap Ekle modal on /sosyal-medya/tiktok)
create table if not exists tiktok_accounts (
  id         uuid primary key default gen_random_uuid(),
  username   text not null,
  followers  integer not null default 0,
  following  integer not null default 0,
  post_count integer not null default 0,
  status     text not null default 'Aktif',
  created_at timestamptz not null default now()
);


-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_crm_platforms_status       on crm_platforms(status);
create index if not exists idx_crm_platforms_created_at   on crm_platforms(created_at desc);

create index if not exists idx_meetings_date              on meetings(date);
create index if not exists idx_meetings_status            on meetings(status);
create index if not exists idx_meetings_created_at        on meetings(created_at desc);

create index if not exists idx_meeting_notes_meeting_id   on meeting_notes(meeting_id);

create index if not exists idx_notes_category             on notes(category);
create index if not exists idx_notes_created_at           on notes(created_at desc);

create index if not exists idx_budget_expenses_date       on budget_expenses(date);
create index if not exists idx_budget_expenses_platform   on budget_expenses(platform);
create index if not exists idx_budget_expenses_status     on budget_expenses(status);

create index if not exists idx_budget_settings_year_month on budget_settings(year, month);

create index if not exists idx_curators_platform          on curators(platform);
create index if not exists idx_curators_status            on curators(status);

create index if not exists idx_twitch_streamers_followers  on twitch_streamers(followers  desc);
create index if not exists idx_kick_streamers_followers    on kick_streamers(followers    desc);
create index if not exists idx_soop_streamers_followers    on soop_streamers(followers    desc);
create index if not exists idx_youtube_channels_subs       on youtube_channels(subscribers desc);
create index if not exists idx_niconico_streamers_followers on niconico_streamers(followers desc);
create index if not exists idx_chzzk_streamers_followers   on chzzk_streamers(followers   desc);
create index if not exists idx_bilibili_streamers_followers on bilibili_streamers(followers desc);
create index if not exists idx_douyin_streamers_followers   on douyin_streamers(followers  desc);

create index if not exists idx_reddit_accounts_karma      on reddit_accounts(karma desc);
create index if not exists idx_reddit_posts_account_id    on reddit_posts(account_id);
create index if not exists idx_reddit_posts_subreddit     on reddit_posts(subreddit);
create index if not exists idx_reddit_posts_posted_at     on reddit_posts(posted_at desc);
create index if not exists idx_reddit_stats_account_id    on reddit_account_stats(account_id);
create index if not exists idx_reddit_stats_date          on reddit_account_stats(date desc);
create index if not exists idx_reddit_shared_post_id      on reddit_shared_posts(post_id);

create index if not exists idx_social_posts_platform      on social_posts(platform);
create index if not exists idx_social_posts_created_at    on social_posts(created_at desc);
create index if not exists idx_social_posts_campaign      on social_posts(campaign);

create index if not exists idx_twitter_accounts_followers  on twitter_accounts(followers desc);
create index if not exists idx_twitter_accounts_username   on twitter_accounts(username);

create index if not exists idx_marketing_data_platform    on marketing_data(platform);
create index if not exists idx_marketing_data_date        on marketing_data(date desc);
create index if not exists idx_marketing_data_campaign    on marketing_data(campaign);

create index if not exists idx_streamer_tracking_platform  on streamer_tracking(platform);
create index if not exists idx_streamer_tracking_username  on streamer_tracking(username);
create index if not exists idx_streamer_tracking_date      on streamer_tracking(date desc);

create index if not exists idx_streamer_comments_platform  on streamer_comments(platform);
create index if not exists idx_streamer_comments_username  on streamer_comments(username);

create index if not exists idx_streamer_favorites_platform on streamer_favorites(platform);
create index if not exists idx_streamer_favorites_status   on streamer_favorites(status);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table crm_platforms         enable row level security;
alter table meetings               enable row level security;
alter table meeting_notes          enable row level security;
alter table notes                  enable row level security;
alter table budget_expenses        enable row level security;
alter table budget_settings        enable row level security;
alter table publishers             enable row level security;
alter table curators               enable row level security;
alter table twitch_streamers       enable row level security;
alter table kick_streamers         enable row level security;
alter table soop_streamers         enable row level security;
alter table youtube_channels       enable row level security;
alter table niconico_streamers     enable row level security;
alter table chzzk_streamers        enable row level security;
alter table bilibili_streamers     enable row level security;
alter table douyin_streamers       enable row level security;
alter table reddit_accounts        enable row level security;
alter table reddit_posts           enable row level security;
alter table reddit_account_stats   enable row level security;
alter table reddit_shared_posts    enable row level security;
alter table social_posts           enable row level security;
alter table twitter_accounts       enable row level security;
alter table twitter_notes          enable row level security;
alter table youtube_notes          enable row level security;
alter table instagram_accounts     enable row level security;
alter table tiktok_accounts        enable row level security;
alter table marketing_data         enable row level security;
alter table streamer_tracking      enable row level security;
alter table streamer_comments      enable row level security;
alter table streamer_favorites     enable row level security;


-- ============================================================
-- RLS POLICIES — authenticated users have full access
-- (The server-side service-role key bypasses RLS automatically)
-- ============================================================

do $$
declare
  tbl  text;
  pname text;
  tables text[] := array[
    'crm_platforms','meetings','meeting_notes','notes',
    'budget_expenses','budget_settings','publishers','curators',
    'twitch_streamers','kick_streamers','soop_streamers','youtube_channels',
    'niconico_streamers','chzzk_streamers','bilibili_streamers','douyin_streamers',
    'reddit_accounts','reddit_posts','reddit_account_stats','reddit_shared_posts',
    'social_posts','twitter_accounts','twitter_notes','youtube_notes',
    'instagram_accounts','tiktok_accounts','marketing_data',
    'streamer_tracking','streamer_comments','streamer_favorites'
  ];
begin
  foreach tbl in array tables loop
    pname := 'auth_all_' || tbl;
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename  = tbl
        and policyname = pname
    ) then
      execute format(
        $pol$create policy %I on %I
             for all to authenticated
             using (true) with check (true)$pol$,
        pname, tbl
      );
    end if;
  end loop;
end $$;

-- İçerik Planlaması: social_media_posts table
CREATE TABLE IF NOT EXISTS social_media_posts (
  id             uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  platform       text         NOT NULL,
  title          text,
  content        text,
  scheduled_date date,
  scheduled_time time,
  status         text         NOT NULL DEFAULT 'Taslak',
  created_at     timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_smp_platform       ON social_media_posts(platform);
CREATE INDEX IF NOT EXISTS idx_smp_scheduled_date ON social_media_posts(scheduled_date);

ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'social_media_posts'
      AND policyname = 'auth_all_social_media_posts'
  ) THEN
    CREATE POLICY auth_all_social_media_posts ON social_media_posts
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
