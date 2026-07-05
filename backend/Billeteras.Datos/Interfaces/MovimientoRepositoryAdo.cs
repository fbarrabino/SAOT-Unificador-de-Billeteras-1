using Microsoft.Data.SqlClient;
using Billeteras.Datos.Interfaces;
using Billeteras.Entidades;

namespace Billeteras.Datos;

/// Implementación ADO.NET puro del repositorio de Movimiento.
/// Los SELECT hacen INNER JOIN para traer el nombre de la categoría y el alias de la cuenta.
public class MovimientoRepositoryAdo(string connectionString) : IMovimientoRepository
{
    // SELECT reutilizable con los JOIN a Categoria y CuentaBilletera (nombre y alias).
    private const string SelectBase = @"
        SELECT m.MovimientoId, m.CuentaBilleteraId, m.CategoriaId, m.Fecha, m.Descripcion, m.Monto, m.Tipo,
               cat.Nombre AS CategoriaNombre,
               c.Alias AS CuentaAlias
        FROM Movimiento m
        INNER JOIN Categoria cat ON cat.CategoriaId = m.CategoriaId
        INNER JOIN CuentaBilletera c ON c.CuentaBilleteraId = m.CuentaBilleteraId";

    // Trae todos los movimientos (con nombre de categoría y alias de cuenta).
    public async Task<List<Movimiento>> ObtenerTodosAsync()
    {
        var lista = new List<Movimiento>();
        const string sql = SelectBase + ";";

        using var conn = new SqlConnection(connectionString);
        using var cmd = new SqlCommand(sql, conn);
        await conn.OpenAsync();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            lista.Add(Map(reader));

        return lista;
    }

    // Busca un movimiento por Id con parámetro @id (null si no hay fila).
    public async Task<Movimiento?> ObtenerPorIdAsync(int id)
    {
        const string sql = SelectBase + " WHERE m.MovimientoId = @id;";

        using var conn = new SqlConnection(connectionString);
        using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@id", id);
        await conn.OpenAsync();
        using var reader = await cmd.ExecuteReaderAsync();
        return await reader.ReadAsync() ? Map(reader) : null;
    }

    // Inserta un movimiento y devuelve el Id nuevo vía SCOPE_IDENTITY().
    public async Task<int> InsertarAsync(Movimiento entidad)
    {
        // No se actualiza el SaldoActual de la cuenta (eso es TP-06).
        const string sql = @"INSERT INTO Movimiento (CuentaBilleteraId, CategoriaId, Fecha, Descripcion, Monto, Tipo)
                             VALUES (@cuentaBilleteraId, @categoriaId, @fecha, @descripcion, @monto, @tipo);
                             SELECT CAST(SCOPE_IDENTITY() AS int);";

        using var conn = new SqlConnection(connectionString);
        using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@cuentaBilleteraId", entidad.CuentaBilleteraId);
        cmd.Parameters.AddWithValue("@categoriaId", entidad.CategoriaId);
        cmd.Parameters.AddWithValue("@fecha", entidad.Fecha);
        cmd.Parameters.AddWithValue("@descripcion", (object?)entidad.Descripcion ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@monto", entidad.Monto);
        cmd.Parameters.AddWithValue("@tipo", entidad.Tipo);
        await conn.OpenAsync();
        return (int)(await cmd.ExecuteScalarAsync())!;
    }

    // Actualiza los datos del movimiento; true si afectó alguna fila.
    public async Task<bool> ActualizarAsync(Movimiento entidad)
    {
        const string sql = @"UPDATE Movimiento
                             SET CuentaBilleteraId = @cuentaBilleteraId, CategoriaId = @categoriaId, Fecha = @fecha,
                                 Descripcion = @descripcion, Monto = @monto, Tipo = @tipo
                             WHERE MovimientoId = @id;";

        using var conn = new SqlConnection(connectionString);
        using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@cuentaBilleteraId", entidad.CuentaBilleteraId);
        cmd.Parameters.AddWithValue("@categoriaId", entidad.CategoriaId);
        cmd.Parameters.AddWithValue("@fecha", entidad.Fecha);
        cmd.Parameters.AddWithValue("@descripcion", (object?)entidad.Descripcion ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@monto", entidad.Monto);
        cmd.Parameters.AddWithValue("@tipo", entidad.Tipo);
        cmd.Parameters.AddWithValue("@id", entidad.MovimientoId);
        await conn.OpenAsync();
        return await cmd.ExecuteNonQueryAsync() > 0;
    }

    // Elimina el movimiento por Id; true si borró alguna fila.
    public async Task<bool> EliminarAsync(int id)
    {
        const string sql = "DELETE FROM Movimiento WHERE MovimientoId = @id;";

        using var conn = new SqlConnection(connectionString);
        using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@id", id);
        await conn.OpenAsync();
        return await cmd.ExecuteNonQueryAsync() > 0;
    }

    // ─── Paginado + filtrado REAL en la base (rúbrica 3.4 y 3.5) ─────────────────
    // Arma un WHERE dinámico parametrizado y devuelve la página pedida + el total.
    public async Task<(List<Movimiento> Items, int TotalCount)> ObtenerPaginadoPorUsuarioAsync(
        int usuarioId, string? tipo, string? texto, int pageNumber, int pageSize)
    {
        // WHERE dinámico pero SIEMPRE parametrizado: nunca concatenamos los
        // valores del usuario dentro del SQL → inmune a SQL injection (rúbrica 5.3).
        var where = new System.Text.StringBuilder(" WHERE c.UsuarioId = @usuarioId");
        if (!string.IsNullOrWhiteSpace(tipo))
            where.Append(" AND m.Tipo = @tipo");
        if (!string.IsNullOrWhiteSpace(texto))
            where.Append(" AND (m.Descripcion LIKE @texto OR cat.Nombre LIKE @texto)");
        var whereSql = where.ToString();

        // Consulta de la página: OFFSET/FETCH es el paginado nativo de SQL Server.
        var itemsSql = SelectBase + whereSql +
            " ORDER BY m.Fecha DESC, m.MovimientoId DESC" +
            " OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;";

        // Consulta del total (mismos filtros, sin paginar) para calcular páginas.
        var countSql = @"SELECT COUNT(*)
                         FROM Movimiento m
                         INNER JOIN Categoria cat ON cat.CategoriaId = m.CategoriaId
                         INNER JOIN CuentaBilletera c ON c.CuentaBilleteraId = m.CuentaBilleteraId"
                         + whereSql + ";";

        using var conn = new SqlConnection(connectionString);
        await conn.OpenAsync();

        // 1) Total de coincidencias
        int total;
        using (var countCmd = new SqlCommand(countSql, conn))
        {
            AgregarParametrosFiltro(countCmd, usuarioId, tipo, texto);
            total = (int)(await countCmd.ExecuteScalarAsync())!;
        }

        // 2) Filas de la página pedida
        var lista = new List<Movimiento>();
        using (var cmd = new SqlCommand(itemsSql, conn))
        {
            AgregarParametrosFiltro(cmd, usuarioId, tipo, texto);
            cmd.Parameters.AddWithValue("@offset", (pageNumber - 1) * pageSize);
            cmd.Parameters.AddWithValue("@pageSize", pageSize);
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
                lista.Add(Map(reader));
        }

        return (lista, total);
    }

    /// Carga los parámetros comunes de filtro en un SqlCommand. El texto va con
    /// comodines %...% para el LIKE. Se llama tanto en el COUNT como en el SELECT.
    private static void AgregarParametrosFiltro(SqlCommand cmd, int usuarioId, string? tipo, string? texto)
    {
        cmd.Parameters.AddWithValue("@usuarioId", usuarioId);
        if (!string.IsNullOrWhiteSpace(tipo))
            cmd.Parameters.AddWithValue("@tipo", tipo);
        if (!string.IsNullOrWhiteSpace(texto))
            cmd.Parameters.AddWithValue("@texto", $"%{texto}%");
    }

    // Mapea la fila del reader a Movimiento, con navegaciones parciales del JOIN.
    private static Movimiento Map(SqlDataReader reader) => new()
    {
        MovimientoId = reader.GetInt32(reader.GetOrdinal("MovimientoId")),
        CuentaBilleteraId = reader.GetInt32(reader.GetOrdinal("CuentaBilleteraId")),
        CategoriaId = reader.GetInt32(reader.GetOrdinal("CategoriaId")),
        Fecha = reader.GetDateTime(reader.GetOrdinal("Fecha")),
        Descripcion = reader.IsDBNull(reader.GetOrdinal("Descripcion")) ? null : reader.GetString(reader.GetOrdinal("Descripcion")),
        Monto = reader.GetDecimal(reader.GetOrdinal("Monto")),
        Tipo = reader.GetString(reader.GetOrdinal("Tipo")),
        // Navegaciones parcialmente cargadas vía JOIN.
        Categoria = new Categoria { Nombre = reader.GetString(reader.GetOrdinal("CategoriaNombre")) },
        CuentaBilletera = new CuentaBilletera { Alias = reader.IsDBNull(reader.GetOrdinal("CuentaAlias")) ? null : reader.GetString(reader.GetOrdinal("CuentaAlias")) }
    };
}
