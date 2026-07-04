using Billeteras.Entidades;

namespace Billeteras.Datos.Interfaces;

/// Operaciones de dominio que necesitan ejecutar varios cambios bajo una
/// misma transacción de base de datos: inserción de movimiento(s) +
/// actualización de saldo(s). El control transaccional (BeginTransaction,
/// Commit, Rollback) vive en la implementación EF para no acoplarlo a la
/// capa de Negocio.
public interface IOperacionesRepository
{
    /// BE-03 — Resta `monto` del saldo de `cuentaOrigenId` e inserta un
    /// movimiento de egreso. Devuelve el id del movimiento y el saldo final.
    /// Lanza InvalidOperationException si el saldo es insuficiente o si la
    /// cuenta/categoría no existen; en ambos casos la transacción se revierte.
    Task<(int movimientoId, decimal saldoOrigenFinal)> EnviarAsync(
        int cuentaOrigenId,
        int categoriaId,
        decimal monto,
        string? descripcion);

    /// BE-04 — Resta de la cuenta origen, suma a la cuenta destino. Inserta
    /// dos movimientos atómicos. Devuelve los ids creados y los dos saldos.
    Task<(int movEgresoId, int movIngresoId, decimal saldoOrigenFinal, decimal saldoDestinoFinal)>
        CambiarAsync(
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

    /// BE-05 — Egreso a comercio (pago QR). Resta saldo e inserta un
    /// movimiento de egreso, guardando opcionalmente el código QR como
    /// metadata para auditoría.
    Task<(int movimientoId, decimal saldoOrigenFinal)> PagarQrAsync(
        int cuentaOrigenId,
        int categoriaId,
        decimal monto,
        string? descripcion,
        string? codigoQR);

    /// BE-09 — Anula un movimiento existente: marca Anulado=true y revierte
    /// el saldo de la cuenta (suma si era Egreso, resta si era Ingreso).
    /// Lanza InvalidOperationException si el movimiento no existe, ya estaba
    /// anulado, o si revertir un Ingreso dejaría la cuenta en negativo.
    Task<(int movimientoId, decimal saldoFinal)> AnularAsync(int movimientoId);
}
