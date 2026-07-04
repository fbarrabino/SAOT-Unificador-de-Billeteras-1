using System.ComponentModel.DataAnnotations;
using Billeteras.Negocio.Dtos;

namespace Billeteras.Apps.WebApiApp.Dtos;

/// Cuerpo de POST /api/auth/register.
// NOTA: en .NET 10 los atributos de validación en records con constructor primario
// deben ir SIN "property:" para que el sistema de model binding los detecte.
public record RegisterRequest(
    [Required, MaxLength(100)] string Nombre,
    [Required, MaxLength(100)] string Apellido,
    [Required, EmailAddress, MaxLength(200)] string Email,
    [Required, MinLength(6), MaxLength(100)] string Password);

/// Cuerpo de POST /api/auth/login.
/// DispositivoNombre es opcional: lo manda el FE (ej. "iPhone · App") para
/// identificar la sesión en "Dispositivos conectados" (D7).
public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password,
    string? DispositivoNombre = null);

public record LoginResponse(string Token, DateTime ExpiresAt, UsuarioResponse Usuario);

/// Cuerpo de POST /api/auth/forgot-password.
public record ForgotPasswordRequest([Required, EmailAddress] string Email);

/// Cuerpo de POST /api/auth/reset-password.
public record ResetPasswordRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(6), MaxLength(6)] string Codigo,
    [Required, MinLength(6), MaxLength(100)] string NuevaPassword);

/// Cuerpo de POST /api/auth/verify-email.
public record VerifyEmailRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(6), MaxLength(6)] string Codigo);

/// Cuerpo de POST /api/auth/change-password.
public record ChangePasswordRequest(
    [Required] string PasswordActual,
    [Required, MinLength(6), MaxLength(100)] string PasswordNueva);
