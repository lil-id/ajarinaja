# Supabase Keys Guide for Lovable Projects

## Environment Variables Mapping

### Frontend (.env)
Your project already has these from Lovable:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Edge Functions (.env.local)
You need to create this for Edge Functions:
```env
SUPABASE_URL=https://your-project.supabase.co           # Same as VITE_SUPABASE_URL
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...      # Same as VITE_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5... # Get from Dashboard
GEMINI_API_KEY=your-gemini-api-key                      # Get from AI Studio
```

## How to Get Service Role Key

1. Go to **Supabase Dashboard** (https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Under "Project API keys", find:
   - ✅ `anon` `public` - You already have this (VITE_SUPABASE_ANON_KEY)
   - ⚠️ `service_role` `secret` - **Copy this for Edge Functions**

**IMPORTANT**: 
- ⚠️ **NEVER** commit service_role key to git
- ⚠️ **NEVER** use service_role key in frontend
- ⚠️ Only use in Edge Functions (server-side)

## Security Best Practices

### Frontend (Browser)
```typescript
// ✅ SAFE - Uses anon key
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### Edge Functions (Server)
```typescript
// ✅ SAFE - Uses service role key (server-side only)
const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
);
```

## Quick Setup

1. **Copy your existing values**:
   ```bash
   # From your .env file
   SUPABASE_URL=$(grep VITE_SUPABASE_URL .env | cut -d '=' -f2)
   SUPABASE_ANON_KEY=$(grep VITE_SUPABASE_ANON_KEY .env | cut -d '=' -f2)
   ```

2. **Get service role key**:
   - Dashboard → Settings → API → Copy `service_role` key

3. **Create Edge Functions env**:
   ```bash
   cd supabase/functions
   cat > .env.local << EOF
   SUPABASE_URL=$SUPABASE_URL
   SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY=<paste-service-role-key>
   GEMINI_API_KEY=<your-gemini-api-key>
   EOF
   ```

4. **Set Supabase Secrets** (for deployed functions):
   ```bash
   npx supabase secrets set GEMINI_API_KEY=your-api-key
   npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

Done! Your Edge Functions can now access Supabase with full permissions.
