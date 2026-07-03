using Microsoft.EntityFrameworkCore;
using Billeteras.Entidades;
using Billeteras.Datos.Interfaces;

namespace Billeteras.DatosEF;

public class UsuarioSesionRepositoryEF(BilleterasContext context) : IUsuarioSesionRepository
{
    public async Task<UsuarioSesion> InsertarAsync(UsuarioSesion sesion)
    {
        context.UsuariosSesiones.Add(sesion);
        await context.SaveChangesAsync();
        return sesion;
    }

    public async Task<List<UsuarioSesion>> ObtenerActivasPorUsuarioAsync(int usuarioId)
        => await context.UsuariosSesiones
            .Where(s => s.UsuarioId == usuarioId && s.Activa)
            .OrderByDescending(s => s.UltimaActividad)
            .ToListAsync();

    public async Task<UsuarioSesion?> ObtenerPorIdAsync(int sesionId)
        => await context.UsuariosSesiones.FindAsync(sesionId);

    public async Task<UsuarioSesion?> ObtenerPorJtiAsync(string jti)
        => await context.UsuariosSesiones.FirstOrDefaultAsync(s => s.JwtJti == jti);

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
