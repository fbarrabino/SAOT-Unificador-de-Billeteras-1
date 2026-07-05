using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;
using Billeteras.Negocio.Interfaces;

namespace Billeteras.Negocio;

/// Envío real de emails por SMTP usando MailKit. Lee la configuración de la
/// sección "Email" (host/puerto/remitente en appsettings; el password por
/// user-secrets o variable de entorno, NUNCA commiteado).
///
/// Para Gmail: Host=smtp.gmail.com, Port=587, UseStartTls=true, User=tu cuenta
/// y Password = una "Contraseña de aplicación" de 16 dígitos (requiere 2FA).
public class EmailSender(IConfiguration config) : IEmailSender
{
    public async Task<bool> EnviarAsync(string destinatario, string asunto, string cuerpoHtml, string cuerpoTexto)
    {
        var seccion = config.GetSection("Email");

        var host = seccion["Host"];
        var user = seccion["User"];
        var password = seccion["Password"];

        // Si no está configurado el SMTP, no rompemos: avisamos por consola y
        // el código sigue disponible en el banner de VerificacionNegocio.
        if (string.IsNullOrWhiteSpace(host) ||
            string.IsNullOrWhiteSpace(user) ||
            string.IsNullOrWhiteSpace(password))
        {
            Console.Error.WriteLine(
                "[Email] SMTP sin configurar (falta Email:Host/User/Password). " +
                "No se envió el correo; usá el código del banner de consola.");
            return false;
        }

        var puerto = int.TryParse(seccion["Port"], out var p) ? p : 587;
        var usarStartTls = !bool.TryParse(seccion["UseStartTls"], out var s) || s; // default true
        var fromEmail = string.IsNullOrWhiteSpace(seccion["From"]) ? user : seccion["From"]!;
        var fromNombre = string.IsNullOrWhiteSpace(seccion["FromName"]) ? "SaOT — Unificador de Billeteras" : seccion["FromName"]!;

        try
        {
            var mensaje = new MimeMessage();
            mensaje.From.Add(new MailboxAddress(fromNombre, fromEmail));
            mensaje.To.Add(MailboxAddress.Parse(destinatario));
            mensaje.Subject = asunto;

            mensaje.Body = new BodyBuilder
            {
                HtmlBody = cuerpoHtml,
                TextBody = cuerpoTexto,
            }.ToMessageBody();

            using var cliente = new SmtpClient();
            var opcionSsl = usarStartTls ? SecureSocketOptions.StartTls : SecureSocketOptions.SslOnConnect;
            await cliente.ConnectAsync(host, puerto, opcionSsl);
            await cliente.AuthenticateAsync(user, password);
            await cliente.SendAsync(mensaje);
            await cliente.DisconnectAsync(true);

            Console.WriteLine($"[Email] Enviado a {destinatario} — \"{asunto}\".");
            return true;
        }
        catch (Exception ex)
        {
            // Nunca propagamos: el registro / forgot-password no deben fallar
            // porque el correo no haya salido. Queda el código en el banner.
            Console.Error.WriteLine($"[Email] No se pudo enviar a {destinatario}: {ex.Message}");
            return false;
        }
    }
}
