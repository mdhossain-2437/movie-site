# Production Deployment Guide: Vercel & Cloudflare

This repository builds the **CINEVA Lawful Movie Discovery & Authorized Media Distribution Platform** powered by **Next.js 16.4.5**, React 19, Turbopack, and a `pnpm` monorepo.

---

## Architecture Recommendation: Vercel + Cloudflare Hybrid

| Platform | Role | Why It Is Chosen |
|---|---|---|
| **Vercel (Primary App Host)** | Next.js 16 App Router, Turbopack, PPR (Partial Prerendering), Node.js Serverless Functions | Next.js 16 is built by Vercel. Features like `cacheComponents`, `partialPrefetching`, native `scrypt`/crypto authentication, and dynamic API streaming work out of the box with zero runtime shims. |
| **Cloudflare (Edge CDN & DNS)** | Global DNS, CDN caching, DDoS Shield, WAF | Placing Cloudflare in front of Vercel gives you enterprise-grade DDoS mitigation, edge caching for static assets, and custom SSL. |
| **Cloudflare R2 (Storage)** | Packaged Media & Video Chunks (`STORAGE_PROVIDER=r2`) | S3-compatible, **\$0 egress bandwidth fees** for streaming HLS/DASH video segments. |

---

## 1. Deploying on Vercel

### Step 1: Connect GitHub Repository
1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **"Add New..."** → **"Project"**.
3. Import your repository: `mdhossain-2437/movie-site`.

### Step 2: Configure Project Settings
- **Framework Preset**: `Next.js`
- **Root Directory**: Click `Edit` and select `apps/web` (or leave as root since [`vercel.json`](file:///d:/movie-site/vercel.json) specifies the monorepo build command).
- **Build Command**: `pnpm --filter @movie/web build`
- **Output Directory**: `.next`
- **Install Command**: `pnpm install --frozen-lockfile`

### Step 3: Configure Production Environment Variables
In the Vercel **Environment Variables** tab, add the following:

| Variable | Description | Example / Required Value |
|---|---|---|
| `APP_URL` | Production website URL | `https://your-domain.com` or `https://movie-site-xxx.vercel.app` |
| `APP_ENV` | Application environment | `production` |
| `SESSION_SECRET` | 64-character hex secret for viewer session tokens | Run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `MEDIA_URL_SIGNING_SECRET` | Secret for short-lived streaming manifest URLs | 32+ characters random string |
| `DATABASE_URL` | PostgreSQL connection string (Neon, Supabase, Vercel Postgres, or VPS) | `postgresql://user:pass@ep-cool-db.us-east-2.aws.neon.tech/cineva?sslmode=require` |
| `TMDB_READ_ACCESS_TOKEN` | TMDb v4 Read Access Bearer Token | Your TMDb JWT Bearer token |
| `TMDB_API_KEY` | TMDb v3 API Key | Your 32-char hex API key |
| `TMDB_COMMERCIAL_LICENSE_CONFIRMED` | Commercial license confirmation flag | `false` |
| `OMDB_API_KEY` | OMDb API Key | Your 8-character OMDb API key |
| `STORAGE_PROVIDER` | Media object storage adapter | `memory` (for showcase) or `r2` / `s3-compatible` |

### Step 4: Click "Deploy"
Vercel will install dependencies using `pnpm`, execute Turbopack compilation, prerender all static and partial prerender routes, and provision your live deployment.

---

## 2. Setting Up Cloudflare in Front of Vercel (Edge Protection & Custom Domain)

1. **Add your domain to Cloudflare**:
   - Change your domain's nameservers at your domain registrar to the Cloudflare nameservers provided.
2. **Configure DNS Records**:
   - In Cloudflare DNS, add a **CNAME** record:
     - **Type**: `CNAME`
     - **Name**: `@` (or `movies`)
     - **Target**: `cname.vercel-dns.com`
     - **Proxy status**: **Proxied (Orange Cloud)** (enables Cloudflare CDN, DDoS mitigation, and WAF).
3. **Configure SSL/TLS in Cloudflare**:
   - Go to **SSL/TLS** → Set encryption mode to **Full (strict)**.
4. **Link Custom Domain in Vercel**:
   - In Vercel Project Settings → **Domains** → Add your domain (e.g. `movies.yourdomain.com`). Vercel will verify the Cloudflare DNS configuration automatically.

---

## 3. Using Cloudflare R2 for Zero-Egress Media Storage

If hosting video streams (`.m3u8` / `.mpd` / `.mp4` chunks) with zero bandwidth fees:
1. Create a Bucket in Cloudflare Dashboard: **R2** → **Create Bucket** (e.g. `cineva-media-packaged`).
2. Generate API Tokens: **R2** → **Manage R2 API Tokens** → **Create API Token** with `Object Read & Write` permissions.
3. Set the following environment variables in Vercel:
   ```env
   STORAGE_PROVIDER=r2
   STORAGE_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
   STORAGE_REGION=auto
   STORAGE_ACCESS_KEY_ID=<R2_ACCESS_KEY_ID>
   STORAGE_SECRET_ACCESS_KEY=<R2_SECRET_ACCESS_KEY>
   ```

---

## 4. Alternative: Deploying via Vercel CLI

You can also deploy directly from your local terminal:

```powershell
# 1. Install or run Vercel CLI
npx vercel link

# 2. Deploy a preview build
npx vercel

# 3. Deploy to production
npx vercel --prod
```
