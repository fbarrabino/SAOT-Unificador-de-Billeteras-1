using Microsoft.EntityFrameworkCore;
using Billeteras.Entidades;
using Billeteras.Datos.Interfaces;

namespace Billeteras.DatosEF;

/// Implementación EF Core del repositorio de Métodos de Pago externos (tarjetas del usuario).
public class MetodoPagoExternoRepositoryEF(BilleterasContext context) : IMetodoPagoExternoRepository
{
    // Trae todos los métodos de pago registrados.
    public async Task<IEnumerable<MetodoPagoExterno>> GetAllAsync()
        => await context.MetodosPagoExternos.ToListAsync();

    // Busca un método de pago por su Id (null si no existe).
    public async Task<MetodoPagoExterno?> GetByIdAsync(int id)
        => await context.MetodosPagoExternos.FindAsync(id);

    // Devuelve los métodos de pago de un usuario concreto.
    public async Task<IEnumerable<MetodoPagoExterno>> GetByUsuarioIdAsync(int usuarioId)
        => await context.MetodosPagoExternos.Where(m => m.UsuarioId == usuarioId).ToListAsync();

    // Agrega un método de pago y lo devuelve con su Id generado.
    public async Task<MetodoPagoExterno> AddAsync(MetodoPagoExterno metodo)
    {
        context.MetodosPagoExternos.Add(metodo);
        await context.SaveChangesAsync();
        return metodo;
    }

    // Elimina un método de pago por Id si existe.
    public async Task DeleteAsync(int id)
    {
        var metodo = await context.MetodosPagoExternos.FindAsync(id);
        if (metodo != null)
        {
            context.MetodosPagoExternos.Remove(metodo);
            await context.SaveChangesAsync();
        }
    }
}
