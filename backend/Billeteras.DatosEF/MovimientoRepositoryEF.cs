using Microsoft.EntityFrameworkCore;
using Billeteras.Datos.Interfaces;
using Billeteras.Entidades;

namespace Billeteras.DatosEF;

/// Implementación EF Core del repositorio de Movimiento.
/// Incluye las navegaciones Categoria y CuentaBilletera con .Include(...).
/// NOTA: NO toca el SaldoActual de la cuenta (eso es TP-06).
public class MovimientoRepositoryEF(BilleterasContext ctx) : IMovimientoRepository
{
    // Trae todos los movimientos con su categoría y cuenta cargadas (Include).
    public async Task<List<Movimiento>> ObtenerTodosAsync()
        => await ctx.Movimientos
            .Include(m => m.Categoria)
            .Include(m => m.CuentaBilletera)
            .ToListAsync();

    // Busca un movimiento por Id con categoría y cuenta cargadas (null si no existe).
    public async Task<Movimiento?> ObtenerPorIdAsync(int id)
        => await ctx.Movimientos
            .Include(m => m.Categoria)
            .Include(m => m.CuentaBilletera)
            .FirstOrDefaultAsync(m => m.MovimientoId == id);

    // Inserta un movimiento nuevo y devuelve el Id generado.
    public async Task<int> InsertarAsync(Movimiento entidad)
    {
        ctx.Movimientos.Add(entidad);
        await ctx.SaveChangesAsync();
        return entidad.MovimientoId;
    }

    // Actualiza un movimiento; true si se guardó algún cambio.
    public async Task<bool> ActualizarAsync(Movimiento entidad)
    {
        ctx.Movimientos.Update(entidad);
        return await ctx.SaveChangesAsync() > 0;
    }

    // Elimina el movimiento por Id; false si no existía.
    public async Task<bool> EliminarAsync(int id)
    {
        var entidad = await ctx.Movimientos.FindAsync(id);
        if (entidad is null) return false;
        ctx.Movimientos.Remove(entidad);
        return await ctx.SaveChangesAsync() > 0;
    }

    // ─── Paginado + filtrado REAL en la base ( 3.4 y 3.5) ─────────────────
    public async Task<(List<Movimiento> Items, int TotalCount)> ObtenerPaginadoPorUsuarioAsync(
        int usuarioId, string? tipo, string? texto, int pageNumber, int pageSize)
    {
        // Base: SOLO los movimientos de las cuentas del usuario (filtro por el
        // join CuentaBilletera.UsuarioId). EF lo traduce a un JOIN/EXISTS en SQL.
        var query = ctx.Movimientos
            .Include(m => m.Categoria)
            .Include(m => m.CuentaBilletera)
            .Where(m => m.CuentaBilletera!.UsuarioId == usuarioId);

        // Filtro 1 — tipo (Ingreso/Egreso). La collation por defecto de SQL Server
        // (CI_AS) hace la comparación case-insensitive, así que matchea aunque en
        // la base convivan "Ingreso" e "INGRESO".
        if (!string.IsNullOrWhiteSpace(tipo))
            query = query.Where(m => m.Tipo == tipo);

        // Filtro 2 — texto libre sobre la descripción o el nombre de la categoría.
        if (!string.IsNullOrWhiteSpace(texto))
            query = query.Where(m =>
                (m.Descripcion != null && m.Descripcion.Contains(texto)) ||
                (m.Categoria != null && m.Categoria.Nombre.Contains(texto)));

        // Total ANTES de paginar → para saber cuántas páginas hay.
        var total = await query.CountAsync();

        // La página se resuelve en el motor con OFFSET/FETCH (Skip/Take).
        // Orden estable (Fecha y, a igualdad, MovimientoId) para no repetir ni
        // saltear filas entre páginas.
        var items = await query
            .OrderByDescending(m => m.Fecha)
            .ThenByDescending(m => m.MovimientoId)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, total);
    }
}