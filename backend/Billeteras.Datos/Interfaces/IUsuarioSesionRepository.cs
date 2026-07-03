using Billeteras.Entidades;

namespace Billeteras.Datos.Interfaces;

/// Contrato del repositorio de UsuarioSesion (dispositivos conectados / revocar sesiones, D7).
public interface IUsuarioSesionRepository
{
    Task<UsuarioSesion> InsertarAsync(UsuarioSesion sesion);
    Task<List<UsuarioSesion>> ObtenerActivasPorUsuarioAsync(int usuarioId);
    Task<UsuarioSesion?> ObtenerPorIdAsync(int sesionId);
    Task<UsuarioSesion?> ObtenerPorJtiAsync(string jti);
    Task MarcarInactivaAsync(int sesionId);
}
