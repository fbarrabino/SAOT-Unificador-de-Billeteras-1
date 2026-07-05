using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Billeteras.Entidades;
using Billeteras.Negocio.Dtos;
using Billeteras.Datos.Interfaces;

namespace Billeteras.Apps.WebApiApp.Controllers;

// API de métodos de pago externos (tarjetas del usuario). Todo autenticado.
[Route("api/metodos-pago")]
[ApiController]
[Authorize]
public class MetodosPagoExternosController(IMetodoPagoExternoRepository repository) : ControllerBase
{
    // GET /api/metodos-pago/usuario/{id} — métodos de pago de un usuario.
    [HttpGet("usuario/{usuarioId}")]
    public async Task<IActionResult> GetByUsuario(int usuarioId)
    {
        var metodos = await repository.GetByUsuarioIdAsync(usuarioId);
        var dtos = metodos.Select(m => new MetodoPagoExternoDto
        {
            MetodoId = m.MetodoId,
            UsuarioId = m.UsuarioId,
            Tipo = m.Tipo,
            UltimosCuatro = m.UltimosCuatro,
            EntidadEmisora = m.EntidadEmisora
        });
        return Ok(dtos);
    }

    // POST /api/metodos-pago — registra un método de pago externo.
    [HttpPost]
    public async Task<IActionResult> Create(CreateMetodoPagoExternoDto dto)
    {
        var entidad = new MetodoPagoExterno
        {
            UsuarioId = dto.UsuarioId,
            Tipo = dto.Tipo,
            UltimosCuatro = dto.UltimosCuatro,
            EntidadEmisora = dto.EntidadEmisora
        };

        var creado = await repository.AddAsync(entidad);
        return Ok(creado);
    }

    // DELETE /api/metodos-pago/{id} — elimina un método de pago por Id.
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await repository.DeleteAsync(id);
        return NoContent();
    }
}