using Billeteras.Negocio.Dtos;

namespace Billeteras.Negocio.Interfaces;

/// Servicio de negocio de CuentaBilletera (cuentas del usuario, vincular/desvincular).
public interface ICuentaBilleteraNegocio
{
    Task<List<CuentaBilleteraResponse>> ObtenerTodosAsync();                             // Lista todas las cuentas como DTO.
    Task<CuentaBilleteraResponse?> ObtenerPorIdAsync(int id);                            // Una cuenta por Id (null si no existe).
    Task<CuentaBilleteraResponse> CrearAsync(int usuarioId, CrearCuentaBilleteraRequest req); // Crea una cuenta para el usuario.
    Task<CuentaBilleteraResponse?> ActualizarAsync(int id, CuentaBilleteraRequest req);  // Actualiza una cuenta (null si no existe).
    Task<bool> EliminarAsync(int id);                                                   // Elimina la cuenta; false si no existía.

    /// <summary>Obtiene solo las cuentas Activas del usuario.</summary>
    Task<List<CuentaBilleteraResponse>> ObtenerActivasDeUsuarioAsync(int usuarioId);

    /// <summary>Vincula una billetera al usuario con validaciones transaccionales.</summary>
    Task<CuentaBilleteraResponse> VincularAsync(int usuarioId, VincularBilleteraRequest req);

    /// <summary>Desvincula (soft-delete) la cuenta validando ownership y saldo.</summary>
    Task<CuentaBilleteraResponse> DesvincularAsync(int cuentaId, int usuarioId);
}