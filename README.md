# 🎰 "VEGAS CAFE MANAGEMENT SYSTEM" — Boshqaruv Axborot Tizimi

Diplom ishi uchun maxsus ishlab chiqilgan **"Vegas Cafe & Lounge"** kafesining buyurtmalar, stollar, menyu, ombor, xodimlar, mijozlar, to'lovlar, rezervatsiyalar, audit va moliyaviy hisobotlarni yagona dasturiy ta'minot orqali avtomatlashtirish axborot tizimi.

---

## 🚀 Texnologiyalar Steki

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Ikonkalar**: Lucide React
- **Grafiklar va Vizualizatsiya**: Recharts
- **Backend**: Node.js, Express.js (TypeScript)
- **Ma'lumotlar Bazasi**: PostgreSQL / SQLite (Bir buyruq bilan almashtiriluvchi)
- **ORM**: Prisma ORM (14 ta to'liq relatsion jadvallar)
- **Autentifikatsiya**: JWT (JSON Web Tokens) va Bcrypt xeshlash
- **Arxitektura**: RESTful API, Controller-Service moduli, RBAC (Role-based access control)
- **Format va Eksport**: Kassa cheklari chop etish (80mm Thermal Receipt), Excel (CSV) eksport

---

## 👥 Foydalanuvchi Rollari va Demo Hisoblar

Diplom himoyasida darhol ko'rsatish uchun tizimda quyidagi hisoblar tayyorlab qo'yilgan (Login oynasida **1 ta bosish orqali tezkor kirish** tugmalari ham mavjud):

| Rol | Login | Parol | Mas'ul xodim | Asosiy vazifasi |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Alisher Zokirov | Butun tizim, hisobotlar, xodimlar, menyu, audit, sozlamalar |
| **Ofitsiant 1** | `ofitsiant1` | `waiter123` | Jasur Aliyev | Stollar xaritasi, yangi buyurtma olish, oshxona statusi |
| **Ofitsiant 2** | `ofitsiant2` | `waiter123` | Malika Karimova | Buyurtmalar bilan ishlash, stollarni band qilish |
| **Kassir** | `kassir1` | `cashier123` | Dilnoza Rahimova | Buyurtmalar to'lovini qabul qilish (naqd/karta), chek chop etish |
| **Omborchi** | `omborchi1` | `stock123` | Sardor Umarov | Xom-ashyo qoldig'i, kirim/chiqim amallari, kam qolgan tovarlar |

---

## 💻 Loyihani Ishga Tushirish Bo'yicha Qo'llanma

### 1. Talablar:
- **Node.js** (v18 yoki v20+)
- **NPM** (v9 yoki v10+)

### 2. O'rnatish va Ishga tushirish (Avtomatlashtirilgan):

#### A) Backend ni ishga tushirish:
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
npm run dev
```
> Backend serveri `http://localhost:5000` manzilida ishga tushadi.

#### B) Frontend ni ishga tushirish (Alohida terminalda):
```bash
cd frontend
npm install
npm run dev
```
> Frontend ilovasi brauzerda `http://localhost:3000` manzilida ochiladi.

---

## 🗄️ Ma'lumotlar Bazasini Sozlash (PostgreSQL & SQLite)

Tizim diplom himoyasi va demonstratsiya uchun **ikkala rejimni** ham to'liq qo'llab-quvvatlaydi:

1. **Zero-friction rejim (SQLite - Odatiy holat)**:
   - Kompyuterda PostgreSQL o'rnatilmagan bo'lsa ham dastur avtomatik ravishda `dev.db` faylida to'liq ishlaydi.
   - Ishga tushirish: `npm run use:sqlite`

2. **PostgreSQL rejimi (Docker yoki Server)**:
   - Ildiz katalogida tayyor `docker-compose.yml` mavjud.
   ```bash
   docker-compose up -d
   ```
   - PostgreSQL rejimiga o'tish:
   ```bash
   cd backend
   npm run use:postgres
   npm run prisma:push
   npm run prisma:seed
   ```

---

## ☁️ Vercel va Render ga Deploy Qilish (To'liq Qo'llanma)

Mazkur loyiha professional arxitektura asosida ishlab chiqilgan bo'lib, **Frontend (React)** ni **Vercel** ga, **Backend (Node.js + PostgreSQL)** ni esa **Render** ga bepul joylashtirish (deploy) uchun to'liq moslangan.

### 1-QADAM: Backend ni Render ga Deploy qilish
1. [render.com](https://render.com) ga kiring va GitHub orqali ro'yxatdan o'ting.
2. **Yangi Web Service** yarating:
   - **New +** ➔ **Web Service** ni tanlang.
   - GitHub repositoryingizni tanlang (`Ramzjan21/vegas-`).
   - Quyidagi parametrlarni kiriting:
     - **Name**: `vegas-cafe-backend`
     - **Root Directory**: `backend`
     - **Runtime**: `Node`
     - **Build Command**: `npm install && npm run build:render`
     - **Start Command**: `npm run start:render`
3. **Ma'lumotlar bazasi (PostgreSQL) ulash**:
   - Render da **New +** ➔ **PostgreSQL** oching (bepul rejim).
   - Hosil bo'lgan bazaning **Internal Database URL** (yoki Supabase/Neon connection string) manzilini nusxalang.
   - Web Service sozlamalarida **Environment Variables** ga quyidagilarni qo'shing:
     - `DATABASE_URL` = `postgresql://...` (Render yoki Supabase PostgreSQL manzili)
     - `JWT_SECRET` = `vegas_cafe_jwt_secret_key_super_secure_2026`
     - `NODE_ENV` = `production`
4. **Deploy tugmasini bosing**:
   - Tizim avtomatik ravishda PostgreSQL ga ulanadi, jadvallarni ochadi va agar baza bo'sh bo'lsa, **barcha demo taomlar, stollar va xodimlarni avtomatik joylaydi (auto-seed)**!
   - Tayyor backend URL olinadi (masalan: `https://vegas-cafe-backend.onrender.com`).

---

### 2-QADAM: Frontend ni Vercel ga Deploy qilish
1. [vercel.com](https://vercel.com) ga kiring va GitHub orqali kiring.
2. **Add New...** ➔ **Project** ni tanlang va `Ramzjan21/vegas-` repositorysini tanlang.
3. Sozlamalarni tekshiring:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` (Edit tugmasini bosib `frontend` ni tanlang)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables** (Muhim!):
   - `VITE_API_URL` nomli o'zgaruvchi qo'shing va qiymatiga Render'dagi backend havolasini yozing:
     - `VITE_API_URL` = `https://vegas-cafe-backend.onrender.com`
5. **Deploy** tugmasini bosing:
   - 1 daqiqa ichida sayt jonli ishga tushadi (masalan: `https://vegas-cafe.vercel.app`).
   - `frontend/vercel.json` tufayli sahifani yangilaganda (F5) 404 xatosi chiqmaydi.

---

## 🎓 Diplom Himoyasi Uchun Bosqichma-bosqich Demonstratsiya Ssenariysi

Himoya hay'ati a'zolari oldida dasturning real ishlashini namoyish qilish uchun quyidagi ssenariyni ketma-ket bajaring:

### 1-qadam: Administrator sifatida kirish va Dashboard tahlili
- `http://localhost:3000` manziliga kiring.
- "Admin" tugmasini bosing va tizimga kiring.
- Bosh sahifada (Dashboard):
  - Bugungi tushum, faol buyurtmalar va stollar bandligi KPI kartochkalarini ko'rsating.
  - Haftalik savdo grafigi (Recharts AreaChart) va toifalar ulushini (PieChart) tushuntiring.
  - Omborda kam qolgan mahsulotlar ogohlantirish bannerini ko'rsating.

### 2-qadam: Ofitsiant roli va Stollar xaritasi
- Profil menyusidan chiqib, `ofitsiant1` (Jasur Aliyev) sifatida kiring.
- "Stollar" sahifasiga o'ting:
  - Zal, Terassa va VIP bo'limlar bo'yicha stollarni ko'rsating.
  - Bo'sh stollardan birini (masalan, 3-stol) bosing.
- "Yangi buyurtma yaratish" tugmasini bosing:
  - Kategoriya bo'yicha taomlarni tanlang (masalan, "Vegas Ribeye Steyk", "Sezar salati", 2 dona "Coca-Cola").
  - Mahsulotga izoh yozing: *"Medium well pishirilsin"*.
  - "Buyurtmani tasdiqlash" tugmasini bosing.
- 3-stol avtomatik ravishda sariq rangga aylanadi va "Band" holatiga o'tadi.

### 3-qadam: Oshxona va Buyurtma holatini yangilash
- "Buyurtmalar" sahifasiga o'ting.
- Yangi yaratilgan buyurtma statusini:
  `Yangi` ➔ `Tayyorlanmoqda` ➔ `Yetkazildi` holatlariga o'tkazish jarayonini ko'rsating.
- Yuqori paneldagi bildirishnomalar qo'ng'iroqchasida real vaqtda kelgan xabarlarni ko'rsating.

### 4-qadam: Kassir roli, To'lov va Kassa Cheki
- Tizimdan chiqib, `kassir1` (Dilnoza Rahimova) hisobiga kiring.
- "Kassa va To'lov" sahifasiga o'ting:
  - 3-stol uchun to'lov kutilayotgan buyurtmani ko'ring.
  - "To'lov olish" tugmasini bosing.
  - To'lov turini tanlang (masalan: "Naqd pul").
  - Chegirma kiritish yoki mijoz bergan summani kiritib, qaytimni (sdacha) avtomatik hisoblanishini ko'rsating.
  - "To'lovni qabul qilish" tugmasini bosing.
- Ekranda **80mm professional kassa cheki** (Receipt) paydo bo'ladi:
  - Kafe nomi, telefon, stol, ofitsiant, mahsulotlar ro'yxati, xizmat haqi va yakuniy summa.
  - "Chekni chop etish" tugmasini bosib, printerni yoki PDF ko'rinishini namoyish qiling.
- Stol avtomatik ravishda yashil rangga (Bo'sh) aylanadi.

### 5-qadam: Omborxona va Avtomatik Sarf nazorati
- `omborchi1` (Sardor Umarov) hisobiga kiring.
- "Ombor" sahifasida sotilgan taomlar orqali go'sht va ichimlik qoldiqlari kamayganini ko'rsating.
- "Kirim" tugmasini bosib, yangi keltirilgan mahsulotni omborga kiritish operatsiyasini bajaring.

### 6-qadam: Administrator hisoboti va Audit tarixi
- Yana `admin` hisobiga kiring.
- "Hisobotlar" sahifasida:
  - Yangi amalga oshirilgan savdo umumiy tushumga qo'shilganini ko'ring.
  - Ofitsiantlar savdo reytingini ko'rsating.
  - "Excel (CSV) Yuklash" tugmasini bosib, moliyaviy hisobotni Excel formatida yuklab oling.
- "Audit Log" sahifasiga o'tib, qaysi xodim qaysi daqiqada qanday amal bajargani (Login, Buyurtma, To'lov, Ombor) to'liq qayd etilganini ko'rsating.

---

## 📁 Loyiha Strukturasi

```
vegas-cafe/
 ├── backend/
 │    ├── prisma/
 │    │    ├── schema.prisma          # PostgreSQL / SQLite 14 ta jadvalli relatsion schema
 │    │    └── seed.ts                # Realistik demo ma'lumotlar bilan to'ldiruvchi skript
 │    ├── src/
 │    │    ├── config/db.ts           # Prisma client singleton
 │    │    ├── controllers/           # 13 ta modul uchun kontrollerlar
 │    │    ├── middleware/            # Auth, RBAC, ErrorHandler, Audit
 │    │    ├── routes/                # RESTful API marshrutlari
 │    │    ├── utils/                 # JWT, Password, Audit log yordamchilari
 │    │    └── server.ts              # Express server
 │    ├── package.json
 │    └── tsconfig.json
 ├── frontend/
 │    ├── src/
 │    │    ├── api/client.ts          # Axios avtomatik token inyektsiyasi
 │    │    ├── components/
 │    │    │    ├── common/           # Modal, ConfirmDialog, StatCard, EmptyState
 │    │    │    └── layout/           # Sidebar, Navbar, Responsive Layout
 │    │    ├── context/               # AuthContext, NotificationContext
 │    │    ├── pages/                 # 13 ta to'liq ishlab chiqilgan sahifalar
 │    │    ├── types/                 # Qat'iy TypeScript interfeyslari
 │    │    ├── utils/                 # O'zbek tili formatlagichlari
 │    │    ├── App.tsx                # Rolli yo'naltirish (Protected Routes)
 │    │    └── main.tsx
 │    ├── tailwind.config.js          # Vegas Gold & Slate mavzusi
 │    ├── vite.config.ts
 │    └── package.json
 ├── docker-compose.yml               # PostgreSQL & PgAdmin konteynerlari
 └── README.md
```

---

## 🛡️ Xavfsizlik va Validatsiya

- **Parollar xavfsizligi**: `bcryptjs` orqali 10 tuzli xesh bilan shifrlangan.
- **JWT Autentifikatsiya**: Har bir so'rovda `Authorization: Bearer <token>` tekshiriladi.
- **Ruxsatlar nazorati (RBAC)**: Administrator, Ofitsiant, Kassir va Omborchi uchun API va sahifalar cheklovi.
- **SQL Injection himoyasi**: Prisma ORM parametrized queries orqali 100% himoyalangan.
- **Audit Logging**: Har bir muhim harakat (login, yangi buyurtma, to'lov, ombor operatsiyalari) ma'lumotlar bazasiga IP-manzil va vaqt bilan yozib boriladi.

---

Muallif: **Diplom Ishi Talabasi**  
Mavzu: **"Vegas" kafesining axborot tizimini ishlab chiqish**  
Toshkent — 2026-yil
