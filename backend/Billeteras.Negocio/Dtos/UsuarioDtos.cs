using System.ComponentModel.DataAnnotations;

namespace Billeteras.Negocio.Dtos;

/// Datos para registrar un usuario (lo consume la capa de Negocio desde auth/register).
public record RegistrarUsuarioRequest(
    [Required, MaxLength(100)] string Nombre,
    [Required, MaxLength(100)] string Apellido,
    [Required, EmailAddress, MaxLength(200)] string Email,
    [Required, MinLength(6), MaxLength(100)] string Password);

/// Datos para actualizar un usuario vía CRUD (no incluye contraseña en este TP).
/// D1+D3: Pais y Telefono son opcionales (el perfil puede quedar incompleto).
public record UsuarioUpdateRequest(
    [Required, MaxLength(100)] string Nombre,
    [Required, MaxLength(100)] string Apellido,
    [Required, EmailAddress, MaxLength(200)] string Email,
    [MaxLength(60)] string? Pais,
    [MaxLength(30)] string? Telefono);

/// Representación de salida de un usuario (nunca expone el PasswordHash).
public record UsuarioResponse(
    int UsuarioId,
    string Nombre,
    string Apellido,
    string Email,
    DateTime FechaAlta,
    bool EmailVerificado,
    string? Pais,
    string? Telefono);