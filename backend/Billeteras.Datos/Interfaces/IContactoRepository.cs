using Billeteras.Entidades;

namespace Billeteras.Datos.Interfaces;

/// Contrato del repositorio de Contactos (agenda de cada usuario).
public interface IContactoRepository
{
    // Devuelve todos los contactos guardados por un usuario propietario.
    Task<IEnumerable<Contacto>> GetContactosDeUsuarioAsync(int usuarioPropietarioId);
    // Agrega un contacto a la agenda y lo devuelve.
    Task<Contacto> AddAsync(Contacto contacto);
    // Elimina el vínculo de contacto entre propietario y contacto.
    Task DeleteAsync(int usuarioPropietarioId, int usuarioContactoId);
}