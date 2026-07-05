using Microsoft.Data.SqlClient;
using Billeteras.Datos.Interfaces;
using Billeteras.Entidades;

namespace Billeteras.Datos;

/// Implementación ADO.NET puro del repositorio de Categoria.
public class CategoriaRepositoryAdo(string connectionString) : ICategoriaRepository
{
    // Trae todas las categorías con un SELECT directo y las mapea a objetos.
    public async Task<List<Categoria>> ObtenerTodosAsync()
    {
        var lista = new List<Categoria>();
        const string sql = "SELECT CategoriaId, Nombre, Tipo FROM Categoria;";

        using var conn = new SqlConnection(connectionString);
        using var cmd = new SqlCommand(sql, conn);
        await conn.OpenAsync();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            lista.Add(Map(reader));

        return lista;
    }

    // Busca una categoría por Id con parámetro @id (null si no hay fila).
    public async Task<Categoria?> ObtenerPorIdAsync(int id)
    {
        const string sql = "SELECT CategoriaId, Nombre, Tipo FROM Categoria WHERE CategoriaId = @id;";

        using var conn = new SqlConnection(connectionString);
        using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@id", id);
        await conn.OpenAsync();
        using var reader = await cmd.ExecuteReaderAsync();
        return await reader.ReadAsync() ? Map(reader) : null;
    }

    // Inserta una categoría y devuelve el Id nuevo vía SCOPE_IDENTITY().
    public async Task<int> InsertarAsync(Categoria entidad)
    {
        const string sql = @"INSERT INTO Categoria (Nombre, Tipo)
                             VALUES (@nombre, @tipo);
                             SELECT CAST(SCOPE_IDENTITY() AS int);";

        using var conn = new SqlConnection(connectionString);
        using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@nombre", entidad.Nombre);
        cmd.Parameters.AddWithValue("@tipo", entidad.Tipo);
        await conn.OpenAsync();
        return (int)(await cmd.ExecuteScalarAsync())!;
    }

    // Actualiza nombre y tipo de la categoría; true si afectó alguna fila.
    public async Task<bool> ActualizarAsync(Categoria entidad)
    {
        const string sql = @"UPDATE Categoria
                             SET Nombre = @nombre, Tipo = @tipo
                             WHERE CategoriaId = @id;";

        using var conn = new SqlConnection(connectionString);
        using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@nombre", entidad.Nombre);
        cmd.Parameters.AddWithValue("@tipo", entidad.Tipo);
        cmd.Parameters.AddWithValue("@id", entidad.CategoriaId);
        await conn.OpenAsync();
        return await cmd.ExecuteNonQueryAsync() > 0;
    }

    // Elimina la categoría por Id; true si borró alguna fila.
    public async Task<bool> EliminarAsync(int id)
    {
        const string sql = "DELETE FROM Categoria WHERE CategoriaId = @id;";

        using var conn = new SqlConnection(connectionString);
        using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@id", id);
        await conn.OpenAsync();
        return await cmd.ExecuteNonQueryAsync() > 0;
    }

    // Mapea la fila actual del reader a un objeto Categoria.
    private static Categoria Map(SqlDataReader reader) => new()
    {
        CategoriaId = reader.GetInt32(reader.GetOrdinal("CategoriaId")),
        Nombre = reader.GetString(reader.GetOrdinal("Nombre")),
        Tipo = reader.GetString(reader.GetOrdinal("Tipo"))
    };
}
