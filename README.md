# Sistema de Practicas Preprofesionales y Tesis - UNT

## Desarrollo local sin Docker

Este proyecto puede ejecutarse completamente en modo desarrollo local (sin contenedores).

### 1) Requisitos

- Node.js 20+
- npm 10+
- PostgreSQL 15+ ejecutandose en `localhost:5432`

### 2) Backend (NestJS)

Archivo de entorno configurado para local:

- `backend/.env`
- `DATABASE_URL="postgresql://postgres:kali123@localhost:5432/practicas_tesis_db?schema=public"`

Pasos:

```bash
cd backend
npm install
npm run dev:setup
npm run start:dev
```

Opcional (datos semilla):

```bash
npm run dev:seed
```

Backend en desarrollo:

- API: `http://localhost:3001/api/v1`
- Swagger: `http://localhost:3001/api/docs`

### 3) Frontend (Next.js)

Variables de entorno para local:

- copiar `frontend/.env.local.example` a `frontend/.env.local`
- verificar `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`

Pasos:

```bash
cd frontend
npm install
npm run dev
```

Frontend en desarrollo:

- `http://localhost:3000`

### 4) Flujo recomendado

1. Iniciar PostgreSQL local.
2. Levantar backend con `npm run start:dev`.
3. Levantar frontend con `npm run dev`.

No se requiere `docker-compose` para este flujo.
