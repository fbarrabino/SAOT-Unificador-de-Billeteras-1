using System.ComponentModel.DataAnnotations;

namespace Billeteras.Negocio.Dtos;

public class ContactoDto
{
    public int UsuarioPropietarioId { get; set; }
    public int UsuarioContactoId { get; set; }
    public string? AliasPersonalizado { get; set; }
    public DateTime FechaAgregado { get; set; }
}

public class CreateContactoDto
{
    // Opcional en el request porque el controlador lo sobreescribe con el ID del JWT por seguridad.
    public int UsuarioPropietarioId { get; set; }

    [Required]
    public int UsuarioContactoId { get; set; }

    [MaxLength(100)]
    public string? AliasPersonalizado { get; set; }
}