namespace Billeteras.Negocio.Dtos;

/// Tipos de flujo que usan CodigoVerificacion. Un mismo mecanismo, distinto Tipo.
public static class TiposCodigoVerificacion
{
    public const string ResetPassword = "ResetPassword";
    public const string VerificacionEmail = "VerificacionEmail";
}

/// Resultado de pedir/reenviar un código (forgot-password, reenvío de verificación, etc).
public record SolicitarCodigoResult(bool Ok, string Mensaje, int? SegundosRestantes = null);

/// Resultado de validar un código (reset-password, verify-email).
public record ValidarCodigoResult(bool Ok, string Mensaje);
