using Microsoft.Data.SqlClient;
using Billeteras.Datos.Interfaces;
using Billeteras.Entidades;

namespace Billeteras.Datos;

/// Implementación ADO.NET puro del repositorio de Billetera.
public class BilleteraRepositoryAdo(string connectionString) : IBilleteraRepository
{
    // Trae todas las billeteras con un SELECT directo y las mapea a objetos.
    public async Task<List<Billetera>> ObtenerTodosAsync()
    {
        var lista = new List<Billetera>();
        const string sql = "SELECT BilleteraId, Nombre, LogoUrl FROM Billetera;";

        using var conn = new SqlConnection(connectionString);
        using var cmd = new SqlCommand(sql, conn);
        await conn.OpenAsync();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            lista.Add(Map(reader));

        return lista;
    }

    // Busca una billetera por Id con parámetro @id (null si no hay fila).
    public async Task<Billetera?> ObtenerPorIdAsync(int id)
    {
        const string sql = "SELECT BilleteraId, Nombre, LogoUrl FROM Billetera WHERE BilleteraId = @id;";

        using var conn = new SqlConnection(connectionString);
        using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@id", id);
        await conn.OpenAsync();
        using var reader = await cmd.ExecuteReaderAsync();
        return await reader.ReadAsync() ? Map(reader) : null;
    }

    // Inserta una billetera y devuelve el Id nuevo vía SCOPE_IDENTITY().
    public async Task<int> InsertarAsync(Billetera entidad)
    {
        const string sql = @"INSERT INTO Billetera (Nombre, LogoUrl)
                            VALUES (@nombre, @logoUrl);
                            SELECT CAST(SCOPE_IDENTITY() AS int);";

        using var conn = new SqlConnection(connectionString);
        using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@nombre", entidad.Nombre);
        cmd.Parameters.AddWithValue("@logoUrl", (object?)entidad.LogoUrl ?? DBNull.Value);
        await conn.OpenAsync();
        return (int)(await cmd.ExecuteScalarAsync())!;
    }

    // Actualiza nombre y logo de la billetera; true si afectó alguna fila.
    public async Task<bool> ActualizarAsync(Billetera entidad)
    {
        const string sql = @"UPDATE Billetera
                            SET Nombre = @nombre, LogoUrl = @logoUrl
                            WHERE BilleteraId = @id;";

        using var conn = new SqlConnection(connectionString);
        using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@nombre", entidad.Nombre);
        cmd.Parameters.AddWithValue("@logoUrl", (object?)entidad.LogoUrl ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@id", entidad.BilleteraId);
        await conn.OpenAsync();
        return await cmd.ExecuteNonQueryAsync() > 0;
    }

    // Elimina la billetera por Id; true si borró alguna fila.
    public async Task<bool> EliminarAsync(int id)
    {
        const string sql = "DELETE FROM Billetera WHERE BilleteraId = @id;";

        using var conn = new SqlConnection(connectionString);
        using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@id", id);
        await conn.OpenAsync();
        return await cmd.ExecuteNonQueryAsync() > 0;
    }

    // Mapea la fila actual del reader a un objeto Billetera.
    private static Billetera Map(SqlDataReader reader) => new()
    {
        BilleteraId = reader.GetInt32(reader.GetOrdinal("BilleteraId")),
        Nombre = reader.GetString(reader.GetOrdinal("Nombre")),
        LogoUrl = reader.IsDBNull(reader.GetOrdinal("LogoUrl")) ? null : reader.GetString(reader.GetOrdinal("LogoUrl"))
    };
}