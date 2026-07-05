using Billeteras.Negocio.Dtos;

namespace Billeteras.Negocio.Interfaces;

/// Servicio de negocio de Movimiento (alta/consulta y listado paginado del historial).
public interface IMovimientoNegocio
{
    Task<List<MovimientoResponse>> ObtenerTodosAsync();                       // Lista todos los movimientos como DTO.
    Task<MovimientoResponse?> ObtenerPorIdAsync(int id);                      // Un movimiento por Id (null si no existe).
    Task<MovimientoResponse> CrearAsync(MovimientoRequest req);              // Crea un movimiento y devuelve su DTO.
    Task<MovimientoResponse?> ActualizarAsync(int id, MovimientoRequest req); // Actualiza un movimiento (null si no existe).
    Task<bool> EliminarAsync(int id);                                        // Elimina el movimiento; false si no existía.

    /// Listado paginado + filtrado de los movimientos del usuario. Normaliza los
    /// filtros, aplica límites defensivos (page/size) y devuelve un PagedResult
    /// listo para el cliente.
    Task<PagedResult<MovimientoResponse>> ObtenerPaginadoPorUsuarioAsync(
        int usuarioId,
        string? tipo,
        string? texto,
        int pageNumber,
        int pageSize);
}