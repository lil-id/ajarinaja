# Migrating from Lovable Supabase to Your Own Supabase Account

## Overview

This guide helps you migrate your classroom-companion project from Lovable's managed Supabase to your own Supabase account. This gives you full control over your database, Edge Functions, and allows you to use advanced features like pgvector for AI.

---

## Step 1: Create Your Own Supabase Account

### 1.1 Sign Up
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email
4. Verify your email

### 1.2 Create New Project
1. Click "New Project"
2. Fill in details:
   - **Name**: classroom-companion (or your choice)
   - **Database Password**: Generate strong password (SAVE THIS!)
   - **Region**: Choose closest to your users (e.g., Southeast Asia)
   - **Pricing Plan**: Free tier is fine for now
3. Click "Create new project"
4. Wait 2-3 minutes for provisioning

### 1.3 Note Your Project Details
Once created, go to **Settings** → **API**:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
Project Ref: xxxxxxxxxxxxx
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANT**: Save these securely! You'll need them.

---

## Step 2: Export Data from Lovable Supabase (Optional)

If you have existing data you want to keep:

### 2.1 Export via Supabase Dashboard

1. Access your Lovable Supabase dashboard
   - Usually at: `https://supabase.com/dashboard/project/[project-ref]`
   - Or ask Lovable support for access

2. Go to **SQL Editor**

3. Export each table:
```sql
-- Export users/profiles
COPY (SELECT * FROM profiles) TO STDOUT WITH CSV HEADER;

-- Export courses
COPY (SELECT * FROM courses) TO STDOUT WITH CSV HEADER;

-- Export exams
COPY (SELECT * FROM exams) TO STDOUT WITH CSV HEADER;

-- ... repeat for other tables
```

4. Save each as CSV file

### 2.2 Alternative: Use Supabase CLI

```bash
# Link to Lovable project (if you have access)
supabase link --project-ref <lovable-project-ref>

# Dump database
supabase db dump -f lovable-backup.sql

# Dump storage
supabase storage download --all
```

---

## Step 3: Link Your New Supabase Project

### 3.1 Install Supabase CLI (if not installed)
```bash
npm install -g supabase
```

### 3.2 Login to Supabase
```bash
supabase login
```

This opens browser for authentication.

### 3.3 Link Your New Project
```bash
cd /home/renjerpink/Documents/Pemrograman/JS/classroom-companion

supabase link --project-ref YOUR_NEW_PROJECT_REF
```

Replace `YOUR_NEW_PROJECT_REF` with the ref from Step 1.3.

You'll be prompted for database password (from Step 1.2).

### 3.4 Verify Link
```bash
supabase projects list
```

Should show your new project as linked (marked with `*`).

---

## Step 4: Update Environment Variables

### 4.1 Update `.env` File

Open `.env` and replace with your NEW project values:

```bash
# OLD (Lovable)
VITE_SUPABASE_URL=https://old-lovable-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...old-key...

# NEW (Your Account)
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...new-key...
```

### 4.2 Update Edge Functions `.env.local`

Create/update `supabase/functions/.env.local`:

```bash
cd supabase/functions
cat > .env.local << EOF
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GEMINI_API_KEY=your-gemini-api-key
EOF
```

Replace with your actual values from Step 1.3.

---

## Step 5: Deploy Database Schema

### 5.1 Check Existing Migrations

```bash
ls -la supabase/migrations/
```

You should see all migration files created by Lovable + your new AI migrations.

### 5.2 Deploy All Migrations

```bash
supabase db push
```

This will:
- Create all tables (profiles, courses, exams, assignments, etc.)
- Set up RLS policies
- Create pgvector extension
- Create AI tables and functions

### 5.3 Verify Deployment

Go to Supabase Dashboard → **Database** → **Tables**

You should see all tables created.

---

## Step 6: Import Data (Optional)

If you exported data in Step 2:

### 6.1 Via SQL Editor

1. Go to **SQL Editor** in your NEW project
2. For each table:

```sql
-- Create temporary table from CSV
CREATE TEMP TABLE temp_profiles (LIKE profiles);

-- Import CSV data (you'll paste CSV content in dashboard)
-- Then insert into actual table
INSERT INTO profiles SELECT * FROM temp_profiles
ON CONFLICT (user_id) DO NOTHING;
```

### 6.2 Via Supabase CLI

If you have SQL dump:

```bash
supabase db push --file lovable-backup.sql
```

---

## Step 7: Set Up Storage Buckets

### 7.1 Create Buckets

Go to **Storage** in dashboard and create:
- `avatars` (for user profile pictures)
- `thumbnails` (for course thumbnails)
- `materials` (for AI question generation - NEW)
- `assignments` (for assignment files)

### 7.2 Set Bucket Policies

For each bucket, configure public/private access as needed.

Example for `materials` bucket (private):

```sql
-- Allow teachers to upload
CREATE POLICY "Teachers can upload materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'materials' AND
  auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'teacher')
);

-- Allow teachers to read their materials
CREATE POLICY "Teachers can read their materials"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'materials');
```

---

## Step 8: Deploy Edge Functions

### 8.1 Set Secrets

```bash
supabase secrets set GEMINI_API_KEY=your-gemini-api-key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 8.2 Deploy Functions

```bash
# Deploy AI functions
supabase functions deploy process-material --no-verify-jwt
supabase functions deploy generate-questions
supabase functions deploy list-materials

# Deploy existing functions (if any)
supabase functions deploy send-course-notification
supabase functions deploy send-enrollment-email
```

### 8.3 Verify Deployment

```bash
supabase functions list
```

---

## Step 9: Seed Sample Data (Optional)

The project includes a data seeder to populate your database with test data.

### 9.1 Deploy Seed Function

```bash
supabase functions deploy seed-data
```

### 9.2 Run Seeder

```bash
curl -X POST \
  "https://your-project.supabase.co/functions/v1/seed-data" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

This will create:
- **Test Accounts**:
  - Teacher: `teacher@demo.com` / Password: `demo123`
  - Student: `student@demo.com` / Password: `demo123`
- **Sample Courses**: 3 courses (Mathematics, Biology, Programming)
- **Sample Exams**: With questions
- **Sample Assignments**: For testing
- **Badges**: Achievement badges
- **Academic Periods**: Semesters

### 9.3 Verify Seeded Data

Login with test accounts:
1. Go to http://localhost:5173 (or your URL)
2. Login as teacher: `teacher@demo.com` / `demo123`
3. Check dashboard for sample courses

---

## Step 10: Test Everything

### 10.1 Test Authentication

1. Open your app: http://localhost:5173 (or your deployment URL)
2. Try to register new account
3. Try to login
4. Check profile creation

### 10.2 Test Existing Features

- Create course
- Create exam
- Create assignment
- Enroll student
- Submit assignment

### 10.3 Test AI Features

Run test script:
```bash
./scripts/test-functions.sh
```

---

## Step 11: Update Production Deployment

If you're using Vercel/Netlify/etc:

### Update Environment Variables

In your deployment platform (e.g., Vercel):

1. Go to Project Settings → Environment Variables
2. Update:
   - `VITE_SUPABASE_URL` → New project URL
   - `VITE_SUPABASE_ANON_KEY` → New anon key
3. Redeploy application

---

## Verification Checklist

After migration, verify:

- [ ] `.env` updated with new Supabase credentials
- [ ] Project linked: `supabase projects list`
- [ ] All migrations deployed: Check dashboard tables
- [ ] Storage buckets created
- [ ] Edge Functions deployed: `supabase functions list`
- [ ] Secrets configured: Test function calls
- [ ] App can authenticate
- [ ] App can create/read data
- [ ] AI features working (if deployed)

---

## Troubleshooting

### Issue: "Project not linked"
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### Issue: "Migration failed"
- Check dashboard SQL Editor for errors
- Run migrations one by one to identify issue
- Check foreign key constraints

### Issue: "Cannot authenticate"
- Clear browser local storage
- Check anon key is correct in `.env`
- Verify RLS policies are set up

### Issue: "Edge Function error"
- Check secrets are set: `supabase secrets list`
- View logs: `supabase functions logs <function-name>`
- Test locally: `supabase functions serve`

---

## Rollback Plan

If migration fails, you can rollback to Lovable:

1. **Revert `.env`**:
   ```bash
   git checkout .env
   ```

2. **Relink Lovable project** (if you have access):
   ```bash
   supabase link --project-ref <lovable-project-ref>
   ```

3. **Redeploy** to previous state

---

## Cost Comparison

### Lovable (Managed)
- ✅ No setup needed
- ❌ Limited control
- ❌ No pgvector support
- ❌ No Edge Functions customization

### Your Own Supabase (Free Tier)
- ✅ Full control
- ✅ pgvector support ✅
- ✅ Custom Edge Functions ✅
- ✅ 500MB database
- ✅ 1GB storage
- ✅ 2GB bandwidth/month
- ❌ Requires setup

**Recommendation**: Use your own account for production apps.

---

## Next Steps After Migration

1. ✅ Deploy AI migrations: Already in `supabase/migrations/`
2. ✅ Deploy AI functions: `./scripts/deploy-ai.sh`
3. ✅ Test AI features: `./scripts/test-functions.sh`
4. ⏭️ Build frontend for AI question generation
5. ⏭️ Monitor usage and optimize

---

## Support

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Lovable Support: support@lovable.app (for data export)

Good luck with your migration! 🚀
