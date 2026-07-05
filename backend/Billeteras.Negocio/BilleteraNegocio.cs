using Billeteras.Datos.Interfaces;
using Billeteras.Entidades;
using Billeteras.Negocio.Dtos;
using Billeteras.Negocio.Interfaces;

namespace Billeteras.Negocio;

/// Lógica de negocio del catálogo de Billeteras: orquesta el repositorio y
/// convierte entre entidades (DB) y DTOs (API).
public class BilleteraNegocio(IBilleteraRepository repo) : IBilleteraNegocio
{
    // Trae todas las billeteras y las mapea a DTO de respuesta.
    public async Task<List<BilleteraResponse>> ObtenerTodosAsync()
        => (await repo.ObtenerTodosAsync()).Select(Map).ToList();

    // Busca una billetera por Id y la mapea a DTO (null si no existe).
    public async Task<BilleteraResponse?> ObtenerPorIdAsync(int id)
    {
        var billetera = await repo.ObtenerPorIdAsync(id);
        return billetera is null ? null : Map(billetera);
    }

    // Crea una billetera a partir del request y devuelve su DTO con el Id nuevo.
    public async Task<BilleteraResponse> CrearAsync(BilleteraRequest req)
    {
        var billetera = new Billetera { Nombre = req.Nombre, LogoUrl = req.LogoUrl };
        billetera.BilleteraId = await repo.InsertarAsync(billetera);
        return Map(billetera);
    }

    // Actualiza una billetera existente; devuelve null si el Id no existe.
    public async Task<BilleteraResponse?> ActualizarAsync(int id, BilleteraRequest req)
    {
        var billetera = await repo.ObtenerPorIdAsync(id);
        if (billetera is null)
            return null;

        billetera.Nombre = req.Nombre;
        billetera.LogoUrl = req.LogoUrl;

        await repo.ActualizarAsync(billetera);
        return Map(billetera);
    }

    // Elimina la billetera por Id (delega directo al repositorio).
    public Task<bool> EliminarAsync(int id) => repo.EliminarAsync(id);

    // Convierte la entidad Billetera a su DTO de respuesta.
    private static BilleteraResponse Map(Billetera b)
        => new(b.BilleteraId, b.Nombre, b.LogoUrl);
}
