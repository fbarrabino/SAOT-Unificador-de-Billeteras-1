namespace Billeteras.Negocio.Interfaces;

/// Abstracción del envío de emails. La implementación concreta (SMTP con MailKit)
/// se registra por DI. Se mantiene mínima a propósito: el Negocio solo necesita
/// "mandá este asunto + cuerpo a esta dirección".
public interface IEmailSender
{
    /// Envía un email. Devuelve true si se envió, false si falló (nunca lanza:
    /// el flujo de verificación no debe romperse porque el correo no salga).
    Task<bool> EnviarAsync(string destinatario, string asunto, string cuerpoHtml, string cuerpoTexto);
}
