using Billeteras.Entidades;

namespace Billeteras.Datos.Interfaces;

public interface IMovimientoRepository
{
    Task<List<Movimiento>> ObtenerTodosAsync();
    Task<Movimiento?> ObtenerPorIdAsync(int id);
    Task<int> InsertarAsync(Movimiento entidad);
    Task<bool> ActualizarAsync(Movimiento entidad);
    Task<bool> EliminarAsync(int id);

    /// Listado PAGINADO y FILTRADO resuelto EN LA BASE (no en memoria).
    /// Trae solo los movimientos de las cuentas del usuario (join con
    /// CuentaBilletera) que matcheen los filtros opcionales, ya paginados:
    ///   - <paramref name="tipo"/>  : "Ingreso" | "Egreso" | null (sin filtro).
    ///   - <paramref name="texto"/> : busca en Descripción y nombre de Categoría | null.
    ///   - <paramref name="pageNumber"/> : página 1..N.
    ///   - <paramref name="pageSize"/>   : filas por página.
    /// Devuelve la página pedida y el total de coincidencias (para calcular páginas).
    Task<(List<Movimiento> Items, int TotalCount)> ObtenerPaginadoPorUsuarioAsync(
        int usuarioId,
        string? tipo,
        string? texto,
        int pageNumber,
        int pageSize);
}