using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Billeteras.Negocio.Dtos;
using Billeteras.Negocio.Interfaces;

namespace Billeteras.Apps.WebApiApp.Controllers;

[ApiController]
[Route("api/usuarios")]
[Authorize]
public class UsuariosController(IUsuarioNegocio negocio, ISesionNegocio sesiones, IWebHostEnvironment env) : ControllerBase
{
    // Extrae el UsuarioId / Jti del JWT (mismo patrón que TicketsSoporteController).
    private int UsuarioId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string Jti => User.FindFirstValue(JwtRegisteredClaimNames.Jti)!;

    // ── B7 (D1+D3): Perfil persistido ─────────────────────────────────────────
    /// GET /api/usuarios/me — perfil del usuario autenticado.
    [HttpGet("me")]
    public async Task<ActionResult<UsuarioResponse>> ObtenerPerfil()
    {
        var usuario = await negocio.ObtenerPorIdAsync(UsuarioId);
        return usuario is null ? NotFound() : Ok(usuario);
    }

    /// PUT /api/usuarios/me — actualiza Nombre, Apellido, Email, Pais y Telefono
    /// del usuario autenticado (vía JWT, no requiere pasar el id por ruta).
    [HttpPut("me")]
    public async Task<ActionResult<UsuarioResponse>> ActualizarPerfil([FromBody] UsuarioUpdateRequest req)
    {
        var actualizado = await negocio.ActualizarAsync(UsuarioId, req);
        return actualizado is null ? NotFound() : Ok(actualizado);
    }

    // ── B7 (D4): Foto de perfil ─────────────────────────────────────────────
    /// POST /api/usuarios/me/foto — recibe base64 (con o sin prefijo data URI),
    /// la guarda como archivo físico en wwwroot/uploads/perfiles/{usuarioId}.jpg
    /// y persiste solo la ruta relativa en la columna FotoPerfilUrl.
    [HttpPost("me/foto")]
    public async Task<ActionResult<UsuarioResponse>> SubirFoto([FromBody] SubirFotoRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.ImagenBase64))
            return BadRequest(new { mensaje = "La imagen es obligatoria." });

        // Acepta tanto "data:image/jpeg;base64,XXXX" como el base64 puro.
        var base64Puro = req.ImagenBase64;
        var comaIndex = base64Puro.IndexOf(',');
        if (base64Puro.StartsWith("data:") && comaIndex >= 0)
            base64Puro = base64Puro[(comaIndex + 1)..];

        byte[] bytes;
        try
        {
            bytes = Convert.FromBase64String(base64Puro);
        }
        catch (FormatException)
        {
            return BadRequest(new { mensaje = "El formato de la imagen no es un base64 válido." });
        }

        // Límite de 5 MB decodificados: evita que un payload gigante tumbe el server.
        const int limiteBytes = 5 * 1024 * 1024;
        if (bytes.Length > limiteBytes)
            return BadRequest(new { mensaje = "La imagen no puede superar los 5 MB." });

        var webRoot = string.IsNullOrEmpty(env.WebRootPath)
            ? Path.Combine(env.ContentRootPath, "wwwroot")
            : env.WebRootPath;

        var carpeta = Path.Combine(webRoot, "uploads", "perfiles");
        Directory.CreateDirectory(carpeta);

        var nombreArchivo = $"{UsuarioId}.jpg";
        var rutaFisica = Path.Combine(carpeta, nombreArchivo);
        await System.IO.File.WriteAllBytesAsync(rutaFisica, bytes);

        var rutaRelativa = $"/uploads/perfiles/{nombreArchivo}";
        var actualizado = await negocio.ActualizarFotoAsync(UsuarioId, rutaRelativa);
        return actualizado is null ? NotFound() : Ok(actualizado);
    }

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
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<UsuarioResponse>>> ObtenerTodos()
        => Ok(await negocio.ObtenerTodosAsync());

    [HttpGet("{id:int}")]
    public async Task<ActionResult<UsuarioResponse>> ObtenerPorId(int id)
    {
        if (!EsPropioOAdmin(id)) return Forbid();
        var usuario = await negocio.ObtenerPorIdAsync(id);
        return usuario is null ? NotFound() : Ok(usuario);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<UsuarioResponse>> Actualizar(int id, [FromBody] UsuarioUpdateRequest req)
    {
        if (!EsPropioOAdmin(id)) return Forbid();
        var actualizado = await negocio.ActualizarAsync(id, req);
        return actualizado is null ? NotFound() : Ok(actualizado);
    }

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