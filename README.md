# Housing Escrow Service

En komplet MVP-løsning for bolig-depositum escrow-tjeneste med PayProff-integration.

## 🚀 Hurtig Start

### Forudsætninger
- Node.js 20+
- PostgreSQL database
- npm eller yarn

### 1. Installation
```bash
# Klon projektet
cd "Project X"

# Installer dependencies
npm install

# Installer dependencies for alle apps
cd apps/api && npm install && cd ../..
cd apps/web && npm install && cd ../..
```

### 2. Database Setup
```bash
# Start PostgreSQL (eksempel med Docker)
docker run --name housing-escrow-db \
  -e POSTGRES_DB=housing_escrow \
  -e POSTGRES_USER=housing_user \
  -e POSTGRES_PASSWORD=housing_pass \
  -p 5432:5432 \
  -d postgres:15

# Eller brug din eksisterende PostgreSQL installation
```

### 3. Environment Variables
```bash
# Backend (.env i apps/api/)
cp apps/api/.env.example apps/api/.env

# Rediger apps/api/.env med dine database credentials:
# DATABASE_URL="postgresql://housing_user:housing_pass@localhost:5432/housing_escrow"
# JWT_SECRET="din-super-hemmelige-jwt-nøgle"
# PAYPROFF_API_KEY="din-payproff-api-nøgle"

# Frontend (.env.local i apps/web/)
cp apps/web/.env.example apps/web/.env.local
```

### 4. Database Migration
```bash
# Generer Prisma client og push database schema
cd apps/api
npm run db:generate
npm run db:push
cd ../..
```

### 5. Start Applikationen
```bash
# Start backend (port 3001)
cd apps/api
npm run dev &

# Start frontend (port 3000)
cd apps/web
npm run dev &

# Eller start begge med turbo (fra root)
npm run dev
```

### 6. Tilgå Applikationen
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/health

## 📁 Projektstruktur

```
housing-escrow-service/
├── apps/
│   ├── api/                 # Backend API (Fastify + Prisma)
│   │   ├── src/
│   │   │   ├── routes/      # API endpoints
│   │   │   ├── services/    # PayProff integration
│   │   │   ├── middleware/  # Authentication
│   │   │   └── types/       # TypeScript definitions
│   │   └── prisma/          # Database schema
│   └── web/                 # Frontend (Next.js 14)
│       ├── src/
│       │   ├── app/         # App Router pages
│       │   ├── components/  # React components
│       │   └── lib/         # Utilities & context
│       └── tailwind.config.js
├── packages/
│   └── shared/              # Delte typer/utilities
└── package.json             # Monorepo root
```

## 🔄 Escrow Flow

1. **CREATE**: Køber opretter escrow med sælger email
2. **FUNDED**: Køber betaler via PayProff hosted URL
3. **RELEASED**: Sælger frigiver midler til køber

## 🎨 UI Features

- Mørk tema med blå accenter
- Minimalistisk design
- Responsive layout
- Real-time status opdateringer
- Sikker authentication

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Opret bruger
- `POST /api/auth/login` - Login

### Escrow
- `GET /api/escrow` - Hent brugerens escrows
- `POST /api/escrow` - Opret ny escrow
- `GET /api/escrow/:id` - Hent specifik escrow
- `POST /api/escrow/:id/release` - Frigiv escrow (kun sælger)

### Webhooks
- `POST /api/webhook/payproff` - PayProff status opdateringer

## 🔧 PayProff Integration

PayProff-adapteren er implementeret som mock-service. For produktion:

1. Opdater `PAYPROFF_API_URL` og `PAYPROFF_API_KEY`
2. Implementer rigtige API calls i `apps/api/src/services/payproff.ts`
3. Konfigurer webhook URL i PayProff dashboard

## 🧪 Test Flow

1. Registrer to brugere (køber og sælger)
2. Login som køber
3. Opret escrow med sælger email
4. Klik "Pay Deposit" (simulerer PayProff betaling)
5. Login som sælger
6. Klik "Release Funds" for at frigive escrow

## 🚀 Production Deploy

```bash
# Build alle apps
npm run build

# Start production server
npm run start
```

For produktion deployment, husk at:
- Sæt rigtige environment variables
- Konfigurer PostgreSQL database
- Sæt op PayProff webhook URL
- Aktivér HTTPS og sikkerhedsheaders