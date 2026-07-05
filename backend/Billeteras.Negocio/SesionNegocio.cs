using Billeteras.Datos.Interfaces;
using Billeteras.Entidades;
using Billeteras.Negocio.Dtos;
using Billeteras.Negocio.Interfaces;

namespace Billeteras.Negocio;

/// Lógica de negocio de sesiones/dispositivos conectados (D7): registrar el login,
/// listar sesiones activas y revocar una sesión propia.
public class SesionNegocio(IUsuarioSesionRepository repo) : ISesionNegocio
{
    // Registra una sesión nueva en cada login (guarda el Jti del token y datos del dispositivo).
    public Task RegistrarSesionAsync(int usuarioId, string jti, string? dispositivoNombre, string? ip)
        => repo.InsertarAsync(new UsuarioSesion
        {
            UsuarioId = usuarioId,
            JwtJti = jti,
            DispositivoNombre = dispositivoNombre,
            IpUltimoLogin = ip,
        });

    // Lista las sesiones activas del usuario, marcando cuál corresponde al token actual.
    public async Task<List<SesionResponse>> ListarSesionesAsync(int usuarioId, string jtiActual)
    {
        var sesiones = await repo.ObtenerActivasPorUsuarioAsync(usuarioId);
        return sesiones
            .Select(s => new SesionResponse(
                s.SesionId,
                s.DispositivoNombre,
                s.IpUltimoLogin,
                s.FechaCreacion,
                s.UltimaActividad,
                s.JwtJti == jtiActual))
            .ToList();
    }

    // Revoca una sesión validando que sea del propio usuario (false si no existe o no le pertenece).
    public async Task<bool> RevocarSesionAsync(int usuarioId, int sesionId)
    {
        var sesion = await repo.ObtenerPorIdAsync(sesionId);
        if (sesion is null || sesion.UsuarioId != usuarioId)
            return false;

        await repo.MarcarInactivaAsync(sesionId);
        return true;
    }
}
