using Microsoft.EntityFrameworkCore;
using Billeteras.Datos.Interfaces;
using Billeteras.Entidades;

namespace Billeteras.DatosEF;

/// Implementación EF Core del repositorio de Categoria.
public class CategoriaRepositoryEF(BilleterasContext ctx) : ICategoriaRepository
{
    // Trae todas las categorías de la base.
    public async Task<List<Categoria>> ObtenerTodosAsync()
        => await ctx.Categorias.ToListAsync();

    // Busca una categoría por su clave primaria (null si no existe).
    public async Task<Categoria?> ObtenerPorIdAsync(int id)
        => await ctx.Categorias.FindAsync(id);

    // Inserta una categoría nueva y devuelve el Id generado.
    public async Task<int> InsertarAsync(Categoria entidad)
    {
        ctx.Categorias.Add(entidad);
        await ctx.SaveChangesAsync();
        return entidad.CategoriaId;
    }

    // Actualiza una categoría; true si se guardó algún cambio.
    public async Task<bool> ActualizarAsync(Categoria entidad)
    {
        ctx.Categorias.Update(entidad);
        return await ctx.SaveChangesAsync() > 0;
    }

    // Elimina la categoría por Id; false si no existía.
    public async Task<bool> EliminarAsync(int id)
    {
        var entidad = await ctx.Categorias.FindAsync(id);
        if (entidad is null) return false;
        ctx.Categorias.Remove(entidad);
        return await ctx.SaveChangesAsync() > 0;
    }
}
