using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Billeteras.Negocio.Dtos;
using Billeteras.Negocio.Interfaces;

namespace Billeteras.Apps.WebApiApp.Controllers;

// Rúbrica 5.2 — todos los endpoints de la API deben estar autenticados.
// Las billeteras (Mercado Pago, Ualá, etc.) son un catálogo global: cualquier
// usuario autenticado puede leerlas, pero solo un Admin puede modificarlas.
[ApiController]
[Route("api/billeteras")]
[Authorize]
public class BilleterasController(IBilleteraNegocio negocio) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<BilleteraResponse>>> ObtenerTodos()
        => Ok(await negocio.ObtenerTodosAsync());

    [HttpGet("{id:int}")]
    public async Task<ActionResult<BilleteraResponse>> ObtenerPorId(int id)
    {
        var billetera = await negocio.ObtenerPorIdAsync(id);
        return billetera is null ? NotFound() : Ok(billetera);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<BilleteraResponse>> Crear([FromBody] BilleteraRequest req)
    {
        var creada = await negocio.CrearAsync(req);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = creada.BilleteraId }, creada);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<BilleteraResponse>> Actualizar(int id, [FromBody] BilleteraRequest req)
    {
        var actualizada = await negocio.ActualizarAsync(id, req);
        return actualizada is null ? NotFound() : Ok(actualizada);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Eliminar(int id)
        => await negocio.EliminarAsync(id) ? NoContent() : NotFound();
}