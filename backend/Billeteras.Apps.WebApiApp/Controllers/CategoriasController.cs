
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Billeteras.Negocio.Dtos;
using Billeteras.Negocio.Interfaces;

namespace Billeteras.Apps.WebApiApp.Controllers;

// Rúbrica 5.2 — todos los endpoints de la API deben estar autenticados.
// Las categorías son un catálogo global: cualquier usuario autenticado puede
// leerlas, pero solo un Admin puede crear/modificar/eliminar (mismo patrón que
// CuentasBilleteraController y UsuariosController).
[ApiController]
[Route("api/categorias")]
[Authorize]
public class CategoriasController(ICategoriaNegocio negocio) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<CategoriaResponse>>> ObtenerTodos()
        => Ok(await negocio.ObtenerTodosAsync());

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CategoriaResponse>> ObtenerPorId(int id)
    {
        var categoria = await negocio.ObtenerPorIdAsync(id);
        return categoria is null ? NotFound() : Ok(categoria);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CategoriaResponse>> Crear([FromBody] CategoriaRequest req)
    {
        var creada = await negocio.CrearAsync(req);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = creada.CategoriaId }, creada);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CategoriaResponse>> Actualizar(int id, [FromBody] CategoriaRequest req)
    {
        var actualizada = await negocio.ActualizarAsync(id, req);
        return actualizada is null ? NotFound() : Ok(actualizada);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Eliminar(int id)
        => await negocio.EliminarAsync(id) ? NoContent() : NotFound();
}