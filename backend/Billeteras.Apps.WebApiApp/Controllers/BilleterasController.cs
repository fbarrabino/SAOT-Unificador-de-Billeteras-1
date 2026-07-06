using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Billeteras.Negocio.Dtos;
using Billeteras.Negocio.Interfaces;

namespace Billeteras.Apps.WebApiApp.Controllers;

//  5.2 — todos los endpoints de la API deben estar autenticados.
// Las billeteras (Mercado Pago, Ualá, etc.) son un catálogo global: cualquier
// usuario autenticado puede leerlas, pero solo un Admin puede modificarlas.
[ApiController]
[Route("api/billeteras")]
[Authorize]
public class BilleterasController(IBilleteraNegocio negocio) : ControllerBase
{
    // GET /api/billeteras — lista el catálogo de billeteras (cualquier usuario autenticado).
    [HttpGet]
    public async Task<ActionResult<List<BilleteraResponse>>> ObtenerTodos()
        => Ok(await negocio.ObtenerTodosAsync());

    // GET /api/billeteras/{id} — una billetera por Id (404 si no existe).
    [HttpGet("{id:int}")]
    public async Task<ActionResult<BilleteraResponse>> ObtenerPorId(int id)
    {
        var billetera = await negocio.ObtenerPorIdAsync(id);
        return billetera is null ? NotFound() : Ok(billetera);
    }

    // POST /api/billeteras — crea una billetera (solo Admin).
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<BilleteraResponse>> Crear([FromBody] BilleteraRequest req)
    {
        var creada = await negocio.CrearAsync(req);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = creada.BilleteraId }, creada);
    }

    // PUT /api/billeteras/{id} — actualiza una billetera (solo Admin; 404 si no existe).
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<BilleteraResponse>> Actualizar(int id, [FromBody] BilleteraRequest req)
    {
        var actualizada = await negocio.ActualizarAsync(id, req);
        return actualizada is null ? NotFound() : Ok(actualizada);
    }

    // DELETE /api/billeteras/{id} — elimina una billetera (solo Admin; 404 si no existe).
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Eliminar(int id)
        => await negocio.EliminarAsync(id) ? NoContent() : NotFound();
}