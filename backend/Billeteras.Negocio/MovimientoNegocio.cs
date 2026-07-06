using Billeteras.Datos.Interfaces;
using Billeteras.Entidades;
using Billeteras.Negocio.Dtos;
using Billeteras.Negocio.Interfaces;

namespace Billeteras.Negocio;

/// Servicio de Negocio de Movimiento.
/// NOTA: crear/editar un movimiento NO modifica el SaldoActual de la cuenta (eso es TP-06).
public class MovimientoNegocio(IMovimientoRepository repo) : IMovimientoNegocio
{
    // Trae todos los movimientos y los mapea a DTO de respuesta.
    public async Task<List<MovimientoResponse>> ObtenerTodosAsync()
        => (await repo.ObtenerTodosAsync()).Select(Map).ToList();

    // Busca un movimiento por Id y lo mapea a DTO (null si no existe).
    public async Task<MovimientoResponse?> ObtenerPorIdAsync(int id)
    {
        var movimiento = await repo.ObtenerPorIdAsync(id);
        return movimiento is null ? null : Map(movimiento);
    }

    // Crea un movimiento (saneando la descripción) y devuelve su DTO.
    public async Task<MovimientoResponse> CrearAsync(MovimientoRequest req)
    {
        var movimiento = new Movimiento
        {
            CuentaBilleteraId = req.CuentaBilleteraId,
            CategoriaId = req.CategoriaId,
            Fecha = req.Fecha,
            // Saneamos el texto libre antes de persistir (anti-XSS almacenado, 5.3).
            Descripcion = Sanitizador.LimpiarTexto(req.Descripcion),
            Monto = req.Monto,
            Tipo = req.Tipo
        };
        movimiento.MovimientoId = await repo.InsertarAsync(movimiento);
        return Map(movimiento);
    }

    // Actualiza un movimiento existente (saneando la descripción); null si no existe.
    public async Task<MovimientoResponse?> ActualizarAsync(int id, MovimientoRequest req)
    {
        var movimiento = await repo.ObtenerPorIdAsync(id);
        if (movimiento is null)
            return null;

        movimiento.CuentaBilleteraId = req.CuentaBilleteraId;
        movimiento.CategoriaId = req.CategoriaId;
        movimiento.Fecha = req.Fecha;
        movimiento.Descripcion = Sanitizador.LimpiarTexto(req.Descripcion);
        movimiento.Monto = req.Monto;
        movimiento.Tipo = req.Tipo;

        await repo.ActualizarAsync(movimiento);
        return Map(movimiento);
    }

    // Elimina el movimiento por Id (delega directo al repositorio).
    public Task<bool> EliminarAsync(int id) => repo.EliminarAsync(id);

    // ─── Paginado + filtrado ( 3.4 y 3.5) ────────────────────────────────
    // Normaliza filtros, aplica límites defensivos y arma el PagedResult para el front.
    public async Task<PagedResult<MovimientoResponse>> ObtenerPaginadoPorUsuarioAsync(
        int usuarioId, string? tipo, string? texto, int pageNumber, int pageSize)
    {
        // Límites defensivos: página mínima 1, tamaño entre 1 y 25 (evita que un
        // cliente pida pageSize=100000 y se traiga toda la tabla).
        pageNumber = pageNumber < 1 ? 1 : pageNumber;
        pageSize = Math.Clamp(pageSize, 1, 25);

        // Normalizamos el filtro para que ande venga como venga del front.
        tipo = NormalizarTipo(tipo);
        texto = string.IsNullOrWhiteSpace(texto) ? null : texto.Trim();

        var (items, total) = await repo.ObtenerPaginadoPorUsuarioAsync(
            usuarioId, tipo, texto, pageNumber, pageSize);

        return new PagedResult<MovimientoResponse>(
            items.Select(Map).ToList(), pageNumber, pageSize, total);
    }

    /// Lleva el filtro de tipo a la forma canónica "Ingreso"/"Egreso". Acepta
    /// también "in"/"out" (como los usa el front) y null/"" = sin filtro.
    private static string? NormalizarTipo(string? tipo)
    {
        if (string.IsNullOrWhiteSpace(tipo)) return null;
        return tipo.Trim().ToLowerInvariant() switch
        {
            "in" or "ingreso" => "Ingreso",
            "out" or "egreso" => "Egreso",
            _ => tipo.Trim()
        };
    }

    // Convierte la entidad Movimiento a su DTO (con nombre de categoría y alias).
    private static MovimientoResponse Map(Movimiento m)
        => new(
            m.MovimientoId,
            m.CuentaBilleteraId,
            m.CategoriaId,
            m.Fecha,
            m.Descripcion,
            m.Monto,
            m.Tipo,
            m.Categoria?.Nombre,
            m.CuentaBilletera?.Alias);
}