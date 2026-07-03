using Billeteras.Entidades;

namespace Billeteras.Datos.Interfaces;

/// Contrato del repositorio de CodigoVerificacion (reset de contraseña,
/// verificación de email, etc). El campo Tipo distingue el flujo.
public interface ICodigoVerificacionRepository
{
    Task<CodigoVerificacion> InsertarAsync(CodigoVerificacion codigo);

    /// Último código emitido para ese usuario/tipo (para el throttle de reenvío).
    Task<CodigoVerificacion?> ObtenerUltimoAsync(int usuarioId, string tipo);

    /// Código vigente: coincide, no usado y no vencido. Null si no hay match.
    Task<CodigoVerificacion?> ObtenerVigenteAsync(int usuarioId, string codigo, string tipo);

    Task MarcarUsadoAsync(int codigoId);
}
