using Billeteras.Entidades;

namespace Billeteras.Datos.Interfaces;

/// Contrato del repositorio del catálogo de Categorías (CRUD básico).
public interface ICategoriaRepository
{
    Task<List<Categoria>> ObtenerTodosAsync();          // Lista todas las categorías.
    Task<Categoria?> ObtenerPorIdAsync(int id);          // Busca una categoría por Id (null si no existe).
    Task<int> InsertarAsync(Categoria entidad);          // Inserta una categoría y devuelve el Id generado.
    Task<bool> ActualizarAsync(Categoria entidad);       // Actualiza una categoría; true si modificó filas.
    Task<bool> EliminarAsync(int id);                    // Elimina la categoría por Id; true si borró.
}