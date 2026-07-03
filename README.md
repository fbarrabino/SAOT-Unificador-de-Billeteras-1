# Unificador de Billeteras Virtuales (SaOT)

> Proyecto académico del equipo para la materia **Programación III**
> Tecnicatura Universitaria en Programación · UTN FRRe · Ciclo 2026

## De qué trata el proyecto

Hoy una persona promedio en Argentina tiene su dinero repartido entre varias billeteras
virtuales: cobra el sueldo en una, paga el transporte con otra, junta puntos en una tercera.
El resultado es que **nadie tiene una foto clara de cuánta plata tiene ni en qué la gasta**:
hay que abrir cinco apps distintas y sumar a mano.

El **Unificador de Billeteras Virtuales** (SaOT) resuelve ese problema. Es un sistema que le
permite a un usuario **consolidar en una única vista** las cuentas y los movimientos que tiene
en distintas billeteras virtuales. El usuario vincula sus cuentas (Mercado Pago, Ualá, Brubank,
Naranja X, Personal Pay, etc.), registra y opera sus movimientos clasificados por categoría
(enviar, cambiar, pagar QR, pedir cobros) y obtiene un panorama unificado de sus saldos y de su
actividad financiera.

## Estado actual del proyecto

  **API REST en .NET 10 (ASP.NET Core)** con autenticación **JWT**, roles (`User` / `Admin`),
  hash de contraseñas **BCrypt**, **CORS** abierto y toda la configuración (connection strings
  SQL Server / Neo4j + parámetros JWT) leída desde `appsettings.json` vía `IConfiguration`.

  **Modelo de datos relacional de 20 tablas** en **SQL Server**: las 5 del dominio base más la
  extensión de seguridad/roles, red de contactos, comercios y sucursales, solicitudes de cobro,
  soporte técnico, notificaciones, métodos de pago externos y auditoría. Incluye **10+ relaciones
  1‑N**, **3 relaciones N‑N** (UsuarioRol, Contacto, ComercioBilletera), un **campo JSON** con
  CHECK constraint (`Movimiento.MetadataExtranjera`) y **triggers de auditoría** que registran
  INSERT/UPDATE/DELETE sobre `Movimiento` y `CuentaBilletera`. Dos enfoques de acceso a datos en
  paralelo: **ADO.NET puro** y **Entity Framework Core**, intercambiables por DI.

  **Operaciones transaccionales** (Enviar, Cambiar entre wallets, Pagar QR, Vincular billetera,
  Anular movimiento, Pagar solicitud) bajo `IDbContextTransaction` con `Commit` / `Rollback`:
  validan saldo y categoría, insertan movimiento(s) y actualizan saldo dentro de la misma
  transacción.

  **Base de grafos Neo4j** que complementa el modelo relacional para consultas de red (quién
  transfiere a quién, comercios frecuentes, billeteras en común). Tras cada operación SQL exitosa
  un hook de Negocio espeja el evento en el grafo; si Neo4j falla, la operación financiera no se
  rompe (SQL es la fuente de verdad).

  **App móvil Expo + React Native + TypeScript** con navegación **Expo Router**: onboarding con
  registro/login/recuperación, dashboard con balance consolidado, vínculo de billeteras, detalle
  por proveedor, flujos de Enviar / Pedir (QR real) / Cambiar / Pagar QR (cámara real),
  confirmación con **biometría** (Face ID / huella), perfil, soporte y reportes.

## Equipo

Equipo — alumnos de la TUP, UTN FRRe.
- Fabricio Thompson
- Franco Barrabino
- Lautaro Oporto

## Stack técnico

| Categoría        | Tecnología                                                |
|------------------|-----------------------------------------------------------|
| Backend          | .NET 10 (ASP.NET Core Web API)                            |
| Lenguaje BE      | C# 14 (incluido en .NET 10)                               |
| Base relacional  | SQL Server (Express 2022/2025, instancia `SQLEXPRESS`)    |
| Acceso a datos   | ADO.NET (`Microsoft.Data.SqlClient`) + EF Core 10         |
| Base de grafos   | Neo4j (Neo4j Desktop, `bolt://localhost:7687`)           |
| Driver grafo     | `Neo4j.Driver` (singleton, `IAsyncDisposable`)            |
| Auth             | JWT (`Microsoft.AspNetCore.Authentication.JwtBearer`)     |
| Hash de pwd      | BCrypt.Net-Next                                           |
| Frontend         | Expo SDK 54 · React Native 0.81 · TypeScript             |
| Navegación FE    | Expo Router (file-based)                                  |
| Gestor paquetes  | pnpm (frontend) · NuGet (backend)                        |

## Arquitectura

```
┌──────────────────────────────────────────────────────────┐
│                   Frontend (Expo / RN)                    │  ← App móvil iOS/Android/Web
│        (Expo Router · WalletsContext · API client)        │
└───────────────────────────┬───────────────────────────────┘
                            │ HTTP / JSON (REST)
┌───────────────────────────▼───────────────────────────────┐
│               Billeteras.Apps.WebApiApp                   │  ← Capa de Presentación
│         (Controllers · JWT · DI · Neo4j bootstrap)        │
└───────────────────────────┬───────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────┐
│                Billeteras.Negocio                         │  ← Capa de Negocio
│        (Servicios, DTOs, hooks Neo4j post-commit)         │
└───────────────────────────┬───────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
┌─────────────▼──────────┐  ┌─────────────▼──────────────┐
│   Billeteras.Datos     │  │     Billeteras.DatosEF      │  ← Capa de Datos
│   (ADO.NET puro)       │  │  (EF Core + transacciones)  │     (dos implementaciones)
└─────────────┬──────────┘  └─────────────┬──────────────┘
              └─────────────┬─────────────┘
                  ┌─────────▼──────────┐
                  │ Billeteras.Entidades│  ← POCOs compartidos
                  └─────────────────────┘

        ┌─────────────────────┐     ┌─────────────────────┐
        │     SQL Server      │     │       Neo4j         │
        │  (fuente de verdad) │     │  (espejo de red)    │
        └─────────────────────┘     └─────────────────────┘
```

Las **interfaces de repositorio** viven en `Billeteras.Datos/Interfaces`; las implementan tanto
la versión **ADO** como la **EF Core**, intercambiables desde `Program.cs` vía DI (por defecto
EF Core).

## Modelo de datos

El modelo completo (20 tablas, relaciones, claves) está documentado con diagramas en
**[`backend/db/MODELO-DATOS.md`](backend/db/MODELO-DATOS.md)** — incluye el **MER** (modelo
entidad‑relación) y el **MR** (modelo relacional). Para verlos/editarlos de forma gráfica hay
dos archivos **draw.io** separados:

- **[`backend/db/MER.drawio`](backend/db/MER.drawio)** — MER en notación Chen (entidades,
  rombos de relación, atributos en óvalos con la PK subrayada, cardinalidades `(1,1)`/`(1,n)`
  y tipo `1:N` / `N:M`).
- **[`backend/db/MR.drawio`](backend/db/MR.drawio)** — MR con las 20 tablas en formato ER de
  draw.io (`PK`, `FK1`, `FK2`…) y flechas a la tabla referenciada.

Abrilos en [app.diagrams.net](https://app.diagrams.net) o con la extensión Draw.io de VS Code.
El script de creación es
**[`backend/db/init.sql`](backend/db/init.sql)**, idempotente (`IF OBJECT_ID … IS NULL`,
`IF COL_LENGTH … IS NULL`, `IF NOT EXISTS …`): se puede correr varias veces sin romper nada.

Resumen de los módulos:

| Módulo | Tablas |
|---|---|
| Dominio base | `Usuario`, `Billetera`, `Categoria`, `CuentaBilletera`, `Movimiento` |
| Seguridad / roles | `Rol`, `UsuarioRol` (N‑N) |
| Red de contactos | `Contacto` (N‑N usuario↔usuario) |
| Comercios y QR | `Comercio`, `Sucursal`, `ComercioBilletera` (N‑N) |
| Solicitudes de cobro | `SolicitudCobro`, `SolicitudCobroDetalle` |
| Soporte técnico | `MotivoReporte`, `TicketSoporte`, `TicketMensaje`, `TicketAdjunto` |
| Notificaciones / métodos | `Notificacion`, `MetodoPagoExterno` |
| Auditoría | `Auditoria` (+ triggers sobre `Movimiento` y `CuentaBilletera`) |

## Endpoints expuestos

### Autenticación — `AuthController`

| Método | Ruta                 | Descripción                                  | Auth     |
|--------|----------------------|----------------------------------------------|----------|
| POST   | `/api/auth/register` | Registra un usuario (email único + BCrypt)   | Público  |
| POST   | `/api/auth/login`    | Valida credenciales y devuelve JWT con roles | Público  |
| GET    | `/api/auth/me`       | Devuelve el usuario del token                | 🔒 JWT   |

### Operaciones transaccionales — `OperacionesController`

| Método | Ruta                                     | Descripción                                          | Auth   |
|--------|------------------------------------------|------------------------------------------------------|--------|
| POST   | `/api/operaciones/enviar`                | Egreso desde una cuenta (movimiento + saldo)         | 🔒 JWT |
| POST   | `/api/operaciones/cambiar`               | Cambio entre 2 wallets del usuario (2 movs + 2 saldos)| 🔒 JWT |
| POST   | `/api/operaciones/pagar-qr`              | Pago a comercio (egreso + saldo + metadata JSON QR)  | 🔒 JWT |
| POST   | `/api/operaciones/{movimientoId}/anular` | Anula un movimiento y revierte el saldo              | 🔒 JWT |

### Cuentas / vínculo de billeteras — `CuentasBilleteraController`

| Método | Ruta                                       | Descripción                                  | Auth          |
|--------|--------------------------------------------|----------------------------------------------|---------------|
| GET    | `/api/cuentas-billetera/me`                | Cuentas activas del usuario autenticado      | 🔒 JWT        |
| POST   | `/api/cuentas-billetera/vincular`          | Vincula una billetera al usuario (BE‑08)     | 🔒 JWT        |
| DELETE | `/api/cuentas-billetera/{id}/desvincular`  | Desvincula (soft‑delete) una cuenta propia   | 🔒 JWT        |
| GET    | `/api/cuentas-billetera`                   | Todas las cuentas (cross‑user)               | 🔒 Admin      |

### Otros módulos

| Módulo | Rutas | Auth |
|--------|-------|------|
| Movimientos | `GET /api/movimientos/me`, `GET/POST/PUT/DELETE /api/movimientos/*` | 🔒 JWT (lista: Admin) |
| Contactos | `GET /api/contactos/{usuarioPropietarioId}`, `POST /api/contactos`, `DELETE /api/contactos/{prop}/{contacto}` | 🔒 JWT |
| Solicitudes de cobro | `GET /api/solicitudes-cobro/me`, `GET /{id}`, `POST`, `PUT /lineas/{detalleId}/pagar` | 🔒 JWT |
| Soporte | `GET /api/tickets-soporte/me`, `GET /{id}`, `POST /api/tickets-soporte` | 🔒 JWT |
| Métodos de pago | `GET /api/metodos-pago/usuario/{usuarioId}`, `POST`, `DELETE /{id}` | 🔒 JWT |
| Usuarios | `GET/PUT/DELETE /api/usuarios/*` | 🔒 JWT (lista/delete: Admin) |
| Catálogos | `GET /api/billeteras`, `GET /api/categorias` | Público |
| Prueba de auth | `GET /api/time`, `GET /api/time/secure` | Público / 🔒 JWT |

## Cómo correrlo en local (paso a paso)

### 0) Requisitos previos

Instalá (una sola vez):

- **.NET SDK 10** → https://dotnet.microsoft.com/download
- **SQL Server Express** (2022 o 2025) → instancia por defecto `localhost\SQLEXPRESS`
- **SQL Server Management Studio (SSMS)** → para correr el script de la base
- **Neo4j Desktop** → https://neo4j.com/download (creá una instancia local y arrancala)
- **Node.js 20+** y **pnpm** → `npm install -g pnpm`
- **Expo Go** en el celular (App Store / Play Store) para probar en dispositivo

---

### 1) Crear la base de datos (SQL Server)

1. Abrí **SSMS** y conectate a tu instancia (`localhost\SQLEXPRESS`, Windows Auth, marcá
   *Trust server certificate*).
2. Menú **File → Open → File…** y abrí
   `backend/db/init.sql`.
3. Apretá **Execute (F5)**. Crea la base `BilleterasDB`, las 20 tablas, los seeds (billeteras,
   categorías, roles, motivos de soporte) y los triggers de auditoría. El script es idempotente:
   si lo corrés de nuevo no rompe nada.

---

### 2) Configurar el backend — **qué cambiar exactamente**

Editá **dos archivos** y cambiá estos valores por los tuyos:

**a) `backend/Billeteras.Apps.WebApiApp/appsettings.json`**

```jsonc
"ConnectionStrings": {
  // Cambiá "Server=FRANCO" por el nombre de TU servidor SQL.
  // Si usás SQL Express local, normalmente es: localhost\SQLEXPRESS
  "BilleterasDB": "Server=localhost\\SQLEXPRESS;Database=BilleterasDB;Integrated Security=True;TrustServerCertificate=True;"
},
"Neo4j": {
  "Uri": "bolt://localhost:7687",
  "User": "neo4j",
  // Cambiá esto por la contraseña que pusiste al crear la instancia Neo4j.
  "Password": "TU_PASSWORD_NEO4J"
}
```

> Nota: en JSON la barra invertida se escribe doble → `localhost\\SQLEXPRESS`.

**b) `backend/Billeteras.Apps.WebApiApp/appsettings.Development.json`**

```jsonc
"ConnectionStrings": {
  "BilleterasDB": "Server=localhost\\SQLEXPRESS;Database=BilleterasDB;Integrated Security=True;TrustServerCertificate=True;"
}
```

> Si **no** vas a usar Neo4j, no pasa nada: la API arranca igual y solo loguea un aviso. El resto
> funciona contra SQL Server.

---

### 3) Levantar el backend

En una terminal:

```bash
cd backend/Billeteras.Apps.WebApiApp
dotnet run --launch-profile http
```

Queda escuchando en **http://localhost:5001**. Para probar que anda, en el navegador o con curl:

```bash
curl http://localhost:5001/api/billeteras
# Debe devolver el JSON con Mercado Pago, Ualá, Brubank, Naranja X, Personal Pay.
```

> Para probar desde el **celular**, el backend tiene que escuchar en tu red. El perfil `http` ya
> usa `http://0.0.0.0:5001` (todas las interfaces). La primera vez Windows va a pedir permiso de
> firewall → **Permitir acceso** en redes privadas.

---

### 4) Configurar y levantar el frontend

**a)** Apuntá la app a tu backend. Editá `Frontend/src/api/client.ts`:

```ts
// Para probar en el navegador (web):
export const BASE_URL = 'http://localhost:5001';

// Para probar en el CELULAR con Expo Go, poné la IP LAN de tu PC:
// (en Windows: `ipconfig` → "Dirección IPv4". Ej: 192.168.0.4)
export const BASE_URL = 'http://192.168.0.4:5001';
```

> Esa IP es de cada dev — **no la commitees**. PC y celular tienen que estar en la **misma WiFi**.

**b)** Instalá dependencias y arrancá Metro:

```bash
cd Frontend
pnpm install
pnpm start          # equivale a: expo start --lan
```

**c)** Abrí la app:
- **Celular**: escaneá el QR que aparece en la terminal con **Expo Go**.
- **Web**: apretá `w` en la terminal de Metro.
- Si algo quedó cacheado raro: `pnpm start -- --clear`.

---

### 5) Probar el flujo

1. **Crear cuenta** → te lleva al login con el email precargado.
2. **Ingresar** con esas credenciales.
3. **Conectar billetera** → elegí una y seguí el flujo (permisos → sincronizando → activa).
4. Operá: **Enviar / Pedir (QR) / Cambiar / Pagar QR** (pide biometría antes de confirmar).

---

### 6) (Opcional) Poblar el grafo Neo4j

Con la instancia Neo4j arrancada, la API crea los constraints sola al iniciar. Para cargar datos
de demo y ver el grafo, abrí el **Neo4j Browser** y ejecutá
`backend/db/neo4j/seed_demo.cypher`. Las consultas de negocio están en
`backend/db/neo4j/queries_demo.cypher`. Más detalle en `backend/db/neo4j/README.md`.

## Estructura del repositorio

```
SAOT-Unificador-de-Billeteras-1/
├── Billeteras.sln
├── README.md                                  # Este archivo
├── backend/
│   ├── db/
│   │   ├── init.sql                           # Creación idempotente de SQL Server (20 tablas)
│   │   ├── MODELO-DATOS.md                    # MER + MR (diagramas de la base)
│   │   ├── seed_test.sql                      # Datos de prueba opcionales
│   │   └── neo4j/                             # Scripts Cypher + README (BD-04)
│   ├── Billeteras.Entidades/                  # POCOs del dominio
│   ├── Billeteras.Datos/                      # Interfaces de repo + implementación ADO.NET
│   ├── Billeteras.DatosEF/                    # DbContext + implementación EF Core
│   ├── Billeteras.Negocio/                    # Servicios + DTOs + Neo4jService
│   └── Billeteras.Apps.WebApiApp/             # Web API: Program.cs, Controllers, DTOs
└── Frontend/
    ├── app/                                   # Expo Router (file-based)
    │   ├── (auth)/        login / registro / recuperar contraseña
    │   ├── (tabs)/        home / billeteras / actividad / perfil
    │   ├── (details)/     detalle, conectar, perfil, seguridad, soporte, reportes
    │   ├── (send)/        flujo Enviar
    │   ├── (request)/     flujo Pedir (QR real)
    │   ├── (exchange)/    flujo Cambiar
    │   └── (payqr)/       flujo Pagar QR (cámara real)
    └── src/
        ├── api/           client.ts + servicios (auth, cuentas, operaciones, soporte…)
        ├── components/    piezas reusables
        ├── context/       SessionContext, WalletsContext
        ├── data/          tipos + mocks de desarrollo
        ├── theme/         tokens de diseño
        └── utils/         format, biometrics, helpers
```

## Roadmap (trabajos prácticos del cuatrimestre)

| TP    | Descripción                                                    | Estado      |
|-------|----------------------------------------------------------------|-------------|
| TP-01 | Definición del dominio y prototipo de interfaz                 | ✅ Hecho     |
| TP-02 | Configuración del backend y autenticación                      | ✅ Hecho     |
| TP-03 | Integración Frontend–Backend                                   | ✅ Hecho     |
| TP-04 | Modelo de datos y primeras operaciones CRUD                    | ✅ Hecho     |
| TP-05 | Entidades principales e integración de interfaces              | ✅ Hecho     |
| TP-06 | Operaciones maestro‑detalle y transacciones                    | ✅ Hecho     |
| TP-07 | Flujos operativos complejos y control de estados               | ✅ Hecho     |
| TP-08 | Seguridad y control de acceso                                  | ✅ Hecho     |
| TP-09 | Consultas avanzadas, filtros y reportes (incluye Neo4j BD‑04)  | 🔄 En curso |
| TP-10 | Documentación técnica de la API y pruebas                      | 🔄 En curso |
| TP-11 | Mejora de UX y optimización                                    | Pendiente   |
| TP-12 | Presentación preliminar (pre‑entrega)                          | Pendiente   |
