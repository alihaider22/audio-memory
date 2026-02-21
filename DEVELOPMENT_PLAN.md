# Audio Memory QR App - Development Plan

## Project Overview
Building an MVP web app for malinkiddy.com that allows customers to link QR codes to personal audio memories. The app will be deployed at audio.malinkiddy.com.

## Tech Stack
- **Frontend/Backend:** Next.js 16 with TypeScript
- **Styling:** Tailwind CSS
- **Database & Auth:** Supabase
- **Storage:** Supabase Storage
- **Deployment:** Vercel
- **Domain:** audio.malinkiddy.com

---

## Phase 1: Project Setup & Database

### 1.1 Initialize Next.js Project
- [ ] Create new Next.js app with TypeScript (`npx create-next-app@latest`)
- [ ] Set up Tailwind CSS
- [ ] Configure `.env.local` for environment variables
- [ ] Install dependencies: `@supabase/supabase-js`, `@supabase/auth-helpers-nextjs`

### 1.2 Setup Supabase
- [ ] Create new Supabase project
- [ ] Copy API keys to `.env.local`
- [ ] Create database tables:

**Table: `qr_codes`**
```sql
CREATE TABLE qr_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unique_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);
```

**Table: `audio_memories`**
```sql
CREATE TABLE audio_memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_code_id UUID REFERENCES qr_codes(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploader_email TEXT,
  UNIQUE(qr_code_id)
);
```

- [ ] Create Storage bucket `audio-files` (public read access)
- [ ] Enable email authentication with magic links in Supabase Auth settings

---

## Phase 2: Core Features

### 2.1 QR Code Landing Page (`/app/qr/[code]/page.tsx`)
- [ ] Create dynamic route for QR codes
- [ ] Fetch QR code data from database by `unique_code`
- [ ] Check if audio exists for this QR code
- [ ] Conditional rendering:
  - If audio exists → Show audio player component
  - If no audio → Show login/upload interface

### 2.2 Authentication
- [ ] Create Supabase client helper (`/lib/supabase.ts`)
- [ ] Build login page/modal (`/app/login/page.tsx`)
- [ ] Implement magic link email authentication
- [ ] Handle auth state and redirects
- [ ] Create auth context/provider if needed

### 2.3 Audio Upload/Recording
**Components to build:**

- [ ] `AudioUploader.tsx` - File upload component
  - Accept audio file formats (mp3, wav, m4a, etc.)
  - Validate file size (max 10MB recommended)
  - Upload to Supabase Storage
  - Save metadata to `audio_memories` table

- [ ] `AudioRecorder.tsx` - Browser recording component
  - Use MediaRecorder API
  - Record button with timer
  - Stop and save recording
  - Upload recorded audio to Supabase Storage

- [ ] Link uploaded/recorded audio to QR code in database

### 2.4 Audio Player
- [ ] `AudioPlayer.tsx` - Simple public player
- [ ] Play/pause controls
- [ ] Progress bar
- [ ] Volume control (optional)
- [ ] No authentication required to view/play

---

## Phase 3: Admin Area

### 3.1 Admin Dashboard (`/app/admin/page.tsx`)
- [ ] Protect route with authentication middleware
- [ ] Build bulk QR generation form
  - Input: number of QR codes to generate
  - Generate unique codes (e.g., UUID or short codes)
  - Insert into `qr_codes` table
  - Associate with logged-in admin user

- [ ] Display list of generated QR codes
  - Show code, creation date, audio status
  - Pagination if needed

### 3.2 CSV Export
- [ ] Create CSV export utility (`/utils/csv-export.ts`)
- [ ] API route for generating CSV (`/app/api/export-qr/route.ts`)
- [ ] Export format:
  ```
  QR_Code,URL,Created_At,Has_Audio
  abc123,https://audio.malinkiddy.com/qr/abc123,2025-02-21,No
  ```
- [ ] Download button in admin dashboard

---

## Phase 4: Polish & Deploy

### 4.1 Mobile Optimization
- [ ] Test on mobile devices (iOS Safari, Chrome Android)
- [ ] Ensure responsive design across all pages
- [ ] Test audio recording on mobile browsers
- [ ] Optimize touch interactions
- [ ] Test file upload on mobile

### 4.2 UI/UX Improvements
- [ ] Add loading states
- [ ] Error handling and user feedback
- [ ] Success messages for uploads
- [ ] Simple, clean design (mobile-first)
- [ ] Add favicon and meta tags

### 4.3 Deploy to Production
- [ ] Push code to GitHub repository
- [ ] Deploy to Vercel
- [ ] Configure environment variables in Vercel
- [ ] Set up custom domain: audio.malinkiddy.com
- [ ] Configure DNS records
- [ ] Test end-to-end flow on production

### 4.4 Testing Checklist
- [ ] QR code with no audio → shows upload interface
- [ ] Magic link login works
- [ ] Audio upload works
- [ ] Audio recording works
- [ ] QR code with audio → shows player (no login)
- [ ] Audio plays correctly
- [ ] Admin can generate QR codes in bulk
- [ ] CSV export works
- [ ] Mobile experience is smooth

---

## File Structure
```
audio-memory-app/
├── app/
│   ├── qr/
│   │   └── [code]/
│   │       └── page.tsx           # QR landing page
│   ├── admin/
│   │   └── page.tsx               # Admin dashboard
│   ├── login/
│   │   └── page.tsx               # Auth page
│   ├── api/
│   │   ├── generate-qr/
│   │   │   └── route.ts           # Bulk QR generation
│   │   └── export-qr/
│   │       └── route.ts           # CSV export
│   ├── layout.tsx
│   └── page.tsx                   # Home/landing page
├── components/
│   ├── AudioPlayer.tsx
│   ├── AudioUploader.tsx
│   ├── AudioRecorder.tsx
│   ├── QRGenerator.tsx
│   └── LoginButton.tsx
├── lib/
│   └── supabase.ts                # Supabase client
├── utils/
│   └── csv-export.ts              # CSV generation utility
├── .env.local                     # Environment variables
├── tailwind.config.ts
├── next.config.js
└── package.json
```

---

## Environment Variables (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## Estimated Timeline
- **Phase 1:** 4-6 hours
- **Phase 2:** 8-10 hours
- **Phase 3:** 4-6 hours
- **Phase 4:** 2-4 hours

**Total MVP:** 2-3 days of focused development

---

## Success Criteria
✅ Customer scans QR code → lands on unique page  
✅ If no audio → can log in via magic link and upload/record  
✅ If audio exists → plays immediately without login  
✅ Admin can generate 100+ QR codes and export as CSV  
✅ Works seamlessly on mobile devices  
✅ Simple, clean interface  

---

## Future Enhancements (Post-MVP)
- Edit/delete audio functionality
- Multiple audio files per QR code (different years)
- Analytics (play counts, upload dates)
- Email notifications when audio is added
- QR code label generator (printable PDF)

---

## Notes for Claude Code
- Work sequentially through each phase
- Test each feature before moving to the next
- Keep code simple and well-commented
- Focus on mobile-first responsive design
- Prioritize functionality over fancy UI in MVP
