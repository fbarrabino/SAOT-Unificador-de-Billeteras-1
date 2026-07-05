using System.ComponentModel.DataAnnotations;

namespace Billeteras.Negocio.Dtos;

/// Datos de entrada para crear/actualizar un movimiento (Tipo: "Ingreso"/"Egreso").
public record MovimientoRequest(
    [Range(1, int.MaxValue)] int CuentaBilleteraId,
    [Range(1, int.MaxValue)] int CategoriaId,
    DateTime Fecha,
    [MaxLength(250)] string? Descripcion,
    decimal Monto,
    [Required, MaxLength(10)] string Tipo);

/// Datos de salida de un movimiento, con nombre de categoría y alias de cuenta.
public record MovimientoResponse(
    int MovimientoId,
    int CuentaBilleteraId,
    int CategoriaId,
    DateTime Fecha,
    string? Descripcion,
    decimal Monto,
    string Tipo,
    string? CategoriaNombre,
    string? CuentaAlias);
