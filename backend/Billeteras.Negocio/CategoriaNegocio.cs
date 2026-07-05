using Billeteras.Datos.Interfaces;
using Billeteras.Entidades;
using Billeteras.Negocio.Dtos;
using Billeteras.Negocio.Interfaces;

namespace Billeteras.Negocio;

/// Lógica de negocio del catálogo de Categorías: orquesta el repositorio y
/// convierte entre entidades (DB) y DTOs (API).
public class CategoriaNegocio(ICategoriaRepository repo) : ICategoriaNegocio
{
    // Trae todas las categorías y las mapea a DTO de respuesta.
    public async Task<List<CategoriaResponse>> ObtenerTodosAsync()
        => (await repo.ObtenerTodosAsync()).Select(Map).ToList();

    // Busca una categoría por Id y la mapea a DTO (null si no existe).
    public async Task<CategoriaResponse?> ObtenerPorIdAsync(int id)
    {
        var categoria = await repo.ObtenerPorIdAsync(id);
        return categoria is null ? null : Map(categoria);
    }

    // Crea una categoría a partir del request y devuelve su DTO con el Id nuevo.
    public async Task<CategoriaResponse> CrearAsync(CategoriaRequest req)
    {
        var categoria = new Categoria { Nombre = req.Nombre, Tipo = req.Tipo };
        categoria.CategoriaId = await repo.InsertarAsync(categoria);
        return Map(categoria);
    }

    // Actualiza una categoría existente; devuelve null si el Id no existe.
    public async Task<CategoriaResponse?> ActualizarAsync(int id, CategoriaRequest req)
    {
        var categoria = await repo.ObtenerPorIdAsync(id);
        if (categoria is null)
            return null;

        categoria.Nombre = req.Nombre;
        categoria.Tipo = req.Tipo;

        await repo.ActualizarAsync(categoria);
        return Map(categoria);
    }

    // Elimina la categoría por Id (delega directo al repositorio).
    public Task<bool> EliminarAsync(int id) => repo.EliminarAsync(id);

    // Convierte la entidad Categoria a su DTO de respuesta.
    private static CategoriaResponse Map(Categoria c)
        => new(c.CategoriaId, c.Nombre, c.Tipo);
}
