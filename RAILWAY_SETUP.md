# Railway deploy (Hosting + Database) — addım-addım

Bu repo Railway-də **1 project** içində həm **hosting**, həm də **PostgreSQL database** ilə işləmək üçün hazırlanıb.

## 1) Railway-də project yarat
1. Railway → **New Project**
2. **Deploy from GitHub repo** seç və bu repo-nu bağla.

## 2) PostgreSQL əlavə et
1. Project səhifəsində **Add** → **PostgreSQL**
2. Railway avtomatik olaraq Postgres-i yaradır və adətən web service-ə **DATABASE_URL** verir.

## 3) Database cədvəllərini yarat (mütləq)
Railway → Postgres → **Query** (və ya Data/SQL tool) bölməsində aşağıdakı SQL-i run elə:

```sql
create table if not exists public.app_kv (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.images (
  image_key text primary key,
  content_type text not null,
  bytes bytea not null,
  created_at timestamptz not null default now()
);

create index if not exists images_created_at_idx on public.images (created_at desc);
```

**Qeyd:** app `db.json`, attempts, messages və s. məlumatları `app_kv` cədvəlində saxlayır.
Şəkillər isə `images` cədvəlinə bytea kimi yazılır.

## 4) Railway service variables (env)
Railway → Sənin web service → **Variables** bölməsi:

Minimum:
- `DATABASE_URL` (Railway Postgres plugin bunu adətən avtomatik verir)
- `ADMIN_SESSION_SECRET` (uzun random string, məsələn 32+ simvol)

Opsional (istehsalda tövsiyə olunur):
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

## 5) Deploy
Railway build edib start edəcək.
Default start command repo-da `npm run start` (Next.js) kimi işləyir.

## 6) İlk yoxlama
1. Sayt açılır
2. `/admin` açılır
3. Admin paneldən sual əlavə edəndə saxlayır
4. Şəkil upload edib sualda göstərir (`/api/images/...`)

