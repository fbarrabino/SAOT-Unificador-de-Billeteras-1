using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Billeteras.Entidades;

/// Código de 6 dígitos para flujos de verificación (reset de contraseña,
/// verificación de email al registrarse, etc). El campo Tipo distingue el flujo.
[Table("CodigoVerificacion")]
public class CodigoVerificacion
{
    [Key]
    public int CodigoId { get; set; }
    public int UsuarioId { get; set; }

    [Required]
    [MaxLength(6)]
    public string Codigo { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string Tipo { get; set; } = string.Empty;

    public DateTime ExpiraEn { get; set; }
    public bool Usado { get; set; } = false;
    public DateTime FechaCreacion { get; set; } = DateTime.Now;

    [ForeignKey(nameof(UsuarioId))]
    public Usuario? Usuario { get; set; }
}
