using Billeteras.Negocio.Dtos;

namespace Billeteras.Negocio.Interfaces;

public interface ICuentaBilleteraNegocio
{
    Task<List<CuentaBilleteraResponse>> ObtenerTodosAsync();
    Task<CuentaBilleteraResponse?> ObtenerPorIdAsync(int id);
    Task<CuentaBilleteraResponse> CrearAsync(int usuarioId, CrearCuentaBilleteraRequest req);
    Task<CuentaBilleteraResponse?> ActualizarAsync(int id, CuentaBilleteraRequest req);
    Task<bool> EliminarAsync(int id);

    /// <summary>Obtiene solo las cuentas Activas del usuario.</summary>
    Task<List<CuentaBilleteraResponse>> ObtenerActivasDeUsuarioAsync(int usuarioId);

    /// <summary>Vincula una billetera al usuario con validaciones transaccionales.</summary>
    Task<CuentaBilleteraResponse> VincularAsync(int usuarioId, VincularBilleteraRequest req);

    /// <summary>Desvincula (soft-delete) la cuenta validando ownership y saldo.</summary>
    Task<CuentaBilleteraResponse> DesvincularAsync(int cuentaId, int usuarioId);
}