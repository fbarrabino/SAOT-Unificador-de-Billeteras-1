using Billeteras.Negocio.Interfaces;
using Microsoft.Extensions.Configuration;
using Neo4j.Driver;

namespace Billeteras.Negocio;

/// Implementación del INeo4jService. Lee Uri/User/Password desde la sección
/// "Neo4j" de IConfiguration y mantiene un IDriver compartido (thread-safe).
public class Neo4jService : INeo4jService, IAsyncDisposable
{
    private readonly IDriver _driver;

    // Lee la config de Neo4j y crea el driver compartido (una sola vez, como Singleton).
    public Neo4jService(IConfiguration config)
    {
        var s = config.GetSection("Neo4j");
        var uri = s["Uri"] ?? throw new InvalidOperationException("Falta Neo4j:Uri en appsettings.");
        var user = s["User"] ?? throw new InvalidOperationException("Falta Neo4j:User en appsettings.");
        var pwd = s["Password"] ?? throw new InvalidOperationException("Falta Neo4j:Password en appsettings.");

        _driver = GraphDatabase.Driver(uri, AuthTokens.Basic(user, pwd));
    }

    // Auto-commit: sirve para datos y también para los CREATE CONSTRAINT
    // (los comandos de esquema no pueden ir dentro de una transacción manejada).
    public async Task ExecuteAsync(string cypher, object? parameters = null)
    {
        await using var session = _driver.AsyncSession();
        var cursor = await session.RunAsync(cypher, parameters ?? new { });
        await cursor.ConsumeAsync();
    }

    // Ejecuta un Cypher de lectura y devuelve todos los registros como lista.
    public async Task<List<IRecord>> QueryAsync(string cypher, object? parameters = null)
    {
        await using var session = _driver.AsyncSession();
        var cursor = await session.RunAsync(cypher, parameters ?? new { });
        return await cursor.ToListAsync();
    }

    public async ValueTask DisposeAsync() => await _driver.DisposeAsync();
}
