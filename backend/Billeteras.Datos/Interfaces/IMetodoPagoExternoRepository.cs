using Billeteras.Entidades;

namespace Billeteras.Datos.Interfaces;

/// Contrato del repositorio de Métodos de Pago externos (tarjetas del usuario).
public interface IMetodoPagoExternoRepository
{
    Task<IEnumerable<MetodoPagoExterno>> GetAllAsync();                       // Lista todos los métodos de pago.
    Task<MetodoPagoExterno?> GetByIdAsync(int id);                            // Busca un método de pago por Id.
    Task<IEnumerable<MetodoPagoExterno>> GetByUsuarioIdAsync(int usuarioId);  // Métodos de pago de un usuario.
    Task<MetodoPagoExterno> AddAsync(MetodoPagoExterno metodo);               // Agrega un método de pago y lo devuelve.
    Task DeleteAsync(int id);                                                 // Elimina un método de pago por Id.
}