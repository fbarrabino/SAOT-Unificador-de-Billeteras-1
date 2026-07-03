using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Billeteras.Entidades;

/// Una fila por login exitoso — permite listar "dispositivos conectados" y
/// revocar sesiones individuales (D7).
[Table("UsuarioSesion")]
public class UsuarioSesion
{
    [Key]
    public int SesionId { get; set; }
    public int UsuarioId { get; set; }

    [MaxLength(150)]
    public string? DispositivoNombre { get; set; }

    [MaxLength(45)]
    public string? IpUltimoLogin { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.Now;
    public DateTime UltimaActividad { get; set; } = DateTime.Now;

    /// Jti (JWT ID) del token emitido en este login — permite revocar la sesión
    /// específica que ese token representa.
    [Required]
    [MaxLength(100)]
    public string JwtJti { get; set; } = string.Empty;

    public bool Activa { get; set; } = true;

    [ForeignKey(nameof(UsuarioId))]
    public Usuario? Usuario { get; set; }
}
