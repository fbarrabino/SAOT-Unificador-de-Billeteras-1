/* ============================================================================
   Billeteras — Script de inicialización de la base de datos
   Unificador de Billeteras Virtuales · Equipo SAOT · Programación III · UTN FRRe
   ----------------------------------------------------------------------------
   Crea la base BilleterasDB, las 5 tablas del dominio y los seeds de catálogo.
   El script es idempotente: se puede correr varias veces sin romper nada.
   No crea usuario de prueba: el usuario se da de alta vía POST /api/auth/register.
   ============================================================================ */

-- 1) Crear la base si no existe -------------------------------------------------
IF DB_ID(N'BilleterasDB') IS NULL
    CREATE DATABASE BilleterasDB;
GO

USE BilleterasDB;
GO

-- 2) Tablas ---------------------------------------------------------------------

IF OBJECT_ID(N'dbo.Usuario', N'U') IS NULL
CREATE TABLE dbo.Usuario
(
    UsuarioId    INT IDENTITY(1,1) NOT NULL,
    Nombre       NVARCHAR(100)     NOT NULL,
    Apellido     NVARCHAR(100)     NOT NULL,
    Email        NVARCHAR(200)     NOT NULL,
    PasswordHash NVARCHAR(200)     NOT NULL,
    FechaAlta    DATETIME          NOT NULL CONSTRAINT DF_Usuario_FechaAlta DEFAULT (GETDATE()),
    EmailVerificado BIT            NOT NULL CONSTRAINT DF_Usuario_EmailVerificado DEFAULT (0),
    CONSTRAINT PK_Usuario PRIMARY KEY (UsuarioId),
    CONSTRAINT UQ_Usuario_Email UNIQUE (Email)
);
GO

-- A8: agrega EmailVerificado si la tabla Usuario ya existía de una corrida previa del script.
IF COL_LENGTH(N'dbo.Usuario', N'EmailVerificado') IS NULL
    ALTER TABLE dbo.Usuario ADD EmailVerificado BIT NOT NULL CONSTRAINT DF_Usuario_EmailVerificado DEFAULT (0);
GO

IF OBJECT_ID(N'dbo.Billetera', N'U') IS NULL
CREATE TABLE dbo.Billetera
(
    BilleteraId INT IDENTITY(1,1) NOT NULL,
    Nombre      NVARCHAR(100)     NOT NULL,
    LogoUrl     NVARCHAR(300)     NULL,
    CONSTRAINT PK_Billetera PRIMARY KEY (BilleteraId)
);
GO

IF OBJECT_ID(N'dbo.Categoria', N'U') IS NULL
CREATE TABLE dbo.Categoria
(
    CategoriaId INT IDENTITY(1,1) NOT NULL,
    Nombre      NVARCHAR(80)      NOT NULL,
    Tipo        NVARCHAR(20)      NOT NULL,   -- "Ingreso" | "Egreso"
    CONSTRAINT PK_Categoria PRIMARY KEY (CategoriaId)
);
GO

IF OBJECT_ID(N'dbo.CuentaBilletera', N'U') IS NULL
CREATE TABLE dbo.CuentaBilletera
(
    CuentaBilleteraId INT IDENTITY(1,1) NOT NULL,
    UsuarioId         INT               NOT NULL,
    BilleteraId       INT               NOT NULL,
    Alias             NVARCHAR(100)     NULL,
    SaldoActual       DECIMAL(18,2)     NOT NULL CONSTRAINT DF_CuentaBilletera_SaldoActual DEFAULT (0),
    FechaVinculacion  DATETIME          NOT NULL CONSTRAINT DF_CuentaBilletera_FechaVinculacion DEFAULT (GETDATE()),
    Estado            NVARCHAR(20)      NOT NULL CONSTRAINT DF_CuentaBilletera_Estado DEFAULT ('Activa'),
    CONSTRAINT PK_CuentaBilletera PRIMARY KEY (CuentaBilleteraId),
    CONSTRAINT FK_CuentaBilletera_Usuario   FOREIGN KEY (UsuarioId)   REFERENCES dbo.Usuario (UsuarioId)     ON DELETE NO ACTION,
    CONSTRAINT FK_CuentaBilletera_Billetera FOREIGN KEY (BilleteraId) REFERENCES dbo.Billetera (BilleteraId) ON DELETE NO ACTION
);
GO

-- Agregar columna Estado si ya existe la tabla (idempotente para BDs existentes)
IF COL_LENGTH(N'dbo.CuentaBilletera', N'Estado') IS NULL
    ALTER TABLE dbo.CuentaBilletera
    ADD Estado NVARCHAR(20) NOT NULL CONSTRAINT DF_CuentaBilletera_Estado DEFAULT ('Activa');
GO

IF OBJECT_ID(N'dbo.Movimiento', N'U') IS NULL
CREATE TABLE dbo.Movimiento
(
    MovimientoId      INT IDENTITY(1,1) NOT NULL,
    CuentaBilleteraId INT               NOT NULL,
    CategoriaId       INT               NOT NULL,
    Fecha             DATETIME          NOT NULL,
    Descripcion       NVARCHAR(250)     NULL,
    Monto             DECIMAL(18,2)     NOT NULL,
    Tipo              NVARCHAR(10)      NOT NULL,   -- "Ingreso" | "Egreso"
    CONSTRAINT PK_Movimiento PRIMARY KEY (MovimientoId),
    CONSTRAINT FK_Movimiento_CuentaBilletera FOREIGN KEY (CuentaBilleteraId) REFERENCES dbo.CuentaBilletera (CuentaBilleteraId) ON DELETE NO ACTION,
    CONSTRAINT FK_Movimiento_Categoria       FOREIGN KEY (CategoriaId)       REFERENCES dbo.Categoria (CategoriaId)             ON DELETE NO ACTION
);
GO

-- 3) Seeds de catálogo ----------------------------------------------------------

-- Billeteras del mercado argentino (Actualizado B4-Seed)
INSERT INTO dbo.Billetera (Nombre)
SELECT Nombre FROM (VALUES 
    (N'Mercado Pago'),
    (N'Ualá'),
    (N'Brubank'),
    (N'Naranja X'),
    (N'Personal Pay'),
    (N'Reba'),
    (N'Belo'),
    (N'Cuenta DNI'),
    (N'MODO'),
    (N'Lemon')
) AS v(Nombre)
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.Billetera b WHERE b.Nombre = v.Nombre
);
GO

-- Categorías de movimientos
IF NOT EXISTS (SELECT 1 FROM dbo.Categoria)
INSERT INTO dbo.Categoria (Nombre, Tipo) VALUES
    (N'Sueldo',                 N'Ingreso'),
    (N'Transferencia recibida', N'Ingreso'),
    (N'Alimentos',              N'Egreso'),
    (N'Transporte',             N'Egreso'),
    (N'Servicios',              N'Egreso'),
    (N'Ocio',                   N'Egreso'),
    (N'Otros',                  N'Egreso');
GO

-- ===================================================================
-- EXTENSIÓN DEL MODELO DE DATOS (BE-01) - TFI UTN FRRe
-- Desarrollado por: Franco Barrabino
-- Objetivo: Alcanzar las 20 tablas, relaciones N-N y campo JSON.
-- ===================================================================

-- 1. MÓDULO DE SEGURIDAD (Requisito para BE-11)
IF OBJECT_ID(N'dbo.Rol', N'U') IS NULL
CREATE TABLE [dbo].[Rol] (
    [RolId] INT IDENTITY(1,1) PRIMARY KEY,
    [Nombre] VARCHAR(50) NOT NULL UNIQUE,
    [Descripcion] VARCHAR(255) NULL
);
GO

IF OBJECT_ID(N'dbo.UsuarioRol', N'U') IS NULL
CREATE TABLE [dbo].[UsuarioRol] (
    [UsuarioId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Usuario]([UsuarioId]),
    [RolId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Rol]([RolId]),
    PRIMARY KEY ([UsuarioId], [RolId])
);
GO

-- 2. MÓDULO DE RED Y CONTACTOS (Requisito para BE-03)
IF OBJECT_ID(N'dbo.Contacto', N'U') IS NULL
CREATE TABLE [dbo].[Contacto] (
    [UsuarioPropietarioId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Usuario]([UsuarioId]),
    [UsuarioContactoId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Usuario]([UsuarioId]),
    [AliasPersonalizado] VARCHAR(50) NULL,
    [FechaAgregado] DATETIME DEFAULT GETDATE(),
    PRIMARY KEY ([UsuarioPropietarioId], [UsuarioContactoId])
);
GO

-- 3. MÓDULO DE COMERCIOS Y PAGOS QR (Requisito para BE-05)
IF OBJECT_ID(N'dbo.Comercio', N'U') IS NULL
CREATE TABLE [dbo].[Comercio] (
    [ComercioId] INT IDENTITY(1,1) PRIMARY KEY,
    [RazonSocial] VARCHAR(100) NOT NULL,
    [Cuit] VARCHAR(20) NOT NULL UNIQUE
);
GO

IF OBJECT_ID(N'dbo.Sucursal', N'U') IS NULL
CREATE TABLE [dbo].[Sucursal] (
    [SucursalId] INT IDENTITY(1,1) PRIMARY KEY,
    [ComercioId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Comercio]([ComercioId]),
    [Direccion] VARCHAR(200) NOT NULL,
    [CodigoQRBase] VARCHAR(255) NOT NULL UNIQUE
);
GO

IF OBJECT_ID(N'dbo.ComercioBilletera', N'U') IS NULL
CREATE TABLE [dbo].[ComercioBilletera] (
    [ComercioId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Comercio]([ComercioId]),
    [BilleteraId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Billetera]([BilleteraId]),
    [TasaComision] DECIMAL(5,2) DEFAULT 0,
    PRIMARY KEY ([ComercioId], [BilleteraId])
);
GO

-- 4. MÓDULO DE SOLICITUDES DE PAGO/COBRO (Requisito para BE-06)
IF OBJECT_ID(N'dbo.SolicitudCobro', N'U') IS NULL
CREATE TABLE [dbo].[SolicitudCobro] (
    [SolicitudId] INT IDENTITY(1,1) PRIMARY KEY,
    [UsuarioSolicitanteId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Usuario]([UsuarioId]),
    [MontoTotal] DECIMAL(18,2) NOT NULL,
    [FechaVencimiento] DATETIME NOT NULL,
    [Estado] VARCHAR(20) DEFAULT 'Pendiente'
);
GO

IF OBJECT_ID(N'dbo.SolicitudCobroDetalle', N'U') IS NULL
CREATE TABLE [dbo].[SolicitudCobroDetalle] (
    [DetalleSolicitudId] INT IDENTITY(1,1) PRIMARY KEY,
    [SolicitudId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[SolicitudCobro]([SolicitudId]),
    [UsuarioDeudorId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Usuario]([UsuarioId]),
    [MontoMita] DECIMAL(18,2) NOT NULL,
    [Pagado] BIT DEFAULT 0
);
GO

-- 5. MÓDULO DE SOPORTE TÉCNICO (Requisito para BE-07)
IF OBJECT_ID(N'dbo.MotivoReporte', N'U') IS NULL
CREATE TABLE [dbo].[MotivoReporte] (
    [MotivoId] INT IDENTITY(1,1) PRIMARY KEY,
    [Titulo] VARCHAR(100) NOT NULL,
    [Gravedad] INT DEFAULT 1
);
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[MotivoReporte])
INSERT INTO [dbo].[MotivoReporte] ([Titulo], [Gravedad]) VALUES
    ('Pagos', 1),
    ('Billeteras', 1),
    ('Cuenta', 1),
    ('Otro', 1);
GO

IF OBJECT_ID(N'dbo.TicketSoporte', N'U') IS NULL
CREATE TABLE [dbo].[TicketSoporte] (
    [TicketId] INT IDENTITY(1,1) PRIMARY KEY,
    [UsuarioId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Usuario]([UsuarioId]),
    [MotivoId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[MotivoReporte]([MotivoId]),
    [FechaCreacion] DATETIME DEFAULT GETDATE(),
    [Estado] VARCHAR(20) DEFAULT 'Abierto'
);
GO

IF OBJECT_ID(N'dbo.TicketMensaje', N'U') IS NULL
CREATE TABLE [dbo].[TicketMensaje] (
    [MensajeId] INT IDENTITY(1,1) PRIMARY KEY,
    [TicketId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[TicketSoporte]([TicketId]),
    [RemitenteEsSoporte] BIT DEFAULT 0,
    [CuerpoMensaje] TEXT NOT NULL,
    [FechaEnvio] DATETIME DEFAULT GETDATE()
);
GO

IF OBJECT_ID(N'dbo.TicketAdjunto', N'U') IS NULL
CREATE TABLE [dbo].[TicketAdjunto] (
    [AdjuntoId] INT IDENTITY(1,1) PRIMARY KEY,
    [MensajeId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[TicketMensaje]([MensajeId]),
    [UrlArchivo] VARCHAR(MAX) NOT NULL,
    [TipoMime] VARCHAR(50) NOT NULL
);
GO

-- Códigos de 6 dígitos para reset de contraseña / verificación de email (A3/A4/A8).
IF OBJECT_ID(N'dbo.CodigoVerificacion', N'U') IS NULL
CREATE TABLE [dbo].[CodigoVerificacion] (
    [CodigoId] INT IDENTITY(1,1) PRIMARY KEY,
    [UsuarioId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Usuario]([UsuarioId]),
    [Codigo] VARCHAR(6) NOT NULL,
    [Tipo] VARCHAR(30) NOT NULL,
    [ExpiraEn] DATETIME NOT NULL,
    [Usado] BIT NOT NULL DEFAULT 0,
    [FechaCreacion] DATETIME DEFAULT GETDATE()
);
GO

-- Una fila por login exitoso: dispositivos conectados / revocar sesiones (D7).
IF OBJECT_ID(N'dbo.UsuarioSesion', N'U') IS NULL
CREATE TABLE [dbo].[UsuarioSesion] (
    [SesionId] INT IDENTITY(1,1) PRIMARY KEY,
    [UsuarioId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Usuario]([UsuarioId]),
    [DispositivoNombre] VARCHAR(150) NULL,
    [IpUltimoLogin] VARCHAR(45) NULL,
    [FechaCreacion] DATETIME NOT NULL DEFAULT GETDATE(),
    [UltimaActividad] DATETIME NOT NULL DEFAULT GETDATE(),
    [JwtJti] VARCHAR(100) NOT NULL,
    [Activa] BIT NOT NULL DEFAULT 1
);
GO

-- 6. MÓDULO DE MÉTODOS DE PAGO Y NOTIFICACIONES
IF OBJECT_ID(N'dbo.Notificacion', N'U') IS NULL
CREATE TABLE [dbo].[Notificacion] (
    [NotificacionId] INT IDENTITY(1,1) PRIMARY KEY,
    [UsuarioId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Usuario]([UsuarioId]),
    [Titulo] VARCHAR(100) NOT NULL,
    [Mensaje] VARCHAR(255) NOT NULL,
    [Leida] BIT DEFAULT 0,
    [FechaEmision] DATETIME DEFAULT GETDATE()
);
GO

IF OBJECT_ID(N'dbo.MetodoPagoExterno', N'U') IS NULL
CREATE TABLE [dbo].[MetodoPagoExterno] (
    [MetodoId] INT IDENTITY(1,1) PRIMARY KEY,
    [UsuarioId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Usuario]([UsuarioId]),
    [Tipo] VARCHAR(50) NOT NULL,
    [UltimosCuatro] CHAR(4) NOT NULL,
    [EntidadEmisora] VARCHAR(100) NOT NULL
);
GO

-- 7. REQUERIMIENTO TPI CLASE 7: ALTER TABLE PARA CAMPO JSON
-- Nota Franco: Se agrega a la tabla Movimiento (creada por Lautaro/Fabri)
-- IMPORTANTE: GO entre las dos ALTER. Sin él, el parser de T-SQL no ve la
-- columna MetadataExtranjera al compilar la CHECK y rechaza todo el batch.
IF COL_LENGTH(N'dbo.Movimiento', N'MetadataExtranjera') IS NULL
    ALTER TABLE [dbo].[Movimiento] ADD [MetadataExtranjera] NVARCHAR(MAX) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CHK_Movimiento_Metadata_JSON')
    ALTER TABLE [dbo].[Movimiento] ADD CONSTRAINT [CHK_Movimiento_Metadata_JSON] CHECK (ISJSON([MetadataExtranjera]) = 1);
GO

-- 7b. SEEDS DE ROLES (BE-11)
-- Mínimo necesario para que [Authorize(Roles="...")] tenga datos contra los que matchear.
IF NOT EXISTS (SELECT 1 FROM dbo.Rol WHERE Nombre = N'User')
    INSERT INTO dbo.Rol (Nombre, Descripcion) VALUES (N'User', N'Usuario final de la app');
IF NOT EXISTS (SELECT 1 FROM dbo.Rol WHERE Nombre = N'Admin')
    INSERT INTO dbo.Rol (Nombre, Descripcion) VALUES (N'Admin', N'Operador con acceso administrativo');
GO

-- 8. ANULACIÓN DE MOVIMIENTOS (BE-09)
-- Flag + timestamp para anular operaciones sin perder la traza original.
-- La reversión de saldo se ejecuta en la misma transacción desde la API.
IF COL_LENGTH(N'dbo.Movimiento', N'Anulado') IS NULL
    ALTER TABLE [dbo].[Movimiento] ADD [Anulado] BIT NOT NULL CONSTRAINT [DF_Movimiento_Anulado] DEFAULT (0);
GO
IF COL_LENGTH(N'dbo.Movimiento', N'FechaAnulacion') IS NULL
    ALTER TABLE [dbo].[Movimiento] ADD [FechaAnulacion] DATETIME NULL;
GO

-- =================================================================
-- MÓDULO DE AUDITORÍA (TAREA BE-10), Franco
-- =================================================================

-- 1. Crear tabla de Auditoría (idempotente)
IF OBJECT_ID(N'dbo.Auditoria', N'U') IS NULL
CREATE TABLE Auditoria (
    AuditoriaId INT IDENTITY(1,1) PRIMARY KEY,
    TablaAfectada NVARCHAR(50) NOT NULL,
    Accion NVARCHAR(10) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    UsuarioBaseDatos NVARCHAR(100) DEFAULT SUSER_SNAME(),
    Fecha DATETIME DEFAULT GETDATE(),
    Detalle NVARCHAR(MAX) -- Se guardará un JSON con los datos afectados
);
GO

-- 2. Trigger para la tabla Movimiento (nombre real de la tabla, sin 's')
IF OBJECT_ID(N'dbo.trg_Auditar_Movimientos', N'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_Auditar_Movimientos;
GO
CREATE TRIGGER trg_Auditar_Movimientos
ON dbo.Movimiento
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Accion NVARCHAR(10);

    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        SET @Accion = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted)
        SET @Accion = 'INSERT';
    ELSE IF EXISTS (SELECT * FROM deleted)
        SET @Accion = 'DELETE';
    ELSE
        RETURN;

    INSERT INTO Auditoria (TablaAfectada, Accion, Detalle)
    VALUES (
        'Movimiento',
        @Accion,
        (SELECT * FROM inserted FOR JSON AUTO)
    );
END;
GO

-- 3. Trigger para la tabla CuentaBilletera (nombre real de la tabla, sin 's')
IF OBJECT_ID(N'dbo.trg_Auditar_CuentasBilletera', N'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_Auditar_CuentasBilletera;
GO
CREATE TRIGGER trg_Auditar_CuentasBilletera
ON dbo.CuentaBilletera
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Accion NVARCHAR(10);

    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        SET @Accion = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted)
        SET @Accion = 'INSERT';
    ELSE IF EXISTS (SELECT * FROM deleted)
        SET @Accion = 'DELETE';
    ELSE
        RETURN;

    INSERT INTO Auditoria (TablaAfectada, Accion, Detalle)
    VALUES (
        'CuentaBilletera',
        @Accion,
        (SELECT * FROM inserted FOR JSON AUTO)
    );
END;
GO