# COLOXI - Master Project Context & Changelog

> **Nota para el Asistente AI / Desarrollador:** Si el contexto de la conversación se pierde, este documento sirve como la memoria central (Cerebro) del proyecto. Lee este archivo completo antes de sugerir código o arquitecturas.

## 1. Stack Tecnológico Aprobado (Fase 0)
- **Backend:** NestJS (Node.js), TypeScript.
- **Base de Datos:** PostgreSQL (Nativo / Local) + Prisma ORM.
- **Frontend:** React + Vite, Tailwind CSS (Paleta estilo Apple/Glassmorphism).
- **Gestión de Estado UI:** Zustand (Global) + TanStack React Query (Server Cache).
- **Autenticación:** JWT.

## 2. Reglas de Negocio Vitales y de Plataforma
1. **Permisos Financieros:** Ocultar margen de ganancia estrictamente al rol `Jefe de Compra`.
2. **Inmutabilidad Financiera:** Los detalles de órdenes de compra (snapshots) se guardan como valores fijos (`NUMERIC`). Todo cálculo comercial/monetario ocurre en la capa de la aplicación antes de persistirlo, nunca como `GENERATED` directo en BD.
3. **Persistencia Histórica:** Se utiliza "Soft-Delete" (Inactivación) para productos. Está prohibido utilizar borrados en cascada (`ON DELETE CASCADE`) que arriesguen romper el historial contable si alguien borra un material del catálogo.
4. **Exportación Precios:** Generación de PVP Venezuela a partir de factor base dinámico (Ej. `1.40` guardado en Base de Datos).
5. **No Sobreescritura de Identidad:** Creador/Modificador debe ser preservado pero bajo restricción `ON DELETE SET NULL` para mantener los registros vivos si un usuario es borrado.
6. **Almacenamiento Local de Imágenes (Opción A):** Las imágenes no se guardan directamente en Postgres; NestJS las guarda en el disco duro (`backend/uploads`) y la base de datos registra únicamente su `url_imagen`, `file_size` y `mime_type` para control de cuota.

## 3. Estado Actual de la Base de Datos (Fase 1)
*Modelos bajo nomenclatura híbrida de identificadores.*
- **Catálogos Paramétricos (`PK = SERIAL`):** `roles`, `categorias`, `lineas`, `marcas`, `colores`, `parametros_sistema`. (Nombres Singulares en Prisma, Plural_Snake en PostgreSQL).
- **Transaccionales Base (`PK = UUID`):** `usuarios`, `productos`, `ordenes_compra`, `producto_imagenes`.
- **Relaciones Especiales:**
    - Productos poseen una **ÚNICA** imagen principal forzada por Índice Parcial en Base de Datos.
    - Edición de stock actual permitida libremente en el MVP inicial.

## 4. Changelog / Log de Fases

### [Fase 3] - Módulos de Negocio: Catálogos + Productos (En Progreso)
- **Estado:** Bloque A y B iniciados.
- **Acciones:** Implementación de Productos (Read-Only) para integración con frontend.

### [Fase 1.3] - Módulo de Productos (Solo Lectura) (20 de Abril, 2026)
- **Estado:** Completada.
- **Decisiones Relevantes y Ejecución Física:**
  - Se configuró el prefijo global `/api` para todas las rutas del backend (excluyendo Swagger).
  - Se habilitó CORS para permitir peticiones desde el frontend en `http://localhost:5173`.
  - Se implementó `GET /api/productos` con paginación avanzada y 9 filtros dinámicos (categoría, línea, marca, búsqueda por texto, etc.).
  - Se implementó `GET /api/productos/:id` con detalle completo de colores, imágenes y datos de auditoría.
  - Se refactorizó el `seedDatabase` para homologar roles (`ADMIN`, `GERENTE`, `JEFE_COMPRA`) y poblar catálogos con datos de prueba reales y el producto `SUPER5`.
  - Todo el módulo fue documentado en Swagger con DTOs de entrada y salida descriptivos.

### [Fase 2] - Seguridad, Autenticación y Swagger (20 de Abril, 2026)
- **Estado:** Completada exitosamente.
- **Decisiones Relevantes y Ejecución Física:**
  - Se integró Swagger (`@nestjs/swagger`) en `main.ts`, accesible en `/api-docs` con soporte Bearer Auth.
  - Se configuró `ValidationPipe` global (`whitelist: true`, `forbidNonWhitelisted: true`) y `AllExceptionsFilter` global.
  - Se creó `UsersModule` y `UsersService` (búsqueda por email/id via Prisma).
  - Se implementó autenticación JWT con Passport: `LocalStrategy` (email/pass + bcrypt) y `JwtStrategy` (verificación Bearer).
  - Se creó `RolesGuard` para RBAC y decoradores `@Roles(...)` y `@CurrentUser()`.
  - Se creó endpoint `GET /auth/seed` que insertó los 3 roles del sistema (Admin, Jefe de Compras, Vendedor) y usuario `admin@coloxi.com` en la BD.
  - **Verificado en vivo:** Login real retorna JWT válido contra PostgreSQL.

### [Fase 1] - Modelado BD & Arquitectura (16 de Abril, 2026)
- **Estado:** Completada exitosamente.
- **Decisiones Relevantes y Ejecución Física:**
  - Se resolvió normalizar las taxonomías (Marcas, Líneas, Categorías).
  - Se postergó el uso de `JSONB` avanzado para auditoría; uso de campos simples MVP.
  - Ganancias negativas autorizadas para extrema flexibilidad de negocio.
  - **Ejecución Técnica:** Archivo `schema.prisma` escrito con relaciones 1:N, M:N y FK seguras (`ON DELETE RESTRICT`).
  - **Ejecución Técnica:** Variables de servidor `backend/.env` inyectadas.
  - **Ejecución Técnica:** Migración real `npx prisma migrate dev` disparada. PostgreSQL se orquestó creando tablas correctamente y el Prisma Client de Typescript fue enlazado a NestJS.

### [Fase 0] - Stack Tecnológico y Configuración (16 de Abril, 2026)
- **Estado:** Completada.
- **Decisiones Relevantes:**
  - Se descartó Docker inicial por practicidad operativa local (PostgreSQL Nativo).
  - Se seleccionó Prisma sobre TypeORM por su TypeSafety en finanzas y sus esquemas auditables de rápida iteración.
