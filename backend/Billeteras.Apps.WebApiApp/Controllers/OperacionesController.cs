using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Billeteras.Negocio.Dtos;
using Billeteras.Negocio.Interfaces;

namespace Billeteras.Apps.WebApiApp.Controllers;

/// Endpoints transaccionales del dominio. Cada acción agrupa movimiento(s) +
/// actualización de saldo bajo una misma transacción: si algo falla se revierte
/// todo y se devuelve 409 con el mensaje del negocio.
///
/// BE-11 — Todos los endpoints requieren autenticación y, además, validan que
/// la cuenta origen / movimiento pertenezca al usuario autenticado. Los
/// usuarios con rol "Admin" saltean el check de ownership.
[ApiController]
[Route("api/operaciones")]
[Authorize]
public class OperacionesController(
    IOperacionesNegocio negocio,
    ICuentaBilleteraNegocio cuentas,
    IMovimientoNegocio movimientos) : ControllerBase
{
    [HttpPost("enviar")]
    public async Task<ActionResult<OperacionResponse>> Enviar([FromBody] EnviarRequest req)
    {
        var owns = await EsCuentaPropiaAsync(req.CuentaOrigenId);
        if (!owns.Allowed) return owns.Result!;
        return await EjecutarAsync(() => negocio.EnviarAsync(req));
    }

    [HttpPost("cambiar")]
    public async Task<ActionResult<OperacionResponse>> Cambiar([FromBody] CambiarRequest req)
    {
        var ownsOrigen = await EsCuentaPropiaAsync(req.CuentaOrigenId);
        if (!ownsOrigen.Allowed) return ownsOrigen.Result!;
        var ownsDestino = await EsCuentaPropiaAsync(req.CuentaDestinoId);
        if (!ownsDestino.Allowed) return ownsDestino.Result!;
        return await EjecutarAsync(() => negocio.CambiarAsync(req));
    }

    /// Transferencia a OTRO usuario (pago de un QR de cobro generado por alguien
    /// más). Solo validamos que la cuenta ORIGEN sea del pagador autenticado; la
    /// destino pertenece a quien generó el QR, así que NO se chequea su ownership.
    [HttpPost("transferir")]
    public async Task<ActionResult<OperacionResponse>> Transferir([FromBody] TransferirRequest req)
    {
        var owns = await EsCuentaPropiaAsync(req.CuentaOrigenId);
        if (!owns.Allowed) return owns.Result!;
        return await EjecutarAsync(() => negocio.TransferirAsync(req));
    }

    [HttpPost("pagar-qr")]
    public async Task<ActionResult<OperacionResponse>> PagarQr([FromBody] PagarQrRequest req)
    {
        var owns = await EsCuentaPropiaAsync(req.CuentaOrigenId);
        if (!owns.Allowed) return owns.Result!;
        return await EjecutarAsync(() => negocio.PagarQrAsync(req));
    }

    /// BE-09 — Anula un movimiento existente y revierte el saldo en una
    /// misma transacción. La idempotencia la garantiza el flag Anulado:
    /// un segundo POST devuelve 409 con "ya estaba anulado".
    [HttpPost("{movimientoId:int}/anular")]
    public async Task<ActionResult<OperacionResponse>> Anular(int movimientoId)
    {
        var mov = await movimientos.ObtenerPorIdAsync(movimientoId);
        if (mov is null) return NotFound(new { mensaje = "El movimiento no existe." });
        var owns = await EsCuentaPropiaAsync(mov.CuentaBilleteraId);
        if (!owns.Allowed) return owns.Result!;
        return await EjecutarAsync(() => negocio.AnularAsync(movimientoId));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /// Verifica que la cuenta indicada pertenezca al usuario autenticado.
    /// Los usuarios con rol "Admin" saltan el check y pueden operar sobre
    /// cualquier cuenta (útil para soporte).
    private async Task<(bool Allowed, ActionResult<OperacionResponse>? Result)> EsCuentaPropiaAsync(int cuentaId)
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(idClaim, out var usuarioId))
            return (false, Unauthorized(new { mensaje = "Token inválido." }));

        if (User.IsInRole("Admin")) return (true, null);

        var cuenta = await cuentas.ObtenerPorIdAsync(cuentaId);
        if (cuenta is null)
            return (false, NotFound(new { mensaje = $"La cuenta {cuentaId} no existe." }));

        if (cuenta.UsuarioId != usuarioId)
            return (false, Forbid());

        return (true, null);
    }

    /// Envoltorio común: las validaciones del negocio se traducen a 409 Conflict
    /// (saldo insuficiente, categoría inválida, cuentas inexistentes) y el resto
    /// queda en 500.
    private async Task<ActionResult<OperacionResponse>> EjecutarAsync(Func<Task<OperacionResponse>> accion)
    {
        try
        {
            var resultado = await accion();
            return Ok(resultado);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[Operaciones] Error inesperado: {ex}");
            return StatusCode(500, new { mensaje = "Error interno al procesar la operación." });
        }
    }
}
