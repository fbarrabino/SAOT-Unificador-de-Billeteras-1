using System.ComponentModel.DataAnnotations;

namespace Billeteras.Negocio.Dtos;

public record CuentaBilleteraRequest(
    [Range(1, int.MaxValue)] int UsuarioId,
    [Range(1, int.MaxValue)] int BilleteraId,
    [MaxLength(100)] string? Alias,
    decimal SaldoActual);

public record CrearCuentaBilleteraRequest(
    [Range(1, int.MaxValue)] int BilleteraId,
    [MaxLength(100)] string? Alias,
    decimal SaldoInicial);

public record CuentaBilleteraResponse(
    int CuentaBilleteraId,
    int UsuarioId,
    int BilleteraId,
    string? Alias,
    decimal SaldoActual,
    DateTime FechaVinculacion,
    string? BilleteraNombre,
    string? UsuarioNombre,
    string Estado);

/// <summary>Request para vincular una billetera al usuario autenticado (UsuarioId viene del JWT).</summary>
public record VincularBilleteraRequest(
    [Range(1, int.MaxValue)] int BilleteraId,
    [MaxLength(100)] string? Alias);