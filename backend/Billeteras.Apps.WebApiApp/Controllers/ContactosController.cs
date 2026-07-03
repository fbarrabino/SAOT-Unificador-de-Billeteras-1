using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Billeteras.Entidades;
using Billeteras.Negocio.Dtos;
using Billeteras.Datos.Interfaces;

namespace Billeteras.Apps.WebApiApp.Controllers;

[Route("api/contactos")]
[ApiController]
[Authorize]
public class ContactosController(IContactoRepository repository) : ControllerBase
{
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

    [HttpDelete("{usuarioContactoId:int}")]
    public async Task<IActionResult> DeleteMiContacto(int usuarioContactoId)
    {
        var usuarioId = ObtenerUsuarioIdActual();
        if (usuarioId == 0) return Unauthorized();

        await repository.DeleteAsync(usuarioId, usuarioContactoId);
        return NoContent();
    }

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

    private int ObtenerUsuarioIdActual()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(idClaim, out var actualId) ? actualId : 0;
    }
}