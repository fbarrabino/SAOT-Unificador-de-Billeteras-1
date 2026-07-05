using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Billeteras.Negocio.Dtos;
using Billeteras.Negocio.Interfaces;

namespace Billeteras.Apps.WebApiApp.Controllers;

// API del historial de movimientos. Todo autenticado; los endpoints /me operan
// solo sobre las cuentas del usuario del token, el listado global es solo Admin.
[ApiController]
[Route("api/movimientos")]
[Authorize]
public class MovimientosController(
    IMovimientoNegocio negocio,
    ICuentaBilleteraNegocio cuentas) : ControllerBase
{
    /// GET /api/movimientos — admin only (cross-user).
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<MovimientoResponse>>> ObtenerTodos()
        => Ok(await negocio.ObtenerTodosAsync());

    /// GET /api/movimientos/me — protegido.
    /// Devuelve los movimientos de las cuentas del usuario autenticado,
    /// ordenados por fecha descendente.
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<List<MovimientoResponse>>> ObtenerMios()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(idClaim, out var usuarioId))
            return Unauthorized(new { mensaje = "Token inválido: no se pudo obtener el ID de usuario." });

        try
        {
            // 1. Obtenemos las cuentas del usuario para saber qué CuentaBilleteraIds le pertenecen
            var todasLasCuentas = await cuentas.ObtenerTodosAsync();
            var cuentaIdsDelUsuario = todasLasCuentas
                .Where(c => c.UsuarioId == usuarioId)
                .Select(c => c.CuentaBilleteraId)
                .ToHashSet();

            if (cuentaIdsDelUsuario.Count == 0)
                return Ok(new List<MovimientoResponse>());

            // 2. Filtramos los movimientos que pertenezcan a esas cuentas
            var todos = await negocio.ObtenerTodosAsync();
            var mios = todos
                .Where(m => cuentaIdsDelUsuario.Contains(m.CuentaBilleteraId))
                .OrderByDescending(m => m.Fecha)
                .ToList();

            return Ok(mios);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[Movimientos/me] Error: {ex}");
            return StatusCode(500, new { mensaje = "Error interno al obtener los movimientos." });
        }
    }

    /// GET /api/movimientos/me/paged — protegido.
    /// Listado PAGINADO y FILTRADO del usuario autenticado. Tanto el filtrado
    /// como el paginado se resuelven EN LA BASE (no en memoria):
    ///   - tipo=Ingreso|Egreso   (filtro 1, opcional)
    ///   - texto=...             (filtro 2, opcional: busca en descripción y categoría)
    ///   - pageNumber=1..N       (default 1)
    ///   - pageSize=1..100       (default 20)
    /// Ej: GET /api/movimientos/me/paged?tipo=Egreso&texto=super&pageNumber=1&pageSize=20
    [HttpGet("me/paged")]
    [Authorize]
    public async Task<ActionResult<PagedResult<MovimientoResponse>>> ObtenerMiosPaginado(
        [FromQuery] string? tipo = null,
        [FromQuery] string? texto = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(idClaim, out var usuarioId))
            return Unauthorized(new { mensaje = "Token inválido: no se pudo obtener el ID de usuario." });

        try
        {
            var pagina = await negocio.ObtenerPaginadoPorUsuarioAsync(
                usuarioId, tipo, texto, pageNumber, pageSize);
            return Ok(pagina);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[Movimientos/me/paged] Error: {ex}");
            return StatusCode(500, new { mensaje = "Error interno al obtener los movimientos." });
        }
    }

    // GET /api/movimientos/{id} — un movimiento por Id (404 si no existe).
    [HttpGet("{id:int}")]
    public async Task<ActionResult<MovimientoResponse>> ObtenerPorId(int id)
    {
        var movimiento = await negocio.ObtenerPorIdAsync(id);
        return movimiento is null ? NotFound() : Ok(movimiento);
    }

    // POST /api/movimientos — crea un movimiento suelto y devuelve su ubicación.
    [HttpPost]
    public async Task<ActionResult<MovimientoResponse>> Crear([FromBody] MovimientoRequest req)
    {
        var creado = await negocio.CrearAsync(req);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = creado.MovimientoId }, creado);
    }

    // PUT /api/movimientos/{id} — actualiza un movimiento (404 si no existe).
    [HttpPut("{id:int}")]
    public async Task<ActionResult<MovimientoResponse>> Actualizar(int id, [FromBody] MovimientoRequest req)
    {
        var actualizado = await negocio.ActualizarAsync(id, req);
        return actualizado is null ? NotFound() : Ok(actualizado);
    }

    // DELETE /api/movimientos/{id} — elimina un movimiento (404 si no existe).
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
        => await negocio.EliminarAsync(id) ? NoContent() : NotFound();
}