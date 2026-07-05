using Billeteras.Entidades;

namespace Billeteras.Datos.Interfaces;

/// Contrato del repositorio del catálogo de Billeteras (CRUD básico).
public interface IBilleteraRepository
{
    Task<List<Billetera>> ObtenerTodosAsync();          // Lista todas las billeteras del catálogo.
    Task<Billetera?> ObtenerPorIdAsync(int id);          // Busca una billetera por Id (null si no existe).
    Task<int> InsertarAsync(Billetera entidad);          // Inserta una billetera y devuelve el Id generado.
    Task<bool> ActualizarAsync(Billetera entidad);       // Actualiza una billetera; true si modificó filas.
    Task<bool> EliminarAsync(int id);                    // Elimina la billetera por Id; true si borró.
}