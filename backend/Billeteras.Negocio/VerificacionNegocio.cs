using Billeteras.Datos.Interfaces;
using Billeteras.Entidades;
using Billeteras.Negocio.Dtos;
using Billeteras.Negocio.Interfaces;

namespace Billeteras.Negocio;

/// Servicio de códigos de verificación de 6 dígitos. En este TP no hay envío
/// real de emails: el código se loguea por consola en un banner bien visible
/// para que se pueda probar el flujo end-to-end sin un proveedor de mail.
public class VerificacionNegocio(
    ICodigoVerificacionRepository repoCodigos,
    IUsuarioRepository repoUsuarios) : IVerificacionNegocio
{
    private const int ThrottleSegundos = 60;
    private const int ExpiracionMinutos = 15;

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

        LoguearCodigo(usuario.Email, tipo, codigoGenerado);

        return new SolicitarCodigoResult(true, "Si el email existe, te enviamos un código.");
    }

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
