using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Billeteras.Datos.Interfaces;
using Billeteras.Entidades;

namespace Billeteras.DatosEF;

public class OperacionesRepositoryEF(BilleterasContext ctx) : IOperacionesRepository
{
    private const string TipoIngreso = "Ingreso";
    private const string TipoEgreso = "Egreso";

    // ─── BE-03 Enviar (Modificado para Doble Movimiento y Fallback de Categoría) ───
    public async Task<(List<int> movimientosIds, decimal saldoOrigenFinal, decimal? saldoDestinoFinal)> EnviarAsync(
        int cuentaOrigenId,
        int? cuentaDestinoId,
        int categoriaId,
        decimal monto,
        string? descripcion)
    {
        await using IDbContextTransaction tx = await ctx.Database.BeginTransactionAsync();
        try
        {
            var origen = await ObtenerCuentaParaEgresoAsync(cuentaOrigenId, monto);
            
            // Blindaje: Si la categoría no existe en esta DB, asigna la primera de tipo Egreso automáticamente
            categoriaId = await ObtenerOValidarCategoriaAsync(categoriaId, TipoEgreso);

            var movEgreso = new Movimiento
            {
                CuentaBilleteraId = origen.CuentaBilleteraId,
                CategoriaId = categoriaId,
                Fecha = DateTime.Now,
                Descripcion = descripcion,
                Monto = monto,
                Tipo = TipoEgreso
            };
            ctx.Movimientos.Add(movEgreso);
            origen.SaldoActual -= monto;

            List<int> movimientosCreados = new();
            decimal? saldoDestino = null;

            // Si se envió a un usuario interno de la aplicación, generamos el ingreso receptor.
            if (cuentaDestinoId.HasValue)
            {
                if (cuentaOrigenId == cuentaDestinoId.Value)
                    throw new InvalidOperationException("La cuenta origen y destino no pueden ser la misma.");

                var destino = await ctx.CuentasBilletera.FirstOrDefaultAsync(c => c.CuentaBilleteraId == cuentaDestinoId.Value)
                    ?? throw new InvalidOperationException($"La cuenta destino {cuentaDestinoId} no existe.");

                // Buscamos una categoría de tipo Ingreso en la base para asignar al movimiento receptor.
                var catIngreso = await ctx.Categorias.FirstOrDefaultAsync(c => c.Tipo == TipoIngreso && (c.Nombre.Contains("Transferencia") || c.Nombre.Contains("Recibido") || c.Nombre.Contains("Ingreso")))
                    ?? await ctx.Categorias.FirstOrDefaultAsync(c => c.Tipo == TipoIngreso)
                    ?? throw new InvalidOperationException("No se encontró una categoría de tipo Ingreso configurada en la base de datos.");

                var movIngreso = new Movimiento
                {
                    CuentaBilleteraId = destino.CuentaBilleteraId,
                    CategoriaId = catIngreso.CategoriaId,
                    Fecha = DateTime.Now,
                    Descripcion = descripcion ?? "Transferencia recibida",
                    Monto = monto,
                    Tipo = TipoIngreso
                };
                ctx.Movimientos.Add(movIngreso);
                destino.SaldoActual += monto;

                await ctx.SaveChangesAsync();
                movimientosCreados.Add(movEgreso.MovimientoId);
                movimientosCreados.Add(movIngreso.MovimientoId);
                saldoDestino = destino.SaldoActual;
            }
            else
            {
                await ctx.SaveChangesAsync();
                movimientosCreados.Add(movEgreso.MovimientoId);
            }

            await tx.CommitAsync();
            return (movimientosCreados, origen.SaldoActual, saldoDestino);
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    // ─── BE-04 Cambiar ────────────────────────────────────────────────────────
    public async Task<(int movEgresoId, int movIngresoId, decimal saldoOrigenFinal, decimal saldoDestinoFinal)>
        CambiarAsync(
            int cuentaOrigenId,
            int cuentaDestinoId,
            int categoriaEgresoId,
            int categoriaIngresoId,
            decimal monto,
            string? descripcion)
    {
        if (cuentaOrigenId == cuentaDestinoId)
            throw new InvalidOperationException("La cuenta origen y destino no pueden ser la misma.");

        await using IDbContextTransaction tx = await ctx.Database.BeginTransactionAsync();
        try
        {
            var origen = await ObtenerCuentaParaEgresoAsync(cuentaOrigenId, monto);
            var destino = await ctx.CuentasBilletera.FirstOrDefaultAsync(c => c.CuentaBilleteraId == cuentaDestinoId)
                ?? throw new InvalidOperationException($"La cuenta destino {cuentaDestinoId} no existe.");

            if (origen.UsuarioId != destino.UsuarioId)
                throw new InvalidOperationException("Las cuentas origen y destino deben pertenecer al mismo usuario.");

            categoriaEgresoId = await ObtenerOValidarCategoriaAsync(categoriaEgresoId, TipoEgreso);
            categoriaIngresoId = await ObtenerOValidarCategoriaAsync(categoriaIngresoId, TipoIngreso);

            var fecha = DateTime.Now;

            var movEgreso = new Movimiento
            {
                CuentaBilleteraId = origen.CuentaBilleteraId,
                CategoriaId = categoriaEgresoId,
                Fecha = fecha,
                Descripcion = descripcion,
                Monto = monto,
                Tipo = TipoEgreso
            };
            var movIngreso = new Movimiento
            {
                CuentaBilleteraId = destino.CuentaBilleteraId,
                CategoriaId = categoriaIngresoId,
                Fecha = fecha,
                Descripcion = descripcion,
                Monto = monto,
                Tipo = TipoIngreso
            };
            ctx.Movimientos.Add(movEgreso);
            ctx.Movimientos.Add(movIngreso);

            origen.SaldoActual -= monto;
            destino.SaldoActual += monto;

            await ctx.SaveChangesAsync();
            await tx.CommitAsync();

            return (movEgreso.MovimientoId, movIngreso.MovimientoId, origen.SaldoActual, destino.SaldoActual);
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    // ─── Transferir (pago QR a otro usuario) ──────────────────────────────────
    public async Task<(int movEgresoId, int movIngresoId, decimal saldoOrigenFinal, decimal saldoDestinoFinal)>
        TransferirAsync(
            int cuentaOrigenId,
            int cuentaDestinoId,
            int categoriaEgresoId,
            int categoriaIngresoId,
            decimal monto,
            string? descripcion)
    {
        if (cuentaOrigenId == cuentaDestinoId)
            throw new InvalidOperationException("La cuenta origen y destino no pueden ser la misma.");

        await using IDbContextTransaction tx = await ctx.Database.BeginTransactionAsync();
        try
        {
            var origen = await ObtenerCuentaParaEgresoAsync(cuentaOrigenId, monto);
            var destino = await ctx.CuentasBilletera.FirstOrDefaultAsync(c => c.CuentaBilleteraId == cuentaDestinoId)
                ?? throw new InvalidOperationException($"La cuenta destino {cuentaDestinoId} no existe.");

            // NOTA: a diferencia de Cambiar, acá NO exigimos mismo usuario: es una
            // transferencia de una persona a otra (el que pagó → el que cobró por QR).

            // Franco renombró el helper a ObtenerOValidarCategoriaAsync (con fallback):
            // devuelve un id válido aunque la categoría pedida no exista en esta DB.
            categoriaEgresoId = await ObtenerOValidarCategoriaAsync(categoriaEgresoId, TipoEgreso);
            categoriaIngresoId = await ObtenerOValidarCategoriaAsync(categoriaIngresoId, TipoIngreso);

            var fecha = DateTime.Now;

            var movEgreso = new Movimiento
            {
                CuentaBilleteraId = origen.CuentaBilleteraId,
                CategoriaId = categoriaEgresoId,
                Fecha = fecha,
                Descripcion = descripcion,
                Monto = monto,
                Tipo = TipoEgreso
            };
            var movIngreso = new Movimiento
            {
                CuentaBilleteraId = destino.CuentaBilleteraId,
                CategoriaId = categoriaIngresoId,
                Fecha = fecha,
                Descripcion = descripcion,
                Monto = monto,
                Tipo = TipoIngreso
            };
            ctx.Movimientos.Add(movEgreso);
            ctx.Movimientos.Add(movIngreso);

            origen.SaldoActual -= monto;
            destino.SaldoActual += monto;

            await ctx.SaveChangesAsync();
            await tx.CommitAsync();

            return (movEgreso.MovimientoId, movIngreso.MovimientoId, origen.SaldoActual, destino.SaldoActual);
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    // ─── BE-05 Pagar QR ───────────────────────────────────────────────────────
    public async Task<(int movimientoId, decimal saldoOrigenFinal)> PagarQrAsync(
        int cuentaOrigenId,
        int categoriaId,
        decimal monto,
        string? descripcion,
        string? codigoQR)
    {
        await using IDbContextTransaction tx = await ctx.Database.BeginTransactionAsync();
        try
        {
            var cuenta = await ObtenerCuentaParaEgresoAsync(cuentaOrigenId, monto);
            categoriaId = await ObtenerOValidarCategoriaAsync(categoriaId, TipoEgreso);

            var movimiento = new Movimiento
            {
                CuentaBilleteraId = cuenta.CuentaBilleteraId,
                CategoriaId = categoriaId,
                Fecha = DateTime.Now,
                Descripcion = descripcion,
                Monto = monto,
                Tipo = TipoEgreso,
                MetadataExtranjera = codigoQR is null
                    ? null
                    : System.Text.Json.JsonSerializer.Serialize(new { qr = codigoQR })
            };
            ctx.Movimientos.Add(movimiento);

            cuenta.SaldoActual -= monto;

            await ctx.SaveChangesAsync();
            await tx.CommitAsync();

            return (movimiento.MovimientoId, cuenta.SaldoActual);
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    // ─── BE-09 Anular ─────────────────────────────────────────────────────────
    public async Task<(int movimientoId, decimal saldoFinal)> AnularAsync(int movimientoId)
    {
        await using IDbContextTransaction tx = await ctx.Database.BeginTransactionAsync();
        try
        {
            var mov = await ctx.Movimientos.FirstOrDefaultAsync(m => m.MovimientoId == movimientoId)
                ?? throw new InvalidOperationException($"El movimiento {movimientoId} no existe.");

            if (mov.Anulado)
                throw new InvalidOperationException($"El movimiento {movimientoId} ya estaba anulado.");

            var cuenta = await ctx.CuentasBilletera.FirstOrDefaultAsync(c => c.CuentaBilleteraId == mov.CuentaBilleteraId)
                ?? throw new InvalidOperationException($"La cuenta {mov.CuentaBilleteraId} del movimiento no existe.");

            if (string.Equals(mov.Tipo, TipoEgreso, StringComparison.OrdinalIgnoreCase))
            {
                cuenta.SaldoActual += mov.Monto;
            }
            else
            {
                if (cuenta.SaldoActual < mov.Monto)
                    throw new InvalidOperationException(
                        $"No se puede anular el ingreso: el saldo actual ({cuenta.SaldoActual}) " +
                        $"no alcanza para revertir {mov.Monto}.");
                cuenta.SaldoActual -= mov.Monto;
            }

            mov.Anulado = true;
            mov.FechaAnulacion = DateTime.Now;

            await ctx.SaveChangesAsync();
            await tx.CommitAsync();

            return (mov.MovimientoId, cuenta.SaldoActual);
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    private async Task<CuentaBilletera> ObtenerCuentaParaEgresoAsync(int cuentaId, decimal monto)
    {
        var cuenta = await ctx.CuentasBilletera.FirstOrDefaultAsync(c => c.CuentaBilleteraId == cuentaId)
            ?? throw new InvalidOperationException($"La cuenta {cuentaId} no existe.");

        if (cuenta.SaldoActual < monto)
            throw new InvalidOperationException(
                $"Saldo insuficiente en la cuenta {cuentaId}. Disponible: {cuenta.SaldoActual}, requerido: {monto}.");

        return cuenta;
    }

    // ─── Helper Defensivo: Valida o hace Fallback de Categoría ─────────────────
    private async Task<int> ObtenerOValidarCategoriaAsync(int categoriaId, string tipoEsperado)
    {
        var categoria = await ctx.Categorias.FirstOrDefaultAsync(c => c.CategoriaId == categoriaId && c.Tipo == tipoEsperado);
        if (categoria != null)
            return categoria.CategoriaId;

        // Si la categoría pedida no existe (ej. ID 7), buscamos la primera válida de ese tipo en la DB
        var fallback = await ctx.Categorias.FirstOrDefaultAsync(c => c.Tipo == tipoEsperado)
            ?? throw new InvalidOperationException($"No se encontró ninguna categoría de tipo '{tipoEsperado}' en la base de datos.");

        return fallback.CategoriaId;
    }
}