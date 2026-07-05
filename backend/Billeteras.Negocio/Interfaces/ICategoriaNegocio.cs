using Billeteras.Negocio.Dtos;

namespace Billeteras.Negocio.Interfaces;

/// Servicio de negocio del catálogo de Categorías (valida y mapea entidad ↔ DTO).
public interface ICategoriaNegocio
{
    Task<List<CategoriaResponse>> ObtenerTodosAsync();                        // Lista todas las categorías como DTO.
    Task<CategoriaResponse?> ObtenerPorIdAsync(int id);                       // Una categoría por Id (null si no existe).
    Task<CategoriaResponse> CrearAsync(CategoriaRequest req);                 // Crea una categoría y devuelve su DTO.
    Task<CategoriaResponse?> ActualizarAsync(int id, CategoriaRequest req);   // Actualiza una categoría (null si no existe).
    Task<bool> EliminarAsync(int id);                                        // Elimina la categoría; false si no existía.
}