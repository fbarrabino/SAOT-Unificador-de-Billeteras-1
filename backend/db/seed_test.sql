/* ============================================================================
   seed_test.sql — Datos de prueba para SaOT
   ----------------------------------------------------------------------------
   INSTRUCCIONES:
   1. Correr init.sql primero (crea tablas y billeteras base)
   2. Registrar el usuario de prueba vía POST /api/auth/register
      (ver auth.http) — esto genera el hash BCrypt correctamente
   3. Recién después correr ESTE script

   El script asume que el usuario de prueba tiene UsuarioId = 1.
   Si creaste otros usuarios antes, cambiá la variable @UsuarioId abajo.

   ⚠️ ENCODING: este archivo es UTF-8 (tiene acentos: María, Pérez, etc.).
   - Con SSMS: se lee bien (respeta UTF-8), no hay que hacer nada.
   - Con sqlcmd: usá el flag -f 65001  →  sqlcmd -f 65001 -S ... -i seed_test.sql
     Sin ese flag, sqlcmd lo lee como Latin-1 y guarda los acentos corruptos
     ("Pérez" → "PÃ©rez"), que en la app se ven como letras raras.
   ============================================================================ */

USE BilleterasDB;
GO

-- ── 0. Agregar Lemon al catálogo (faltaba en init.sql) ────────────────────────
IF NOT EXISTS (SELECT 1 FROM dbo.Billetera WHERE Nombre = N'Lemon')
    INSERT INTO dbo.Billetera (Nombre) VALUES (N'Lemon');
GO

-- ── 1. Variables de configuración ─────────────────────────────────────────────
-- Cambiá @UsuarioId si el usuario de prueba no es el primero registrado.
-- Para verificarlo: SELECT UsuarioId, Email FROM dbo.Usuario;
DECLARE @UsuarioId INT = 1;

-- IDs de las billeteras (dependen del orden de inserción de init.sql)
DECLARE @IdMP  INT = (SELECT BilleteraId FROM dbo.Billetera WHERE Nombre = N'Mercado Pago');
DECLARE @IdUA  INT = (SELECT BilleteraId FROM dbo.Billetera WHERE Nombre = N'Ualá');
DECLARE @IdLM  INT = (SELECT BilleteraId FROM dbo.Billetera WHERE Nombre = N'Lemon');

-- IDs de categorías
DECLARE @CatSueldo    INT = (SELECT CategoriaId FROM dbo.Categoria WHERE Nombre = N'Sueldo');
DECLARE @CatTransfIn  INT = (SELECT CategoriaId FROM dbo.Categoria WHERE Nombre = N'Transferencia recibida');
DECLARE @CatAlimentos INT = (SELECT CategoriaId FROM dbo.Categoria WHERE Nombre = N'Alimentos');
DECLARE @CatTransporte INT= (SELECT CategoriaId FROM dbo.Categoria WHERE Nombre = N'Transporte');
DECLARE @CatServicios INT = (SELECT CategoriaId FROM dbo.Categoria WHERE Nombre = N'Servicios');
DECLARE @CatOcio      INT = (SELECT CategoriaId FROM dbo.Categoria WHERE Nombre = N'Ocio');
DECLARE @CatOtros     INT = (SELECT CategoriaId FROM dbo.Categoria WHERE Nombre = N'Otros');

-- ── 2. Cuentas vinculadas al usuario ──────────────────────────────────────────
-- Limpiamos para poder re-correr el seed sin duplicados.
-- ORDEN OBLIGATORIO: respetar las FKs (hijos antes que padres).

-- 2a. SolicitudCobroDetalle referencia Movimiento → borrar primero
DELETE FROM dbo.SolicitudCobroDetalle
WHERE MovimientoId IN (
    SELECT MovimientoId FROM dbo.Movimiento
    WHERE CuentaBilleteraId IN (
        SELECT CuentaBilleteraId FROM dbo.CuentaBilletera WHERE UsuarioId = @UsuarioId
    )
);
-- 2b. SolicitudCobroDetalle también referencia SolicitudCobro del mismo usuario
DELETE FROM dbo.SolicitudCobroDetalle
WHERE SolicitudId IN (
    SELECT SolicitudId FROM dbo.SolicitudCobro WHERE UsuarioSolicitanteId = @UsuarioId
);
-- 2c. SolicitudCobro del usuario
DELETE FROM dbo.SolicitudCobro WHERE UsuarioSolicitanteId = @UsuarioId;
-- 2d. Ahora sí podemos borrar Movimiento y CuentaBilletera
DELETE FROM dbo.Movimiento
WHERE CuentaBilleteraId IN (
    SELECT CuentaBilleteraId FROM dbo.CuentaBilletera WHERE UsuarioId = @UsuarioId
);
DELETE FROM dbo.CuentaBilletera WHERE UsuarioId = @UsuarioId;

INSERT INTO dbo.CuentaBilletera (UsuarioId, BilleteraId, Alias, SaldoActual) VALUES
    (@UsuarioId, @IdMP, N'mp-principal', 3200.50),
    (@UsuarioId, @IdUA, N'ua-personal',  1500.00),
    (@UsuarioId, @IdLM, N'lm-cripto',   7749.75);

-- Obtenemos los IDs recién generados
DECLARE @CuentaMP INT = (SELECT CuentaBilleteraId FROM dbo.CuentaBilletera WHERE UsuarioId = @UsuarioId AND BilleteraId = @IdMP);
DECLARE @CuentaUA INT = (SELECT CuentaBilleteraId FROM dbo.CuentaBilletera WHERE UsuarioId = @UsuarioId AND BilleteraId = @IdUA);
DECLARE @CuentaLM INT = (SELECT CuentaBilleteraId FROM dbo.CuentaBilletera WHERE UsuarioId = @UsuarioId AND BilleteraId = @IdLM);

-- ── 3. Movimientos de prueba ───────────────────────────────────────────────────
-- Cubre: ingresos, egresos, distintas billeteras, distintas fechas
INSERT INTO dbo.Movimiento (CuentaBilleteraId, CategoriaId, Fecha, Descripcion, Monto, Tipo) VALUES

    -- HOY
    (@CuentaMP, @CatAlimentos,  GETDATE(),                          N'Supermercado Día',        45.20,   N'EGRESO'),
    (@CuentaUA, @CatTransfIn,   GETDATE(),                          N'Transferencia recibida',  200.00,  N'INGRESO'),
    (@CuentaLM, @CatOcio,       DATEADD(HOUR, -3, GETDATE()),       N'Netflix',                 18.99,   N'EGRESO'),

    -- AYER
    (@CuentaLM, @CatOcio,       DATEADD(DAY, -1, GETDATE()),        N'Compra online',           120.50,  N'EGRESO'),
    (@CuentaMP, @CatAlimentos,  DATEADD(DAY, -1, GETDATE()),        N'Café',                    6.80,    N'EGRESO'),
    (@CuentaUA, @CatTransporte, DATEADD(DAY, -1, GETDATE()),        N'SUBE',                    12.50,   N'EGRESO'),

    -- Esta semana
    (@CuentaMP, @CatServicios,  DATEADD(DAY, -3, GETDATE()),        N'Luz — EDEFOR',            1850.00, N'EGRESO'),
    (@CuentaUA, @CatTransfIn,   DATEADD(DAY, -4, GETDATE()),        N'Pago de cliente',         500.00,  N'INGRESO'),
    (@CuentaLM, @CatOtros,      DATEADD(DAY, -5, GETDATE()),        N'Alquiler',                300.00,  N'EGRESO'),

    -- Mes pasado
    (@CuentaUA, @CatSueldo,     DATEADD(MONTH, -1, GETDATE()),      N'Sueldo junio',           85000.00, N'INGRESO'),
    (@CuentaMP, @CatTransfIn,   DATEADD(MONTH, -1, GETDATE()),      N'Reintegro obra social',   2200.00, N'INGRESO'),
    (@CuentaLM, @CatServicios,  DATEADD(DAY, -20, GETDATE()),       N'Internet — Fibertel',     4500.00, N'EGRESO'),
    (@CuentaMP, @CatOcio,       DATEADD(DAY, -18, GETDATE()),       N'Spotify',                  699.00, N'EGRESO'),
    (@CuentaUA, @CatAlimentos,  DATEADD(DAY, -15, GETDATE()),       N'Carnicería',              3200.00, N'EGRESO'),
    (@CuentaLM, @CatTransporte, DATEADD(DAY, -12, GETDATE()),       N'Nafta YPF',               7500.00, N'EGRESO');

-- ── 3b. Generación masiva de movimientos (para demostrar PAGINADO real) ────────
-- Insertamos 80 movimientos MÁS, repartidos en las 3 cuentas, con montos y
-- fechas variados (últimos 90 días). Con esto el listado paginado del front
-- tiene varias páginas para recorrer ( 1.4 "datos suficientes para
-- paginado" y 3.5 "listado paginado real"). ~20% son ingresos, el resto egresos.
DECLARE @i INT = 1;
DECLARE @cuentaSel INT, @catSel INT, @tipoTxt NVARCHAR(10);
DECLARE @esIngreso BIT, @montoGen DECIMAL(18,2), @diasAtras INT;
DECLARE @rndCuenta INT, @rndCat INT, @rndDesc INT, @descTxt NVARCHAR(80);

-- Tablas de apoyo para elegir cuenta/categoría al azar por número de fila.
DECLARE @cuentas TABLE (rn INT IDENTITY(1,1), Id INT);
INSERT INTO @cuentas (Id) VALUES (@CuentaMP), (@CuentaUA), (@CuentaLM);

DECLARE @catEgreso TABLE (rn INT IDENTITY(1,1), Id INT);
INSERT INTO @catEgreso (Id) VALUES (@CatAlimentos), (@CatTransporte), (@CatServicios), (@CatOcio), (@CatOtros);

-- Descripciones realistas: comercios/comida/entretenimiento para egresos y
-- nombres de personas para las transferencias recibidas (ingresos).
DECLARE @descEgreso TABLE (rn INT IDENTITY(1,1), Txt NVARCHAR(80));
INSERT INTO @descEgreso (Txt) VALUES
    (N'Coto'), (N'Carrefour'), (N'Supermercado Día'), (N'Jumbo'),
    (N'McDonalds'), (N'Mostaza'), (N'Starbucks'), (N'Havanna'),
    (N'Farmacity'), (N'Nafta YPF'), (N'Carga SUBE'), (N'Uber'),
    (N'Netflix'), (N'Spotify'), (N'Cine Hoyts'), (N'PedidosYa'),
    (N'Rappi'), (N'Mercado Libre'), (N'Edenor - Luz'), (N'Movistar'),
    (N'Kiosco del barrio'), (N'Panadería La Espiga'), (N'Verdulería'), (N'Shell');

DECLARE @descIngreso TABLE (rn INT IDENTITY(1,1), Txt NVARCHAR(80));
INSERT INTO @descIngreso (Txt) VALUES
    (N'Transferencia de Juan Pérez'), (N'Transferencia de María González'),
    (N'Pago de Lucas Fernández'), (N'Transferencia de Sofía Romero'),
    (N'Sueldo'), (N'Reintegro obra social'), (N'Transferencia de Martín Díaz'),
    (N'Devolución de Ana López'), (N'Cobro a Diego Suárez'), (N'Transferencia de Valentina Ruiz');

WHILE @i <= 80
BEGIN
    -- Cuenta al azar (1..3) y "moneda" para decidir ingreso/egreso.
    -- El índice se calcula a variable ANTES del SELECT: si NEWID() va dentro del
    -- WHERE se evalúa por fila y puede matchear 0 o varias filas (error 512).
    -- A variable → la subconsulta devuelve exactamente 1 fila.
    SET @rndCuenta = (ABS(CHECKSUM(NEWID())) % 3) + 1;
    SET @cuentaSel = (SELECT Id FROM @cuentas WHERE rn = @rndCuenta);
    SET @esIngreso = CASE WHEN (ABS(CHECKSUM(NEWID())) % 5) = 0 THEN 1 ELSE 0 END;  -- ~20% ingresos
    SET @montoGen  = CAST((ABS(CHECKSUM(NEWID())) % 500000) / 100.0 AS DECIMAL(18,2)) + 1.00; -- $1 .. $5000
    SET @diasAtras = ABS(CHECKSUM(NEWID())) % 90;  -- fecha en los últimos 90 días

    IF @esIngreso = 1
    BEGIN
        SELECT @catSel = @CatTransfIn, @tipoTxt = N'Ingreso';
        SET @rndDesc = (ABS(CHECKSUM(NEWID())) % (SELECT COUNT(*) FROM @descIngreso)) + 1;
        SET @descTxt = (SELECT Txt FROM @descIngreso WHERE rn = @rndDesc);
    END
    ELSE
    BEGIN
        SET @rndCat  = (ABS(CHECKSUM(NEWID())) % 5) + 1;
        SET @catSel  = (SELECT Id FROM @catEgreso WHERE rn = @rndCat);
        SET @tipoTxt = N'Egreso';
        SET @rndDesc = (ABS(CHECKSUM(NEWID())) % (SELECT COUNT(*) FROM @descEgreso)) + 1;
        SET @descTxt = (SELECT Txt FROM @descEgreso WHERE rn = @rndDesc);
    END

    INSERT INTO dbo.Movimiento (CuentaBilleteraId, CategoriaId, Fecha, Descripcion, Monto, Tipo)
    VALUES (
        @cuentaSel,
        @catSel,
        DATEADD(DAY, -@diasAtras, GETDATE()),
        @descTxt,
        @montoGen,
        @tipoTxt
    );

    SET @i += 1;
END

PRINT 'Seed completado. Cuentas y movimientos cargados para UsuarioId = ' + CAST(@UsuarioId AS VARCHAR);
PRINT 'Cuenta MP  id: ' + CAST(@CuentaMP AS VARCHAR);
PRINT 'Cuenta UA  id: ' + CAST(@CuentaUA AS VARCHAR);
PRINT 'Cuenta LM  id: ' + CAST(@CuentaLM AS VARCHAR);
GO

-- ── Seed: MotivoReporte (BE-07) ─────────────────────────────────────────────
-- Necesario para que el POST /api/tickets-soporte funcione con MotivoId válido.
USE BilleterasDB;
GO
IF NOT EXISTS (SELECT 1 FROM dbo.MotivoReporte)
INSERT INTO dbo.MotivoReporte (Titulo, Gravedad) VALUES
    (N'Error en transferencia',  3),
    (N'Problema con el saldo',   2),
    (N'No puedo iniciar sesión', 2),
    (N'Otro',                    1);
GO
PRINT 'Seed MotivoReporte completado.';
