using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Billeteras.Negocio.Dtos;
using Billeteras.Negocio.Interfaces;

namespace Billeteras.Apps.WebApiApp.Controllers;

// API REST de usuarios: gestión del propio perfil, sesiones/dispositivos (D7) y
// operaciones de Admin. Todo autenticado; cada acción valida ownership o rol Admin.
[ApiController]
[Route("api/usuarios")]
[Authorize]
public class UsuariosController(IUsuarioNegocio negocio, ISesionNegocio sesiones) : ControllerBase
{
    // Extrae el UsuarioId / Jti del JWT (mismo patrón que TicketsSoporteController).
    private int UsuarioId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string Jti => User.FindFirstValue(JwtRegisteredClaimNames.Jti)!;

    // ── D7: Dispositivos conectados ───────────────────────────────────────────

    /// GET /api/usuarios/me/sesiones — sesiones activas del usuario autenticado.
    [HttpGet("me/sesiones")]
    public async Task<ActionResult<List<SesionResponse>>> ListarSesiones()
        => Ok(await sesiones.ListarSesionesAsync(UsuarioId, Jti));

    /// POST /api/usuarios/me/sesiones/{id}/revocar — cierra una sesión propia.
    [HttpPost("me/sesiones/{id:int}/revocar")]
    public async Task<IActionResult> RevocarSesion(int id)
    {
        var ok = await sesiones.RevocarSesionAsync(UsuarioId, id);
        if (!ok)
            return NotFound(new { mensaje = "La sesión no existe o no te pertenece." });

        return Ok(new { mensaje = "Sesión cerrada correctamente." });
    }

    // El alta de usuario se hace por POST /api/auth/register.

    // GET /api/usuarios — lista todos los usuarios (solo Admin).
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<UsuarioResponse>>> ObtenerTodos()
        => Ok(await negocio.ObtenerTodosAsync());

    // GET /api/usuarios/{id} — un usuario por Id (solo el propio o un Admin).
    [HttpGet("{id:int}")]
    public async Task<ActionResult<UsuarioResponse>> ObtenerPorId(int id)
    {
        if (!EsPropioOAdmin(id)) return Forbid();
        var usuario = await negocio.ObtenerPorIdAsync(id);
        return usuario is null ? NotFound() : Ok(usuario);
    }

    // PUT /api/usuarios/{id} — actualiza el perfil (solo el propio o un Admin; 404 si no existe).
    [HttpPut("{id:int}")]
    public async Task<ActionResult<UsuarioResponse>> Actualizar(int id, [FromBody] UsuarioUpdateRequest req)
    {
        if (!EsPropioOAdmin(id)) return Forbid();
        var actualizado = await negocio.ActualizarAsync(id, req);
        return actualizado is null ? NotFound() : Ok(actualizado);
    }

    // DELETE /api/usuarios/{id} — elimina un usuario (solo Admin; 404 si no existe).
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Eliminar(int id)
        => await negocio.EliminarAsync(id) ? NoContent() : NotFound();

    /// El usuario solo puede ver/editar su propio registro; los Admin a todos.
    private bool EsPropioOAdmin(int targetUsuarioId)
    {
        if (User.IsInRole("Admin")) return true;
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(idClaim, out var actualId) && actualId == targetUsuarioId;
    }
}