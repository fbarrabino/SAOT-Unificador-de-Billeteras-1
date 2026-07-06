using System.ComponentModel.DataAnnotations;

namespace Billeteras.Negocio.Dtos;

/// Datos para registrar un usuario (lo consume la capa de Negocio desde auth/register).
public record RegistrarUsuarioRequest(
    [Required, MaxLength(100)] string Nombre,
    [Required, MaxLength(100)] string Apellido,
    [Required, EmailAddress, MaxLength(200)] string Email,
    [Required, MinLength(6), MaxLength(100)] string Password,
    [MaxLength(30)] string? Telefono = null);

/// Datos para actualizar un usuario vía CRUD (no incluye contraseña en este TP).
/// D1+D3: Pais y Telefono son opcionales (el perfil puede quedar incompleto).
public record UsuarioUpdateRequest(
    [Required, MaxLength(100)] string Nombre,
    [Required, MaxLength(100)] string Apellido,
    [Required, EmailAddress, MaxLength(200)] string Email,
    [MaxLength(60)] string? Pais,
    [MaxLength(30)] string? Telefono);

/// D4 — Body del POST /api/usuarios/me/foto. Acepta base64 puro o con prefijo
/// data URI ("data:image/jpeg;base64,...."): el controller limpia el prefijo.
public record SubirFotoRequest(
    [Required] string ImagenBase64);

/// Representación de salida de un usuario (nunca expone el PasswordHash).
public record UsuarioResponse(
    int UsuarioId,
    string Nombre,
    string Apellido,
    string Email,
    DateTime FechaAlta,
    bool EmailVerificado,
    string? Pais,
    string? Telefono,
    string? FotoPerfilUrl);