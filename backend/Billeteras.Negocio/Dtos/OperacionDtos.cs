using System.ComponentModel.DataAnnotations;

namespace Billeteras.Negocio.Dtos;

// ─── Enviar (BE-03) ───────────────────────────────────────────────────────────
// Resta saldo de la cuenta origen y deja un único movimiento de egreso.
// CuentaDestinoId es opcional: si el envío es a una cuenta interna de la app,
// pasalo y el evento se loguea como TRANSFIRIÓ en Neo4j (BD-04). Si va a un
// destino externo (mock, número de teléfono, etc.), dejá el campo null.
public record EnviarRequest(
    [Range(1, int.MaxValue)] int CuentaOrigenId,
    [Range(1, int.MaxValue)] int CategoriaId,
    [Range(0.01, double.MaxValue)] decimal Monto,
    [MaxLength(250)] string? Descripcion,
    int? CuentaDestinoId = null);

// ─── Cambiar (BE-04) ──────────────────────────────────────────────────────────
// Resta de origen y suma a destino del mismo usuario; dos movimientos atómicos.
public record CambiarRequest(
    [Range(1, int.MaxValue)] int CuentaOrigenId,
    [Range(1, int.MaxValue)] int CuentaDestinoId,
    [Range(1, int.MaxValue)] int CategoriaEgresoId,
    [Range(1, int.MaxValue)] int CategoriaIngresoId,
    [Range(0.01, double.MaxValue)] decimal Monto,
    [MaxLength(250)] string? Descripcion);

// ─── Transferir (pago QR a otro usuario) ──────────────────────────────────────
// Igual que Cambiar pero SIN la restricción de "mismo usuario": mueve dinero de
// la cuenta del pagador a la cuenta de OTRO usuario (el que generó el QR de cobro).
// Crea dos movimientos (egreso en origen + ingreso en destino) en una transacción.
public record TransferirRequest(
    [Range(1, int.MaxValue)] int CuentaOrigenId,
    [Range(1, int.MaxValue)] int CuentaDestinoId,
    [Range(1, int.MaxValue)] int CategoriaEgresoId,
    [Range(1, int.MaxValue)] int CategoriaIngresoId,
    [Range(0.01, double.MaxValue)] decimal Monto,
    [MaxLength(250)] string? Descripcion);

// ─── Pagar QR (BE-05) ─────────────────────────────────────────────────────────
// Egreso a un comercio identificado por QR (referencia opcional para auditoría).
// Si el cliente puede decodificar el QR y mandar ComercioId/RazonSocial/Cuit,
// se materializa el nodo Comercio y la relación PAGÓ_EN en Neo4j (BD-04).
// Si no los manda, solo queda el movimiento SQL.
public record PagarQrRequest(
    [Range(1, int.MaxValue)] int CuentaOrigenId,
    [Range(1, int.MaxValue)] int CategoriaId,
    [Range(0.01, double.MaxValue)] decimal Monto,
    [MaxLength(250)] string? Descripcion,
    [MaxLength(255)] string? CodigoQR,
    int? ComercioId = null,
    [MaxLength(100)] string? RazonSocial = null,
    [MaxLength(20)] string? Cuit = null);

public record OperacionResponse(
    string Operacion,
    List<int> MovimientosCreados,
    decimal SaldoOrigenFinal,
    decimal? SaldoDestinoFinal);
