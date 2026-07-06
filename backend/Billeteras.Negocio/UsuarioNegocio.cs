using Billeteras.Datos.Interfaces;
using Billeteras.Entidades;
using Billeteras.Negocio.Dtos;
using Billeteras.Negocio.Interfaces;

namespace Billeteras.Negocio;

/// Servicio de Negocio de Usuario. Recibe el repositorio por DI (ADO o EF).
/// Acá vive el hash/verificación de contraseña con BCrypt.
public class UsuarioNegocio(IUsuarioRepository repo) : IUsuarioNegocio
{
    // Trae todos los usuarios como DTO (nunca expone el PasswordHash).
    public async Task<List<UsuarioResponse>> ObtenerTodosAsync()
        => (await repo.ObtenerTodosAsync()).Select(Map).ToList();

    // Busca un usuario por Id y lo mapea a DTO (null si no existe).
    public async Task<UsuarioResponse?> ObtenerPorIdAsync(int id)
    {
        var usuario = await repo.ObtenerPorIdAsync(id);
        return usuario is null ? null : Map(usuario);
    }

    // Registra un usuario nuevo (email único, texto saneado, password con BCrypt); null si el email ya existe.
    public async Task<UsuarioResponse?> RegistrarAsync(RegistrarUsuarioRequest req)
    {
        // El email es único: si ya existe, no registramos.
        if (await repo.ObtenerPorEmailAsync(req.Email) is not null)
            return null;

        var usuario = new Usuario
        {
            // Saneamos el texto libre (anti-XSS almacenado, 5.3). El email y la
            // contraseña no se sanean: el email lo valida [EmailAddress] y la
            // contraseña se hashea con BCrypt (el hash embebe su propio salt).
            Nombre = Sanitizador.LimpiarTexto(req.Nombre)!,
            Apellido = Sanitizador.LimpiarTexto(req.Apellido)!,
            Email = req.Email,
            // Teléfono opcional (saneado): sirve para el cruce de contactos por número.
            Telefono = string.IsNullOrWhiteSpace(req.Telefono) ? null : Sanitizador.LimpiarTexto(req.Telefono),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password)
        };

        usuario.UsuarioId = await repo.InsertarAsync(usuario);
        return Map(usuario);
    }

    // Valida email + contraseña con BCrypt; devuelve el DTO si coincide, null si no.
    public async Task<UsuarioResponse?> AutenticarAsync(string email, string password)
    {
        var usuario = await repo.ObtenerPorEmailAsync(email);
        if (usuario is null)
            return null;

        return BCrypt.Net.BCrypt.Verify(password, usuario.PasswordHash)
            ? Map(usuario)
            : null;
    }

    // Actualiza nombre/apellido/email de un usuario (no toca la contraseña); null si no existe.
    public async Task<UsuarioResponse?> ActualizarAsync(int id, UsuarioUpdateRequest req)
    {
        var usuario = await repo.ObtenerPorIdAsync(id);
        if (usuario is null)
            return null;

        usuario.Nombre = Sanitizador.LimpiarTexto(req.Nombre)!;
        usuario.Apellido = Sanitizador.LimpiarTexto(req.Apellido)!;
        usuario.Email = req.Email;
        usuario.Pais = Sanitizador.LimpiarTexto(req.Pais);
        usuario.Telefono = Sanitizador.LimpiarTexto(req.Telefono);
        // La contraseña no se actualiza en este TP.

        await repo.ActualizarAsync(usuario);
        return Map(usuario);
    }

    // Actualiza la URL de la foto de perfil del usuario (D4).
    public async Task<UsuarioResponse?> ActualizarFotoAsync(int id, string fotoPerfilUrl)
    {
        var usuario = await repo.ObtenerPorIdAsync(id);
        if (usuario is null)
            return null;

        usuario.FotoPerfilUrl = fotoPerfilUrl;
        await repo.ActualizarAsync(usuario);
        return Map(usuario);
    }

    // Elimina el usuario por Id (delega directo al repositorio).
    public Task<bool> EliminarAsync(int id) => repo.EliminarAsync(id);

    // Devuelve los nombres de rol del usuario (para inyectarlos en el JWT).
    public Task<List<string>> ObtenerNombresRolesAsync(int usuarioId)
        => repo.ObtenerNombresRolesAsync(usuarioId);

    // Cambia la contraseña verificando primero la actual con BCrypt (D6).
    public async Task<ValidarCodigoResult> CambiarPasswordAsync(int usuarioId, string passwordActual, string passwordNueva)
    {
        var usuario = await repo.ObtenerPorIdAsync(usuarioId);
        if (usuario is null)
            return new ValidarCodigoResult(false, "Usuario no encontrado.");

        if (!BCrypt.Net.BCrypt.Verify(passwordActual, usuario.PasswordHash))
            return new ValidarCodigoResult(false, "La contraseña actual es incorrecta.");

        usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(passwordNueva);
        await repo.ActualizarAsync(usuario);

        return new ValidarCodigoResult(true, "Contraseña actualizada correctamente.");
    }

    // Convierte la entidad Usuario a su DTO de salida (sin el PasswordHash).
    private static UsuarioResponse Map(Usuario u)
        => new(u.UsuarioId, u.Nombre, u.Apellido, u.Email, u.FechaAlta, u.EmailVerificado, u.Pais, u.Telefono, u.FotoPerfilUrl);
}