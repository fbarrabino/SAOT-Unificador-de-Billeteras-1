using Billeteras.Entidades;

namespace Billeteras.Datos.Interfaces;

/// Contrato del repositorio de CuentaBilletera (cuentas del usuario en cada billetera).
public interface ICuentaBilleteraRepository
{
    Task<List<CuentaBilletera>> ObtenerTodosAsync();     // Lista todas las cuentas de billetera.
    Task<CuentaBilletera?> ObtenerPorIdAsync(int id);    // Busca una cuenta por Id (null si no existe).
    Task<int> InsertarAsync(CuentaBilletera entidad);    // Inserta una cuenta y devuelve el Id generado.
    Task<bool> ActualizarAsync(CuentaBilletera entidad); // Actualiza una cuenta; true si modificó filas.
    Task<bool> EliminarAsync(int id);                    // Elimina la cuenta por Id; true si borró.

    /// <summary>Vincula una billetera al usuario con transacción. Valida existencia y duplicado activo.</summary>
    Task<CuentaBilletera> VincularAsync(int usuarioId, int billeteraId, string? alias);

    /// <summary>Desvincula (soft-delete) la cuenta. Valida ownership, estado Activa y saldo == 0.</summary>
    Task<CuentaBilletera> DesvincularAsync(int cuentaBilleteraId, int usuarioId);
}