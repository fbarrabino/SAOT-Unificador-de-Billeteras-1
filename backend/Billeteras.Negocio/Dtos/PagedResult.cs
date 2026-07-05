namespace Billeteras.Negocio.Dtos;

/// Resultado paginado genérico que devuelven los listados con paginación REAL
/// (OFFSET/FETCH en ADO.NET · Skip/Take en EF Core). Lleva la metadata que el
/// cliente necesita para pintar "página X de Y" o resolver el scroll infinito.
///
/// Se serializa a JSON en camelCase → { items, pageNumber, pageSize, totalCount,
/// totalPages, hasNext }. Las dos últimas son propiedades calculadas: el
/// serializador de System.Text.Json también las incluye.
public record PagedResult<T>(
    IReadOnlyList<T> Items,
    int PageNumber,
    int PageSize,
    int TotalCount)
{
    /// Cantidad total de páginas según el total de coincidencias y el tamaño de página.
    public int TotalPages => TotalCount == 0
        ? 0
        : (int)Math.Ceiling(TotalCount / (double)PageSize);

    /// True si hay una página siguiente (lo usa el front para el onEndReached).
    public bool HasNext => PageNumber < TotalPages;
}
