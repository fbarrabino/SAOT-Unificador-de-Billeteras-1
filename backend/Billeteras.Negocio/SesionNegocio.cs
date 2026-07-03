using Billeteras.Datos.Interfaces;
using Billeteras.Entidades;
using Billeteras.Negocio.Dtos;
using Billeteras.Negocio.Interfaces;

namespace Billeteras.Negocio;

public class SesionNegocio(IUsuarioSesionRepository repo) : ISesionNegocio
{
    public Task RegistrarSesionAsync(int usuarioId, string jti, string? dispositivoNombre, string? ip)
        => repo.InsertarAsync(new UsuarioSesion
        {
            UsuarioId = usuarioId,
            JwtJti = jti,
            DispositivoNombre = dispositivoNombre,
            IpUltimoLogin = ip,
        });

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

    public async Task<bool> RevocarSesionAsync(int usuarioId, int sesionId)
    {
        var sesion = await repo.ObtenerPorIdAsync(sesionId);
        if (sesion is null || sesion.UsuarioId != usuarioId)
            return false;

        await repo.MarcarInactivaAsync(sesionId);
        return true;
    }
}
