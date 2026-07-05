using Microsoft.EntityFrameworkCore;
using Billeteras.Entidades;
using Billeteras.Datos.Interfaces;

namespace Billeteras.DatosEF;

/// Implementación EF Core del repositorio de UsuarioSesion (dispositivos conectados, D7).
public class UsuarioSesionRepositoryEF(BilleterasContext context) : IUsuarioSesionRepository
{
    // Registra una sesión nueva (se crea en cada login exitoso) y la devuelve.
    public async Task<UsuarioSesion> InsertarAsync(UsuarioSesion sesion)
    {
        context.UsuariosSesiones.Add(sesion);
        await context.SaveChangesAsync();
        return sesion;
    }

    // Sesiones activas del usuario, ordenadas por última actividad (dispositivos conectados).
    public async Task<List<UsuarioSesion>> ObtenerActivasPorUsuarioAsync(int usuarioId)
        => await context.UsuariosSesiones
            .Where(s => s.UsuarioId == usuarioId && s.Activa)
            .OrderByDescending(s => s.UltimaActividad)
            .ToListAsync();

    // Busca una sesión por su Id (null si no existe).
    public async Task<UsuarioSesion?> ObtenerPorIdAsync(int sesionId)
        => await context.UsuariosSesiones.FindAsync(sesionId);

    // Busca la sesión por el Jti del token JWT (para validar/revocar ese token).
    public async Task<UsuarioSesion?> ObtenerPorJtiAsync(string jti)
        => await context.UsuariosSesiones.FirstOrDefaultAsync(s => s.JwtJti == jti);

    // Revoca (marca inactiva) una sesión: su token deja de ser válido.
    public async Task MarcarInactivaAsync(int sesionId)
    {
        var sesion = await context.UsuariosSesiones.FindAsync(sesionId);
        if (sesion != null)
        {
            sesion.Activa = false;
            await context.SaveChangesAsync();
        }
    }
}
