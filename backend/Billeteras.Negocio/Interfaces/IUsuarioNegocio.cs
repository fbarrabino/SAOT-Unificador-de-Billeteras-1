using Billeteras.Negocio.Dtos;

namespace Billeteras.Negocio.Interfaces;

public interface IUsuarioNegocio
{
    Task<List<UsuarioResponse>> ObtenerTodosAsync();
    Task<UsuarioResponse?> ObtenerPorIdAsync(int id);

    /// Registra un usuario nuevo. Devuelve null si el email ya existe.
    Task<UsuarioResponse?> RegistrarAsync(RegistrarUsuarioRequest req);

    /// Valida email + contraseña (BCrypt). Devuelve null si las credenciales son inválidas.
    Task<UsuarioResponse?> AutenticarAsync(string email, string password);

    /// Actualiza un usuario. Devuelve null si no existe.
    Task<UsuarioResponse?> ActualizarAsync(int id, UsuarioUpdateRequest req);

    /// D4 — Actualiza solo la ruta de la foto de perfil (el archivo ya se guardó en disco).
    Task<UsuarioResponse?> ActualizarFotoAsync(int id, string fotoPerfilUrl);

    Task<bool> EliminarAsync(int id);

    /// BE-11 — Nombres de roles asignados al usuario, para inyectar en el JWT.
    Task<List<string>> ObtenerNombresRolesAsync(int usuarioId);

    /// D6 — Cambia la contraseña verificando primero la actual (BCrypt).
    /// Devuelve Ok=false si el usuario no existe o passwordActual no coincide.
    Task<ValidarCodigoResult> CambiarPasswordAsync(int usuarioId, string passwordActual, string passwordNueva);
}