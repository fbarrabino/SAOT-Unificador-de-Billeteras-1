using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Billeteras.Entidades;
using Billeteras.Negocio.Dtos;
using Billeteras.Datos.Interfaces;

namespace Billeteras.Apps.WebApiApp.Controllers;

// API de la agenda de contactos. Todo autenticado; el dueño de la agenda se toma
// del JWT (no del body) para que nadie pueda operar sobre contactos ajenos.
[Route("api/contactos")]
[ApiController]
[Authorize]
public class ContactosController(IContactoRepository repository, IUsuarioRepository usuarioRepo) : ControllerBase
{
    // POST /api/contactos/match — recibe los emails de la agenda del teléfono y
    // devuelve cuáles corresponden a usuarios registrados (para agregarlos como
    // contacto). NO persiste la lista subida: solo consulta y descarta (privacidad).
    [HttpPost("match")]
    public async Task<IActionResult> Match([FromBody] MatchContactosRequest dto)
    {
        var usuarioId = ObtenerUsuarioIdActual();
        if (usuarioId == 0) return Unauthorized();

        if (dto?.Emails is null || dto.Emails.Count == 0)
            return Ok(Array.Empty<MatchContactoDto>());

        // Normalizamos (trim + minúsculas), deduplicamos y capamos: evita que se
        // suban agendas enormes y hace la búsqueda determinista.
        const int MaxEmails = 200;
        var emails = dto.Emails
            .Where(e => !string.IsNullOrWhiteSpace(e))
            .Select(e => e.Trim().ToLowerInvariant())
            .Distinct()
            .Take(MaxEmails)
            .ToList();

        var matches = new List<MatchContactoDto>();
        foreach (var email in emails)
        {
            var u = await usuarioRepo.ObtenerPorEmailAsync(email);
            // Excluimos al propio usuario (no tiene sentido agregarse a sí mismo).
            if (u is not null && u.UsuarioId != usuarioId)
            {
                matches.Add(new MatchContactoDto
                {
                    UsuarioId = u.UsuarioId,
                    Nombre = $"{u.Nombre} {u.Apellido}".Trim(),
                    Email = u.Email
                });
            }
        }

        return Ok(matches);
    }

    // GET /api/contactos/me — contactos del usuario del token.
    [HttpGet("me")]
    public async Task<IActionResult> GetMisContactos()
    {
        var usuarioId = ObtenerUsuarioIdActual();
        if (usuarioId == 0) return Unauthorized();

        var contactos = await repository.GetContactosDeUsuarioAsync(usuarioId);
        var dtos = contactos.Select(c => new ContactoDto
        {
            UsuarioPropietarioId = c.UsuarioPropietarioId,
            UsuarioContactoId = c.UsuarioContactoId,
            AliasPersonalizado = c.AliasPersonalizado,
            FechaAgregado = c.FechaAgregado
        });

        return Ok(dtos);
    }

    // GET /api/contactos/{id} — contactos de otro usuario (solo el propio dueño o un Admin).
    [HttpGet("{usuarioPropietarioId:int}")]
    public async Task<IActionResult> GetContactos(int usuarioPropietarioId)
    {
        var usuarioId = ObtenerUsuarioIdActual();
        if (usuarioId != usuarioPropietarioId && !User.IsInRole("Admin"))
        {
            return Forbid();
        }

        var contactos = await repository.GetContactosDeUsuarioAsync(usuarioPropietarioId);
        var dtos = contactos.Select(c => new ContactoDto
        {
            UsuarioPropietarioId = c.UsuarioPropietarioId,
            UsuarioContactoId = c.UsuarioContactoId,
            AliasPersonalizado = c.AliasPersonalizado,
            FechaAgregado = c.FechaAgregado
        });

        return Ok(dtos);
    }

    // POST /api/contactos — agrega un contacto al usuario del token (no permite autocontacto).
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateContactoDto dto)
    {
        var usuarioId = ObtenerUsuarioIdActual();
        if (usuarioId == 0) return Unauthorized();

        // Validacion para evitar autocontactos en la red.
        if (usuarioId == dto.UsuarioContactoId)
        {
            return BadRequest(new { mensaje = "El usuario no puede agregarse a si mismo como contacto." });
        }

        var entidad = new Contacto
        {
            // Asignacion estricta desde el token JWT para prevenir alteracion de identidad en peticiones HTTP.
            UsuarioPropietarioId = usuarioId,
            UsuarioContactoId = dto.UsuarioContactoId,
            AliasPersonalizado = dto.AliasPersonalizado
        };

        var creado = await repository.AddAsync(entidad);
        return Ok(creado);
    }

    // DELETE /api/contactos/{contactoId} — borra un contacto de la agenda del usuario del token.
    [HttpDelete("{usuarioContactoId:int}")]
    public async Task<IActionResult> DeleteMiContacto(int usuarioContactoId)
    {
        var usuarioId = ObtenerUsuarioIdActual();
        if (usuarioId == 0) return Unauthorized();

        await repository.DeleteAsync(usuarioId, usuarioContactoId);
        return NoContent();
    }

    // DELETE /api/contactos/{propietarioId}/{contactoId} — borra un contacto (solo el dueño o un Admin).
    [HttpDelete("{usuarioPropietarioId:int}/{usuarioContactoId:int}")]
    public async Task<IActionResult> Delete(int usuarioPropietarioId, int usuarioContactoId)
    {
        var usuarioId = ObtenerUsuarioIdActual();
        if (usuarioId != usuarioPropietarioId && !User.IsInRole("Admin"))
        {
            return Forbid();
        }

        await repository.DeleteAsync(usuarioPropietarioId, usuarioContactoId);
        return NoContent();
    }

    // Extrae el UsuarioId del token JWT (0 si no se pudo leer).
    private int ObtenerUsuarioIdActual()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(idClaim, out var actualId) ? actualId : 0;
    }
}