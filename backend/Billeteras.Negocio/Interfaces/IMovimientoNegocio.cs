using Billeteras.Negocio.Dtos;

namespace Billeteras.Negocio.Interfaces;

public interface IMovimientoNegocio
{
    Task<List<MovimientoResponse>> ObtenerTodosAsync();
    Task<MovimientoResponse?> ObtenerPorIdAsync(int id);
    Task<MovimientoResponse> CrearAsync(MovimientoRequest req);
    Task<MovimientoResponse?> ActualizarAsync(int id, MovimientoRequest req);
    Task<bool> EliminarAsync(int id);

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