using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Billeteras.Negocio.Dtos;
using Billeteras.Negocio.Interfaces;

namespace Billeteras.Apps.WebApiApp.Controllers;

[ApiController]
[Route("api/cuentas-billetera")]
[Authorize]
public class CuentasBilleteraController(ICuentaBilleteraNegocio negocio) : ControllerBase
{
    /// GET /api/cuentas-billetera — admin/debug, sin filtro de usuario.
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<CuentaBilleteraResponse>>> ObtenerTodos()
        => Ok(await negocio.ObtenerTodosAsync());

    /// GET /api/cuentas-billetera/me — solo cuentas Activas del usuario autenticado.
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<List<CuentaBilleteraResponse>>> ObtenerMias()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(idClaim, out var usuarioId))
            return Unauthorized(new { mensaje = "Token inválido: no se pudo obtener el ID de usuario." });

        try
        {
            var activas = await negocio.ObtenerActivasDeUsuarioAsync(usuarioId);
            return Ok(activas);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[CuentasBilletera/me] Error: {ex}");
            return StatusCode(500, new { mensaje = "Error interno al obtener las cuentas." });
        }
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CuentaBilleteraResponse>> ObtenerPorId(int id)
    {
        var cuenta = await negocio.ObtenerPorIdAsync(id);
        if (cuenta is null) return NotFound();

        // Ownership: el dueño la ve; los Admin también.
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(idClaim, out var usuarioId)) return Unauthorized();
        if (cuenta.UsuarioId != usuarioId && !User.IsInRole("Admin"))
            return Forbid();

        return Ok(cuenta);
    }

    [HttpPost]
    public async Task<ActionResult<CuentaBilleteraResponse>> Crear([FromBody] CrearCuentaBilleteraRequest req)
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(idClaim, out var usuarioId))
            return Unauthorized(new { mensaje = "Token inválido: no se pudo obtener el ID de usuario." });

        var creada = await negocio.CrearAsync(usuarioId, req);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = creada.CuentaBilleteraId }, creada);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<CuentaBilleteraResponse>> Actualizar(int id, [FromBody] CuentaBilleteraRequest req)
    {
        var actualizada = await negocio.ActualizarAsync(id, req);
        return actualizada is null ? NotFound() : Ok(actualizada);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Eliminar(int id)
        => await negocio.EliminarAsync(id) ? NoContent() : NotFound();

    // ── BE-08: Vincular / Desvincular ────────────────────────────────────────

    /// POST /api/cuentas-billetera/vincular
    /// Vincula una billetera al usuario autenticado.
    [HttpPost("vincular")]
    public async Task<ActionResult<CuentaBilleteraResponse>> Vincular([FromBody] VincularBilleteraRequest req)
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(idClaim, out var usuarioId))
            return Unauthorized(new { mensaje = "Token inválido." });

        try
        {
            var cuenta = await negocio.VincularAsync(usuarioId, req);
            return CreatedAtAction(nameof(ObtenerPorId), new { id = cuenta.CuentaBilleteraId }, cuenta);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { mensaje = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[CuentasBilletera/vincular] Error: {ex}");
            return StatusCode(500, new { mensaje = "Error interno al vincular la billetera." });
        }
    }

    /// DELETE /api/cuentas-billetera/{id}/desvincular
    /// Desvincula (soft-delete) la cuenta del usuario autenticado.
    [HttpDelete("{id:int}/desvincular")]
    public async Task<ActionResult<CuentaBilleteraResponse>> Desvincular(int id)
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(idClaim, out var usuarioId))
            return Unauthorized(new { mensaje = "Token inválido." });

        try
        {
            var cuenta = await negocio.DesvincularAsync(id, usuarioId);
            return Ok(cuenta);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { mensaje = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { mensaje = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[CuentasBilletera/desvincular] Error: {ex}");
            return StatusCode(500, new { mensaje = "Error interno al desvincular la cuenta." });
        }
    }
}