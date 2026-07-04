using Billeteras.Datos.Interfaces;
using Billeteras.Negocio.Dtos;
using Billeteras.Negocio.Interfaces;

namespace Billeteras.Negocio;

/// Coordina las operaciones transaccionales del dominio. La transacción SQL
/// (BeginTransaction/Commit/Rollback) vive en IOperacionesRepository; acá
/// queda el mapeo al OperacionResponse y, tras el commit, el log al grafo
/// Neo4j (BD-04). El grafo es un espejo eventual: SQL es la fuente de verdad,
/// por eso los hooks van envueltos en try/catch — un fallo de Neo4j no
/// rompe la operación financiera.
public class OperacionesNegocio(
    IOperacionesRepository repo,
    INeo4jService neo4j) : IOperacionesNegocio
{
    public async Task<OperacionResponse> EnviarAsync(EnviarRequest req)
    {
        var (movId, saldo) = await repo.EnviarAsync(
            req.CuentaOrigenId,
            req.CategoriaId,
            req.Monto,
            req.Descripcion);

        // BD-04 — Solo logueamos como transferencia si conocemos al destinatario
        // (cuenta interna de la app). Si fue un envío "afuera" no hay nodo destino.
        if (req.CuentaDestinoId is int destinoId)
        {
            await SafeAsync("Enviar→Neo4j", () => neo4j.ExecuteAsync(@"
                MATCH (origen:CuentaBilletera  {cuentaBilleteraId: $cuentaOrigenId}),
                      (destino:CuentaBilletera {cuentaBilleteraId: $cuentaDestinoId})
                CREATE (origen)-[:TRANSFIRIO {
                    movimientoId: $movimientoId,
                    monto:        $monto,
                    fecha:        datetime($fecha),
                    descripcion:  $descripcion
                }]->(destino)",
                new
                {
                    cuentaOrigenId = req.CuentaOrigenId,
                    cuentaDestinoId = destinoId,
                    movimientoId = movId,
                    monto = (double)req.Monto,
                    fecha = DateTimeOffset.UtcNow.ToString("o"),
                    descripcion = req.Descripcion ?? string.Empty,
                }));
        }

        return new OperacionResponse(
            Operacion: "Enviar",
            MovimientosCreados: [movId],
            SaldoOrigenFinal: saldo,
            SaldoDestinoFinal: null);
    }

    public async Task<OperacionResponse> CambiarAsync(CambiarRequest req)
    {
        var (egId, inId, saldoOrigen, saldoDestino) = await repo.CambiarAsync(
            req.CuentaOrigenId,
            req.CuentaDestinoId,
            req.CategoriaEgresoId,
            req.CategoriaIngresoId,
            req.Monto,
            req.Descripcion);

        // BD-04 — Cambio entre wallets del mismo usuario → también es TRANSFIRIÓ
        // entre dos nodos CuentaBilletera, modelado igual que un envío interno.
        await SafeAsync("Cambiar→Neo4j", () => neo4j.ExecuteAsync(@"
            MATCH (origen:CuentaBilletera  {cuentaBilleteraId: $cuentaOrigenId}),
                  (destino:CuentaBilletera {cuentaBilleteraId: $cuentaDestinoId})
            CREATE (origen)-[:TRANSFIRIO {
                movimientoId: $movimientoId,
                monto:        $monto,
                fecha:        datetime($fecha),
                descripcion:  $descripcion
            }]->(destino)",
            new
            {
                cuentaOrigenId = req.CuentaOrigenId,
                cuentaDestinoId = req.CuentaDestinoId,
                movimientoId = egId,
                monto = (double)req.Monto,
                fecha = DateTimeOffset.UtcNow.ToString("o"),
                descripcion = req.Descripcion ?? string.Empty,
            }));

        return new OperacionResponse(
            Operacion: "Cambiar",
            MovimientosCreados: [egId, inId],
            SaldoOrigenFinal: saldoOrigen,
            SaldoDestinoFinal: saldoDestino);
    }

    public async Task<OperacionResponse> TransferirAsync(TransferirRequest req)
    {
        var (egId, inId, saldoOrigen, saldoDestino) = await repo.TransferirAsync(
            req.CuentaOrigenId,
            req.CuentaDestinoId,
            req.CategoriaEgresoId,
            req.CategoriaIngresoId,
            req.Monto,
            req.Descripcion);

        // BD-04 — Espejamos la transferencia entre cuentas en el grafo (mismo patrón que Cambiar).
        await SafeAsync("Transferir→Neo4j", () => neo4j.ExecuteAsync(@"
            MATCH (origen:CuentaBilletera  {cuentaBilleteraId: $cuentaOrigenId}),
                  (destino:CuentaBilletera {cuentaBilleteraId: $cuentaDestinoId})
            CREATE (origen)-[:TRANSFIRIO {
                movimientoId: $movimientoId,
                monto:        $monto,
                fecha:        datetime($fecha),
                descripcion:  $descripcion
            }]->(destino)",
            new
            {
                cuentaOrigenId = req.CuentaOrigenId,
                cuentaDestinoId = req.CuentaDestinoId,
                movimientoId = egId,
                monto = (double)req.Monto,
                fecha = DateTimeOffset.UtcNow.ToString("o"),
                descripcion = req.Descripcion ?? string.Empty,
            }));

        return new OperacionResponse(
            Operacion: "Transferir",
            MovimientosCreados: [egId, inId],
            SaldoOrigenFinal: saldoOrigen,
            SaldoDestinoFinal: saldoDestino);
    }

    public async Task<OperacionResponse> PagarQrAsync(PagarQrRequest req)
    {
        var (movId, saldo) = await repo.PagarQrAsync(
            req.CuentaOrigenId,
            req.CategoriaId,
            req.Monto,
            req.Descripcion,
            req.CodigoQR);

        // BD-04 — Solo logueamos el pago contra un comercio si el FE decodificó
        // el QR y nos mandó el ComercioId/RazonSocial/Cuit. Si no, el grafo no
        // se entera del pago (queda únicamente como movimiento SQL con metadata).
        if (req.ComercioId is int comercioId && req.RazonSocial is not null && req.Cuit is not null)
        {
            var fechaIso = DateTimeOffset.UtcNow.ToString("o");

            // 1) Asegurar el nodo del comercio.
            await SafeAsync("PagarQR→Comercio", () => neo4j.ExecuteAsync(@"
                MERGE (co:Comercio {comercioId: $comercioId})
                SET co.razonSocial = $razonSocial, co.cuit = $cuit",
                new { comercioId, razonSocial = req.RazonSocial, cuit = req.Cuit }));

            // 2) Relación PAGÓ_EN cuenta → comercio.
            await SafeAsync("PagarQR→PagoEn", () => neo4j.ExecuteAsync(@"
                MATCH (c:CuentaBilletera {cuentaBilleteraId: $cuentaBilleteraId}),
                      (co:Comercio       {comercioId:        $comercioId})
                CREATE (c)-[:PAGO_EN {
                    movimientoId: $movimientoId,
                    monto:        $monto,
                    fecha:        datetime($fecha)
                }]->(co)",
                new
                {
                    cuentaBilleteraId = req.CuentaOrigenId,
                    comercioId,
                    movimientoId = movId,
                    monto = (double)req.Monto,
                    fecha = fechaIso,
                }));

            // 3) ACEPTA — el comercio acepta la billetera que usa la cuenta.
            // Depende de que (c:CuentaBilletera)-[:USA]->(b:Billetera) exista
            // (la crea VincularAsync de Lautaro). Si no, este MATCH no encuentra
            // nada y el MERGE no se ejecuta — no es error, solo queda pendiente.
            await SafeAsync("PagarQR→Acepta", () => neo4j.ExecuteAsync(@"
                MATCH (c:CuentaBilletera {cuentaBilleteraId: $cuentaBilleteraId})-[:USA]->(b:Billetera),
                      (co:Comercio       {comercioId:        $comercioId})
                MERGE (co)-[:ACEPTA]->(b)",
                new { cuentaBilleteraId = req.CuentaOrigenId, comercioId }));
        }

        return new OperacionResponse(
            Operacion: "PagarQR",
            MovimientosCreados: [movId],
            SaldoOrigenFinal: saldo,
            SaldoDestinoFinal: null);
    }

    public async Task<OperacionResponse> AnularAsync(int movimientoId)
    {
        var (movId, saldo) = await repo.AnularAsync(movimientoId);
        return new OperacionResponse(
            Operacion: "Anular",
            MovimientosCreados: [movId],
            SaldoOrigenFinal: saldo,
            SaldoDestinoFinal: null);
    }

    /// Envuelve una llamada a Neo4j con try/catch silencioso: SQL ya commiteó,
    /// no podemos rollbackear, así que un fallo del grafo se loguea pero no
    /// propaga. Esto preserva la consistencia financiera y deja el desfase del
    /// grafo como un problema operativo, no transaccional.
    private static async Task SafeAsync(string contexto, Func<Task> accion)
    {
        try
        {
            await accion();
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[Neo4j::{contexto}] Falló el log al grafo, SQL queda como fuente de verdad. Detalle: {ex.Message}");
        }
    }
}
