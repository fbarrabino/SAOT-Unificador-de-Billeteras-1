using Microsoft.Data.SqlClient;
using Billeteras.Datos.Interfaces;
using Billeteras.Entidades;

namespace Billeteras.Datos;

/// Implementación ADO.NET puro del repositorio de Usuario.
/// La connection string llega por DI desde IConfiguration
/// (upgrade del //Quitar con Inyeccion de Dependencias del profe: ya no se hardcodea).
public class UsuarioRepositoryAdo(string connectionString) : IUsuarioRepository
{
    // Trae todos los usuarios con un SELECT directo y los mapea a objetos.
    public async Task<List<Usuario>> ObtenerTodosAsync()
    {
        var lista = new List<Usuario>();
        const string sql = "SELECT UsuarioId, Nombre, Apellido, Email, PasswordHash, FechaAlta FROM Usuario;";

        using var conn = new SqlConnection(connectionString);
        using var cmd = new SqlCommand(sql, conn);
        await conn.OpenAsync();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            lista.Add(Map(reader));

        return lista;
    }

    // Busca un usuario por Id con parámetro @id (null si no hay fila).
    public async Task<Usuario?> ObtenerPorIdAsync(int id)
    {
        const string sql = "SELECT UsuarioId, Nombre, Apellido, Email, PasswordHash, FechaAlta FROM Usuario WHERE UsuarioId = @id;";

        using var conn = new SqlConnection(connectionString);
        using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@id", id);
        await conn.OpenAsync();
        using var reader = await cmd.ExecuteReaderAsync();
        return await reader.ReadAsync() ? Map(reader) : null;
    }

    // Busca un usuario por email (clave del login); null si no existe.
    public async Task<Usuario?> ObtenerPorEmailAsync(string email)
    {
        const string sql = "SELECT UsuarioId, Nombre, Apellido, Email, PasswordHash, FechaAlta FROM Usuario WHERE Email = @email;";

        using var conn = new SqlConnection(connectionString);
        using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@email", email);
        await conn.OpenAsync();
        using var reader = await cmd.ExecuteReaderAsync();
        return await reader.ReadAsync() ? Map(reader) : null;
    }

    // Inserta un usuario y devuelve el Id nuevo vía SCOPE_IDENTITY().
    public async Task<int> InsertarAsync(Usuario entidad)
    {
        // FechaAlta queda en manos del default GETDATE() de la DB.
        const string sql = @"INSERT INTO Usuario (Nombre, Apellido, Email, PasswordHash)
                             VALUES (@nombre, @apellido, @email, @passwordHash);
                             SELECT CAST(SCOPE_IDENTITY() AS int);";

        using var conn = new SqlConnection(connectionString);
        using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@nombre", entidad.Nombre);
        cmd.Parameters.AddWithValue("@apellido", entidad.Apellido);
        cmd.Parameters.AddWithValue("@email", entidad.Email);
        cmd.Parameters.AddWithValue("@passwordHash", entidad.PasswordHash);
        await conn.OpenAsync();
        return (int)(await cmd.ExecuteScalarAsync())!;
    }

    // Actualiza los datos del usuario; true si afectó alguna fila.
    public async Task<bool> ActualizarAsync(Usuario entidad)
    {
        const string sql = @"UPDATE Usuario
                             SET Nombre = @nombre, Apellido = @apellido, Email = @email, PasswordHash = @passwordHash
                             WHERE UsuarioId = @id;";

        using var conn = new SqlConnection(connectionString);
        using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@nombre", entidad.Nombre);
        cmd.Parameters.AddWithValue("@apellido", entidad.Apellido);
        cmd.Parameters.AddWithValue("@email", entidad.Email);
        cmd.Parameters.AddWithValue("@passwordHash", entidad.PasswordHash);
        cmd.Parameters.AddWithValue("@id", entidad.UsuarioId);
        await conn.OpenAsync();
        return await cmd.ExecuteNonQueryAsync() > 0;
    }

    // Elimina el usuario por Id (hard delete); true si borró alguna fila.
    public async Task<bool> EliminarAsync(int id)
    {
        // Hard delete (TP-04). El soft delete es de un TP posterior.
        const string sql = "DELETE FROM Usuario WHERE UsuarioId = @id;";

        using var conn = new SqlConnection(connectionString);
        using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@id", id);
        await conn.OpenAsync();
        return await cmd.ExecuteNonQueryAsync() > 0;
    }

    // Devuelve los nombres de rol del usuario (JOIN UsuarioRol → Rol).
    public async Task<List<string>> ObtenerNombresRolesAsync(int usuarioId)
    {
        var roles = new List<string>();
        const string sql =
            "SELECT r.Nombre FROM UsuarioRol ur " +
            "JOIN Rol r ON r.RolId = ur.RolId " +
            "WHERE ur.UsuarioId = @id;";

        using var conn = new SqlConnection(connectionString);
        using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@id", usuarioId);
        await conn.OpenAsync();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            roles.Add(reader.GetString(0));
        return roles;
    }

    // Mapea la fila actual del reader a un objeto Usuario.
    private static Usuario Map(SqlDataReader reader) => new()
    {
        UsuarioId = reader.GetInt32(reader.GetOrdinal("UsuarioId")),
        Nombre = reader.GetString(reader.GetOrdinal("Nombre")),
        Apellido = reader.GetString(reader.GetOrdinal("Apellido")),
        Email = reader.GetString(reader.GetOrdinal("Email")),
        PasswordHash = reader.GetString(reader.GetOrdinal("PasswordHash")),
        FechaAlta = reader.GetDateTime(reader.GetOrdinal("FechaAlta"))
    };
}
