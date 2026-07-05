using Billeteras.Entidades;

namespace Billeteras.Datos.Interfaces;

/// Contrato del repositorio de UsuarioSesion (dispositivos conectados / revocar sesiones, D7).
public interface IUsuarioSesionRepository
{
    Task<UsuarioSesion> InsertarAsync(UsuarioSesion sesion);                  // Registra una sesión nueva (login).
    Task<List<UsuarioSesion>> ObtenerActivasPorUsuarioAsync(int usuarioId);   // Sesiones activas (dispositivos conectados).
    Task<UsuarioSesion?> ObtenerPorIdAsync(int sesionId);                     // Busca una sesión por Id.
    Task<UsuarioSesion?> ObtenerPorJtiAsync(string jti);                      // Busca la sesión por el Jti del token JWT.
    Task MarcarInactivaAsync(int sesionId);                                   // Revoca (cierra) una sesión.
}
