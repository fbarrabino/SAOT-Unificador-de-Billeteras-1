using Billeteras.Entidades;

namespace Billeteras.Datos.Interfaces;

/// Operaciones de dominio que necesitan ejecutar varios cambios bajo una
/// misma transaccion de base de datos: insercion de movimiento(s) +
/// actualizacion de saldo(s).
public interface IOperacionesRepository
{
    /// BE-03 — Resta monto del saldo de cuentaOrigenId e inserta un
    /// movimiento de egreso. Si se especifica cuentaDestinoId, suma el monto
    /// a dicha cuenta e inserta un movimiento de ingreso en la misma transaccion.
    Task<(List<int> movimientosIds, decimal saldoOrigenFinal, decimal? saldoDestinoFinal)> EnviarAsync(
        int cuentaOrigenId,
        int? cuentaDestinoId,
        int categoriaId,
        decimal monto,
        string? descripcion);

    Task<(int movEgresoId, int movIngresoId, decimal saldoOrigenFinal, decimal saldoDestinoFinal)> CambiarAsync(
        int cuentaOrigenId,
        int cuentaDestinoId,
        int categoriaEgresoId,
        int categoriaIngresoId,
        decimal monto,
        string? descripcion);

    /// Transferencia entre usuarios DISTINTOS (pago de un QR de cobro). Igual que
    /// Cambiar pero sin exigir que ambas cuentas sean del mismo usuario.
    Task<(int movEgresoId, int movIngresoId, decimal saldoOrigenFinal, decimal saldoDestinoFinal)>
        TransferirAsync(
            int cuentaOrigenId,
            int cuentaDestinoId,
            int categoriaEgresoId,
            int categoriaIngresoId,
            decimal monto,
            string? descripcion);

    /// BE-05 — Egreso a comercio (pago QR).
    Task<(int movimientoId, decimal saldoOrigenFinal)> PagarQrAsync(
        int cuentaOrigenId,
        int categoriaId,
        decimal monto,
        string? descripcion,
        string? codigoQR);

    Task<(int movimientoId, decimal saldoFinal)> AnularAsync(int movimientoId);
}