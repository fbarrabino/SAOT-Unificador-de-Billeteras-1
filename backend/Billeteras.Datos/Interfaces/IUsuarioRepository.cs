using Billeteras.Entidades;

namespace Billeteras.Datos.Interfaces;

/// Contrato del repositorio de Usuario. Lo implementan tanto la versión ADO.NET
/// (Billeteras.Datos) como la versión EF Core (Billeteras.DatosEF).
public interface IUsuarioRepository
{
    Task<List<Usuario>> ObtenerTodosAsync();             // Lista todos los usuarios.
    Task<Usuario?> ObtenerPorIdAsync(int id);            // Busca un usuario por Id (null si no existe).
    Task<Usuario?> ObtenerPorEmailAsync(string email);   // Busca un usuario por email (para el login).
    Task<int> InsertarAsync(Usuario entidad);            // Inserta un usuario y devuelve el Id generado.
    Task<bool> ActualizarAsync(Usuario entidad);         // Actualiza un usuario; true si modificó filas.
    Task<bool> EliminarAsync(int id);                    // Elimina el usuario por Id; true si borró.

    /// BE-11 — Devuelve los nombres de los roles asignados al usuario
    /// (UsuarioRol JOIN Rol). Lista vacía si el usuario no tiene roles
    /// explícitos: el AuthController igual le asigna "User" por defecto.
    Task<List<string>> ObtenerNombresRolesAsync(int usuarioId);
}