using Billeteras.Negocio.Dtos;

namespace Billeteras.Negocio.Interfaces;

/// Mecanismo genérico de códigos de 6 dígitos (CodigoVerificacion), reusado por
/// reset de contraseña (A3/A4) y verificación de email al registrarse (A8).
public interface IVerificacionNegocio
{
    /// Genera y "envía" (Console.WriteLine) un código de 6 dígitos para el email
    /// dado, con el Tipo indicado. Aplica throttle de 60s entre reenvíos.
    /// Nunca revela si el email existe o no (siempre responde Ok salvo throttle).
    Task<SolicitarCodigoResult> SolicitarCodigoAsync(string email, string tipo);

    /// Valida email + código + Tipo == ResetPassword y, si es válido, actualiza
    /// la contraseña (BCrypt) y marca el código como usado.
    Task<ValidarCodigoResult> ResetearPasswordAsync(string email, string codigo, string nuevaPassword);

    /// A8 — Valida email + código + Tipo == VerificacionEmail y, si es válido,
    /// marca Usuario.EmailVerificado = true y el código como usado.
    Task<ValidarCodigoResult> VerificarEmailAsync(string email, string codigo);
}
