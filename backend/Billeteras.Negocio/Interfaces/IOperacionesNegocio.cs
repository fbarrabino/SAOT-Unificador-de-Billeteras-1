using Billeteras.Negocio.Dtos;

namespace Billeteras.Negocio.Interfaces;

/// Operaciones transaccionales del dominio. Cada método agrupa movimiento(s)
/// + actualización de saldo bajo una misma transacción de base de datos.
public interface IOperacionesNegocio
{
    Task<OperacionResponse> EnviarAsync(EnviarRequest req);
    Task<OperacionResponse> CambiarAsync(CambiarRequest req);
    Task<OperacionResponse> TransferirAsync(TransferirRequest req);
    Task<OperacionResponse> PagarQrAsync(PagarQrRequest req);
    Task<OperacionResponse> AnularAsync(int movimientoId);
}
