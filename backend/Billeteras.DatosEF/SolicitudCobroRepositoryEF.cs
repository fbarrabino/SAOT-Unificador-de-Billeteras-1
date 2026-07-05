using Microsoft.EntityFrameworkCore;
using Billeteras.Datos.Interfaces;
using Billeteras.Entidades;

namespace Billeteras.DatosEF;

/// Implementación EF Core de ISolicitudCobroRepository.
///
/// ¿Por qué las transacciones están acá y no en la capa de Negocio?
/// La capa de Negocio no conoce EF (solo conoce la abstracción del repositorio).
/// La transaccionalidad es un detalle de INFRAESTRUCTURA: saber cómo
/// persistir datos de forma atómica es responsabilidad de la capa de Datos.
public class SolicitudCobroRepositoryEF(BilleterasContext ctx) : ISolicitudCobroRepository
{
    // Solicitudes donde el usuario es el que cobra, con sus líneas y deudores.
    public async Task<List<SolicitudCobro>> ObtenerPorSolicitanteAsync(int usuarioSolicitanteId)
        => await ctx.SolicitudesCobro
            .Include(s => s.UsuarioSolicitante)
            .Include(s => s.Lineas)
                .ThenInclude(l => l.UsuarioDeudor)
            .Where(s => s.UsuarioSolicitanteId == usuarioSolicitanteId)
            .OrderByDescending(s => s.FechaCreacion)
            .ToListAsync();

    // Detalle completo (cabecera + líneas + deudor + movimiento) de una solicitud.
    public async Task<SolicitudCobro?> ObtenerConLineasAsync(int solicitudId)
        => await ctx.SolicitudesCobro
            .Include(s => s.UsuarioSolicitante)
            .Include(s => s.Lineas)
                .ThenInclude(l => l.UsuarioDeudor)
            .Include(s => s.Lineas)
                .ThenInclude(l => l.Movimiento)
            .FirstOrDefaultAsync(s => s.SolicitudId == solicitudId);

    // Devuelve una línea de detalle por su Id, con su solicitud y deudor.
    public async Task<SolicitudCobroDetalle?> ObtenerDetalleAsync(int detalleSolicitudId)
        => await ctx.SolicitudesCobroDetalles
            .Include(d => d.Solicitud)
            .Include(d => d.UsuarioDeudor)
            .FirstOrDefaultAsync(d => d.DetalleSolicitudId == detalleSolicitudId);

    /// Crea cabecera + líneas en una sola transacción.
    /// Si cualquier INSERT falla, el ROLLBACK revierte todo.
    public async Task<int> CrearConLineasAsync(SolicitudCobro cabecera, List<SolicitudCobroDetalle> lineas)
    {
        // Iniciamos la transacción explícita
        await using var transaction = await ctx.Database.BeginTransactionAsync();
        try
        {
            // 1) INSERT cabecera (maestro)
            ctx.SolicitudesCobro.Add(cabecera);
            await ctx.SaveChangesAsync();   // genera el SolicitudId por IDENTITY

            // 2) Asignar el SolicitudId a cada línea de detalle
            foreach (var linea in lineas)
                linea.SolicitudId = cabecera.SolicitudId;

            // 3) INSERT todas las líneas (detalle)
            ctx.SolicitudesCobroDetalles.AddRange(lineas);
            await ctx.SaveChangesAsync();

            // 4) Todo OK → COMMIT
            await transaction.CommitAsync();
            return cabecera.SolicitudId;
        }
        catch
        {
            // Algún INSERT falló → ROLLBACK automático y re-lanzamos la excepción
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// Marca la línea como Pagada y crea el Movimiento vinculado en una sola transacción.
    public async Task<int> PagarLineaAsync(SolicitudCobroDetalle detalle, Movimiento movimiento)
    {
        await using var transaction = await ctx.Database.BeginTransactionAsync();
        try
        {
            // 1) INSERT Movimiento → obtiene MovimientoId
            ctx.Movimientos.Add(movimiento);
            await ctx.SaveChangesAsync();

            // 2) UPDATE línea: Pagado = true + vincular MovimientoId
            detalle.Pagado = true;
            detalle.MovimientoId = movimiento.MovimientoId;
            ctx.SolicitudesCobroDetalles.Update(detalle);
            await ctx.SaveChangesAsync();

            // 3) COMMIT
            await transaction.CommitAsync();
            return movimiento.MovimientoId;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
