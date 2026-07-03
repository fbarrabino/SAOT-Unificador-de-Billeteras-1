using Billeteras.Datos.Interfaces;
using Billeteras.Entidades;
using Billeteras.Negocio.Dtos;
using Billeteras.Negocio.Interfaces;

namespace Billeteras.Negocio;

/// Servicio de Negocio de Movimiento.
/// NOTA: crear/editar un movimiento NO modifica el SaldoActual de la cuenta (eso es TP-06).
public class MovimientoNegocio(IMovimientoRepository repo) : IMovimientoNegocio
{
    public async Task<List<MovimientoResponse>> ObtenerTodosAsync()
        => (await repo.ObtenerTodosAsync()).Select(Map).ToList();

    public async Task<MovimientoResponse?> ObtenerPorIdAsync(int id)
    {
        var movimiento = await repo.ObtenerPorIdAsync(id);
        return movimiento is null ? null : Map(movimiento);
    }

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

    public Task<bool> EliminarAsync(int id) => repo.EliminarAsync(id);

    // ─── Paginado + filtrado (rúbrica 3.4 y 3.5) ────────────────────────────────
    public async Task<PagedResult<MovimientoResponse>> ObtenerPaginadoPorUsuarioAsync(
        int usuarioId, string? tipo, string? texto, int pageNumber, int pageSize)
    {
        // Límites defensivos: página mínima 1, tamaño entre 1 y 100 (evita que un
        // cliente pida pageSize=100000 y se traiga toda la tabla).
        pageNumber = pageNumber < 1 ? 1 : pageNumber;
        pageSize = Math.Clamp(pageSize, 1, 100);

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