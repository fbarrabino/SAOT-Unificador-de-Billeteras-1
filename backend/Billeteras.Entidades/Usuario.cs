using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Billeteras.Entidades;

/// Usuario del sistema (el dueño de las cuentas de billetera).
[Table("Usuario")]
public class Usuario
{
    [Key]
    public int UsuarioId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Apellido { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string PasswordHash { get; set; } = string.Empty;

    // Default GETDATE() a nivel DB (ver db/init.sql y BilleterasContext).
    public DateTime FechaAlta { get; set; }

    /// A8 — false al registrarse; pasa a true al validar el código de verificación de email.
    public bool EmailVerificado { get; set; } = false;

    /// D1+D3 — Perfil persistido (B7).
    [MaxLength(60)]
    public string? Pais { get; set; }

    [MaxLength(30)]
    public string? Telefono { get; set; }
}