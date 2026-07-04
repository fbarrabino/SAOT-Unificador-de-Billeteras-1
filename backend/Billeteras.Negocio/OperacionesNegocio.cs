using Billeteras.Datos.Interfaces;
using Billeteras.Negocio.Dtos;
using Billeteras.Negocio.Interfaces;

namespace Billeteras.Negocio;

public class OperacionesNegocio(
    IOperacionesRepository repo,
    INeo4jService neo4j) : IOperacionesNegocio
{
    public async Task<OperacionResponse> EnviarAsync(EnviarRequest req)
    {
        var (movsIds, saldoOrigen, saldoDestino) = await repo.EnviarAsync(
            req.CuentaOrigenId,
            req.CuentaDestinoId,
            req.CategoriaId,
            req.Monto,
            req.Descripcion);

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
                    // Asociamos el id del movimiento de egreso al grafo.
                    movimientoId = movsIds[0],
                    monto = (double)req.Monto,
                    fecha = DateTimeOffset.UtcNow.ToString("o"),
                    descripcion = req.Descripcion ?? string.Empty,
                }));
        }

        return new OperacionResponse(
            Operacion: "Enviar",
            MovimientosCreados: movsIds,
            SaldoOrigenFinal: saldoOrigen,
            SaldoDestinoFinal: saldoDestino);
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

        if (req.ComercioId is int comercioId && req.RazonSocial is not null && req.Cuit is not null)
        {
            var fechaIso = DateTimeOffset.UtcNow.ToString("o");

            await SafeAsync("PagarQR→Comercio", () => neo4j.ExecuteAsync(@"
                MERGE (co:Comercio {comercioId: $comercioId})
                SET co.razonSocial = $razonSocial, co.cuit = $cuit",
                new { comercioId, razonSocial = req.RazonSocial, cuit = req.Cuit }));

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

    private static async Task SafeAsync(string contexto, Func<Task> accion)
    {
        try
        {
            await accion();
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[Neo4j::{contexto}] Fallo el log al grafo, SQL queda como fuente de verdad. Detalle: {ex.Message}");
        }
    }
}