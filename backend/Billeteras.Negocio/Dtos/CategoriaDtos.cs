using System.ComponentModel.DataAnnotations;

namespace Billeteras.Negocio.Dtos;

/// Datos de entrada para crear/actualizar una categoría (Tipo: "Ingreso"/"Egreso").
public record CategoriaRequest(
    [property: Required, MaxLength(80)] string Nombre,
    [property: Required, MaxLength(20)] string Tipo);

/// Datos de salida de una categoría (lo que devuelve la API).
public record CategoriaResponse(
    int CategoriaId,
    string Nombre,
    string Tipo);