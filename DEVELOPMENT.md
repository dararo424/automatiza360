# Desarrollo Local — Automatiza360

## Requisitos
- Node.js 20+
- pnpm 9+
- Docker + Docker Compose
- Python 3.11+

## Setup inicial

### 1. Clonar y instalar dependencias
```bash
git clone https://github.com/dararo424/automatiza360.git
cd automatiza360
pnpm install
```

### 2. Configurar variables de entorno
```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/ai-service/.env.example apps/ai-service/.env
cp apps/frontend/.env.example apps/frontend/.env.local
# Edita cada .env con tus valores
```

### 3. Levantar base de datos local
```bash
docker-compose up -d postgres
```

### 4. Aplicar migraciones
```bash
cd apps/backend
npx prisma migrate dev
npx prisma generate
```

### 5. Levantar servicios
```bash
# Terminal 1 - Backend
cd apps/backend && pnpm start:dev

# Terminal 2 - Frontend
cd apps/frontend && pnpm dev

# Terminal 3 - AI Service
cd apps/ai-service && pip install -r requirements.txt && uvicorn app.main:app --reload

# Terminal 4 - Landing (opcional)
cd apps/landing && pnpm dev
```

## Ambientes

| Ambiente | Branch | Backend | Frontend | DB |
|----------|--------|---------|----------|-----|
| dev | local | localhost:3000 | localhost:5173 | Docker local |
| staging | develop | Railway staging | Vercel preview | Supabase staging |
| prod | main | Railway prod | Vercel prod | Supabase prod |

## GitHub Secrets requeridos
Para que CI/CD funcione, configura en GitHub → Settings → Secrets:

```
RAILWAY_TOKEN                        # Railway API token
RAILWAY_PROD_BACKEND_SERVICE_ID      # ID del servicio backend en prod
RAILWAY_STAGING_BACKEND_SERVICE_ID   # ID del servicio backend en staging
VERCEL_TOKEN                         # Vercel API token
VERCEL_ORG_ID                        # Vercel org/team ID
VERCEL_FRONTEND_PROJECT_ID           # Vercel project ID del frontend
```
