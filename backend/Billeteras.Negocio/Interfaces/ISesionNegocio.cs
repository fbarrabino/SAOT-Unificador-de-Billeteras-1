using Billeteras.Negocio.Dtos;

namespace Billeteras.Negocio.Interfaces;

/// D7 — Registro y administración de sesiones (una fila por login exitoso).
public interface ISesionNegocio
{
    /// Se llama desde AuthController.Login tras emitir el JWT.
    Task RegistrarSesionAsync(int usuarioId, string jti, string? dispositivoNombre, string? ip);

    /// Sesiones activas del usuario, marcando cuál es la del token actual.
    Task<List<SesionResponse>> ListarSesionesAsync(int usuarioId, string jtiActual);

    /// Revoca una sesión propia. Devuelve false si no existe o no le pertenece.
    Task<bool> RevocarSesionAsync(int usuarioId, int sesionId);
}
