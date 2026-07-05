using Billeteras.Negocio.Dtos;

namespace Billeteras.Negocio.Interfaces;

/// Servicio de negocio del catálogo de Billeteras (valida y mapea entidad ↔ DTO).
public interface IBilleteraNegocio
{
    Task<List<BilleteraResponse>> ObtenerTodosAsync();                        // Lista todas las billeteras como DTO.
    Task<BilleteraResponse?> ObtenerPorIdAsync(int id);                       // Una billetera por Id (null si no existe).
    Task<BilleteraResponse> CrearAsync(BilleteraRequest req);                 // Crea una billetera y devuelve su DTO.
    Task<BilleteraResponse?> ActualizarAsync(int id, BilleteraRequest req);   // Actualiza una billetera (null si no existe).
    Task<bool> EliminarAsync(int id);                                        // Elimina la billetera; false si no existía.
}