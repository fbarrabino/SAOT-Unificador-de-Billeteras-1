using Billeteras.Datos.Interfaces;
using Billeteras.Entidades;
using Billeteras.Negocio.Dtos;
using Billeteras.Negocio.Interfaces;

namespace Billeteras.Negocio;

/// Servicio de códigos de verificación de 6 dígitos. El código se envía por
/// email real (SMTP vía IEmailSender) y además se loguea en un banner de consola
/// como respaldo para debug / demo si el correo no estuviera configurado.
public class VerificacionNegocio(
    ICodigoVerificacionRepository repoCodigos,
    IUsuarioRepository repoUsuarios,
    IEmailSender emailSender) : IVerificacionNegocio
{
    private const int ThrottleSegundos = 60;
    private const int ExpiracionMinutos = 15;

    // Genera y "envía" un código para el email/tipo, con throttle de 60s y sin revelar si el email existe.
    public async Task<SolicitarCodigoResult> SolicitarCodigoAsync(string email, string tipo)
    {
        var usuario = await repoUsuarios.ObtenerPorEmailAsync(email);

        // No revelamos si el email existe: si no hay usuario, respondemos "Ok"
        // igual (mismo mensaje que el caso feliz) pero no generamos ni logueamos nada.
        if (usuario is null)
            return new SolicitarCodigoResult(true, "Si el email existe, te enviamos un código.");

        var ultimo = await repoCodigos.ObtenerUltimoAsync(usuario.UsuarioId, tipo);
        if (ultimo is not null)
        {
            var segundosTranscurridos = (DateTime.Now - ultimo.FechaCreacion).TotalSeconds;
            if (segundosTranscurridos < ThrottleSegundos)
            {
                var restantes = (int)Math.Ceiling(ThrottleSegundos - segundosTranscurridos);
                return new SolicitarCodigoResult(
                    false,
                    $"Esperá {restantes} segundos antes de pedir otro código.",
                    restantes);
            }
        }

        var codigoGenerado = GenerarCodigo();
        var codigo = new CodigoVerificacion
        {
            UsuarioId = usuario.UsuarioId,
            Codigo = codigoGenerado,
            Tipo = tipo,
            ExpiraEn = DateTime.Now.AddMinutes(ExpiracionMinutos),
        };
        await repoCodigos.InsertarAsync(codigo);

        // Banner de consola (respaldo de debug/demo) + envío real por email.
        LoguearCodigo(usuario.Email, tipo, codigoGenerado);
        await EnviarCodigoPorEmailAsync(usuario.Email, tipo, codigoGenerado);

        return new SolicitarCodigoResult(true, "Si el email existe, te enviamos un código.");
    }

    // Valida el código de reset y, si es vigente, actualiza la contraseña (BCrypt) y lo marca usado.
    public async Task<ValidarCodigoResult> ResetearPasswordAsync(string email, string codigo, string nuevaPassword)
    {
        var usuario = await repoUsuarios.ObtenerPorEmailAsync(email);
        if (usuario is null)
            return new ValidarCodigoResult(false, "Código inválido o expirado.");

        var vigente = await repoCodigos.ObtenerVigenteAsync(usuario.UsuarioId, codigo, TiposCodigoVerificacion.ResetPassword);
        if (vigente is null)
            return new ValidarCodigoResult(false, "Código inválido o expirado.");

        usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(nuevaPassword);
        await repoUsuarios.ActualizarAsync(usuario);
        await repoCodigos.MarcarUsadoAsync(vigente.CodigoId);

        return new ValidarCodigoResult(true, "Contraseña actualizada correctamente.");
    }

    // Valida el código de verificación de email y, si es vigente, marca EmailVerificado=true (A8).
    public async Task<ValidarCodigoResult> VerificarEmailAsync(string email, string codigo)
    {
        var usuario = await repoUsuarios.ObtenerPorEmailAsync(email);
        if (usuario is null)
            return new ValidarCodigoResult(false, "Código inválido o expirado.");

        if (usuario.EmailVerificado)
            return new ValidarCodigoResult(true, "El email ya estaba verificado.");

        var vigente = await repoCodigos.ObtenerVigenteAsync(usuario.UsuarioId, codigo, TiposCodigoVerificacion.VerificacionEmail);
        if (vigente is null)
            return new ValidarCodigoResult(false, "Código inválido o expirado.");

        usuario.EmailVerificado = true;
        await repoUsuarios.ActualizarAsync(usuario);
        await repoCodigos.MarcarUsadoAsync(vigente.CodigoId);

        return new ValidarCodigoResult(true, "Email verificado correctamente.");
    }

    // Arma el asunto/cuerpo según el tipo y lo manda por email. No lanza:
    // EmailSender ya captura sus errores y el código queda en el banner.
    private async Task EnviarCodigoPorEmailAsync(string email, string tipo, string codigo)
    {
        var esReset = tipo == TiposCodigoVerificacion.ResetPassword;

        var asunto = esReset
            ? "SaOT — Código para recuperar tu contraseña"
            : "SaOT — Código de verificación de tu email";

        var accion = esReset
            ? "restablecer tu contraseña"
            : "verificar tu email";

        var cuerpoTexto =
            $"Tu código para {accion} es: {codigo}\n\n" +
            $"Vence en {ExpiracionMinutos} minutos. Si no lo solicitaste, ignorá este mensaje.";

        var cuerpoHtml =
            $"""
            <div style="font-family:Segoe UI,Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
              <h2 style="margin:0 0 8px">SaOT · Unificador de Billeteras</h2>
              <p style="color:#444">Usá este código para {accion}:</p>
              <p style="font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;
                        background:#f4f4f8;border-radius:8px;padding:16px 0;margin:16px 0">{codigo}</p>
              <p style="color:#888;font-size:13px">Vence en {ExpiracionMinutos} minutos. Si no lo solicitaste, ignorá este mensaje.</p>
            </div>
            """;

        await emailSender.EnviarAsync(email, asunto, cuerpoHtml, cuerpoTexto);
    }

    // Genera un código aleatorio de 6 dígitos (con ceros a la izquierda).
    private static string GenerarCodigo()
        => Random.Shared.Next(0, 1_000_000).ToString("D6");

    /// Banner llamativo en consola: reemplaza al envío real de email en este TP.
    private static void LoguearCodigo(string email, string tipo, string codigo)
    {
        Console.WriteLine();
        Console.WriteLine("╔══════════════════════════════════════════════════════╗");
        Console.WriteLine("║           📧  CÓDIGO DE VERIFICACIÓN (SIMULADO)        ║");
        Console.WriteLine("╠══════════════════════════════════════════════════════╣");
        Console.WriteLine($"║  Para:   {email,-46}║");
        Console.WriteLine($"║  Tipo:   {tipo,-46}║");
        Console.WriteLine("║                                                        ║");
        Console.WriteLine($"║                     >>> {codigo} <<<                     ║");
        Console.WriteLine("║                                                        ║");
        Console.WriteLine($"║  Expira en {ExpiracionMinutos} minutos.{new string(' ', 33)}║");
        Console.WriteLine("╚══════════════════════════════════════════════════════╝");
        Console.WriteLine();
    }
}
