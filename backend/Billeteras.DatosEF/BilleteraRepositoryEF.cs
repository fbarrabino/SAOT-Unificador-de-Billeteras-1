using Microsoft.EntityFrameworkCore;
using Billeteras.Datos.Interfaces;
using Billeteras.Entidades;

namespace Billeteras.DatosEF;

/// Implementación EF Core del repositorio de Billetera.
public class BilleteraRepositoryEF(BilleterasContext ctx) : IBilleteraRepository
{
    // Trae todas las billeteras del catálogo.
    public async Task<List<Billetera>> ObtenerTodosAsync()
        => await ctx.Billeteras.ToListAsync();

    // Busca una billetera por su clave primaria (null si no existe).
    public async Task<Billetera?> ObtenerPorIdAsync(int id)
        => await ctx.Billeteras.FindAsync(id);

    // Inserta una billetera nueva y devuelve el Id generado.
    public async Task<int> InsertarAsync(Billetera entidad)
    {
        ctx.Billeteras.Add(entidad);
        await ctx.SaveChangesAsync();
        return entidad.BilleteraId;
    }

    // Actualiza una billetera; true si se guardó algún cambio.
    public async Task<bool> ActualizarAsync(Billetera entidad)
    {
        ctx.Billeteras.Update(entidad);
        return await ctx.SaveChangesAsync() > 0;
    }

    // Elimina la billetera por Id; false si no existía.
    public async Task<bool> EliminarAsync(int id)
    {
        var entidad = await ctx.Billeteras.FindAsync(id);
        if (entidad is null) return false;
        ctx.Billeteras.Remove(entidad);
        return await ctx.SaveChangesAsync() > 0;
    }
}
