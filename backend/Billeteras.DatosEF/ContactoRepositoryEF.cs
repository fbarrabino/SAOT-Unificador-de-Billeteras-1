using Microsoft.EntityFrameworkCore;
using Billeteras.Entidades;
using Billeteras.Datos.Interfaces;

namespace Billeteras.DatosEF;

/// Implementación EF Core del repositorio de Contactos (agenda del usuario).
public class ContactoRepositoryEF(BilleterasContext context) : IContactoRepository
{
    // Devuelve los contactos guardados por un usuario propietario.
    public async Task<IEnumerable<Contacto>> GetContactosDeUsuarioAsync(int usuarioPropietarioId)
        => await context.Contactos
            .Where(c => c.UsuarioPropietarioId == usuarioPropietarioId)
            .ToListAsync();

    // Agrega un contacto a la agenda y lo devuelve.
    public async Task<Contacto> AddAsync(Contacto contacto)
    {
        context.Contactos.Add(contacto);
        await context.SaveChangesAsync();
        return contacto;
    }

    // Elimina el vínculo de contacto (clave compuesta propietario+contacto) si existe.
    public async Task DeleteAsync(int usuarioPropietarioId, int usuarioContactoId)
    {
        var contacto = await context.Contactos.FindAsync(usuarioPropietarioId, usuarioContactoId);
        if (contacto != null)
        {
            context.Contactos.Remove(contacto);
            await context.SaveChangesAsync();
        }
    }
}
