using Microsoft.EntityFrameworkCore;
using Billeteras.Datos.Interfaces;
using Billeteras.Entidades;

namespace Billeteras.DatosEF;

/// Implementación EF Core del repositorio de CuentaBilletera.
/// Incluye las navegaciones Billetera y Usuario con .Include(...).
public class CuentaBilleteraRepositoryEF(BilleterasContext ctx) : ICuentaBilleteraRepository
{
    // Trae todas las cuentas con su billetera y usuario cargados (Include).
    public async Task<List<CuentaBilletera>> ObtenerTodosAsync()
        => await ctx.CuentasBilletera
            .Include(c => c.Billetera)
            .Include(c => c.Usuario)
            .ToListAsync();

    // Busca una cuenta por Id con billetera y usuario cargados (null si no existe).
    public async Task<CuentaBilletera?> ObtenerPorIdAsync(int id)
        => await ctx.CuentasBilletera
            .Include(c => c.Billetera)
            .Include(c => c.Usuario)
            .FirstOrDefaultAsync(c => c.CuentaBilleteraId == id);

    // Inserta una cuenta nueva y devuelve el Id generado.
    public async Task<int> InsertarAsync(CuentaBilletera entidad)
    {
        ctx.CuentasBilletera.Add(entidad);
        await ctx.SaveChangesAsync();
        return entidad.CuentaBilleteraId;
    }

    // Actualiza una cuenta; true si se guardó algún cambio.
    public async Task<bool> ActualizarAsync(CuentaBilletera entidad)
    {
        ctx.CuentasBilletera.Update(entidad);
        return await ctx.SaveChangesAsync() > 0;
    }

    // Elimina la cuenta por Id (hard delete); false si no existía.
    public async Task<bool> EliminarAsync(int id)
    {
        var entidad = await ctx.CuentasBilletera.FindAsync(id);
        if (entidad is null) return false;
        ctx.CuentasBilletera.Remove(entidad);
        return await ctx.SaveChangesAsync() > 0;
    }

    // Vincula una billetera al usuario dentro de una transacción: valida existencia
    // y que no haya ya un vínculo activo, crea la cuenta y recarga navegaciones.
    public async Task<CuentaBilletera> VincularAsync(int usuarioId, int billeteraId, string? alias)
    {
        await using var tx = await ctx.Database.BeginTransactionAsync();
        try
        {
            // Validar que la billetera exista
            var billeteraExiste = await ctx.Billeteras.AnyAsync(b => b.BilleteraId == billeteraId);
            if (!billeteraExiste)
                throw new KeyNotFoundException($"No existe una billetera con Id {billeteraId}.");

            // Validar que no haya un vínculo activo para el mismo usuario + billetera
            var yaVinculada = await ctx.CuentasBilletera
                .AnyAsync(c => c.UsuarioId == usuarioId
                            && c.BilleteraId == billeteraId
                            && c.Estado == "Activa");
            if (yaVinculada)
                throw new InvalidOperationException("Ya existe un vínculo activo con esa billetera.");

            var cuenta = new CuentaBilletera
            {
                UsuarioId        = usuarioId,
                BilleteraId      = billeteraId,
                Alias            = alias,
                SaldoActual      = 0,
                FechaVinculacion = DateTime.UtcNow,
                Estado           = "Activa"
            };

            ctx.CuentasBilletera.Add(cuenta);
            await ctx.SaveChangesAsync();
            await tx.CommitAsync();

            // Recargar navegaciones para el response
            await ctx.Entry(cuenta).Reference(c => c.Billetera).LoadAsync();
            await ctx.Entry(cuenta).Reference(c => c.Usuario).LoadAsync();
            return cuenta;
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    // Desvincula la cuenta (soft-delete a estado "Desvinculada") validando dueño y estado.
    public async Task<CuentaBilletera> DesvincularAsync(int cuentaBilleteraId, int usuarioId)
    {
        await using var tx = await ctx.Database.BeginTransactionAsync();
        try
        {
            var cuenta = await ctx.CuentasBilletera
                .Include(c => c.Billetera)
                .Include(c => c.Usuario)
                .FirstOrDefaultAsync(c => c.CuentaBilleteraId == cuentaBilleteraId)
                ?? throw new KeyNotFoundException($"No existe una cuenta con Id {cuentaBilleteraId}.");

            if (cuenta.UsuarioId != usuarioId)
                throw new UnauthorizedAccessException("No tenés permiso para desvincular esta cuenta.");

            if (cuenta.Estado != "Activa")
                throw new InvalidOperationException("La cuenta ya se encuentra desvinculada.");

            // Nota: NO bloqueamos por saldo. Desvincular es un soft-delete (dejamos
            // de mostrar la billetera en el unificador); el dinero sigue existiendo
            // en la billetera real. El saldo queda guardado por si se reconecta.
            cuenta.Estado = "Desvinculada";
            await ctx.SaveChangesAsync();
            await tx.CommitAsync();

            return cuenta;
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }
}
