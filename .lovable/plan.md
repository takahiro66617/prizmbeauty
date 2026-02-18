

## Problem Root Cause

The edge function `line-auth` is querying a table called **`influencer_profiles`** on the external Supabase database, but the actual table name on that external database is **`influencers`**.

Edge function log error:
```
Could not find the table 'public.influencer_profiles' in the schema cache
Hint: Perhaps you meant the table 'public.influencers'
```

## Fix

### 1. Update the edge function `supabase/functions/line-auth/index.ts`

Change the table name from `influencer_profiles` to `influencers`:

```
// Before
.from("influencer_profiles")

// After
.from("influencers")
```

The `line_user_id` column and other fields (`name`, `image_url`, etc.) should also be verified against the actual `influencers` table schema on the external database. If column names differ, those will need updating too.

### 2. Verify other external hooks

The following hooks also query `influencer_profiles` on the external Supabase via `supabaseExternal`:
- `src/hooks/useExternalInfluencers.ts`
- `src/hooks/useExternalApplications.ts`

These also need to be updated to use the correct table name `influencers` to prevent similar errors elsewhere in the app.

## Summary of Changes

| File | Change |
|------|--------|
| `supabase/functions/line-auth/index.ts` | Change `influencer_profiles` to `influencers` |
| `src/hooks/useExternalInfluencers.ts` | Change `influencer_profiles` to `influencers` |
| `src/hooks/useExternalApplications.ts` | Change `influencer_profiles` join reference to `influencers` |

