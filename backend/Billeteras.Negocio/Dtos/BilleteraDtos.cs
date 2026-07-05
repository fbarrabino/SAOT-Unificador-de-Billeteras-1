using System.ComponentModel.DataAnnotations;

namespace Billeteras.Negocio.Dtos;

/// Datos de entrada para crear/actualizar una billetera del catálogo.
public record BilleteraRequest(
    [property: Required, MaxLength(100)] string Nombre,
    [property: MaxLength(300)] string? LogoUrl);

/// Datos de salida de una billetera (lo que devuelve la API).
public record BilleteraResponse(
    int BilleteraId,
    string Nombre,
    string? LogoUrl);