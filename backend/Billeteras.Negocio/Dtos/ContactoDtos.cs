using System.ComponentModel.DataAnnotations;

namespace Billeteras.Negocio.Dtos;

/// DTO de salida de un contacto de la agenda del usuario.
public class ContactoDto
{
    public int UsuarioPropietarioId { get; set; }
    public int UsuarioContactoId { get; set; }
    public string? AliasPersonalizado { get; set; }
    public DateTime FechaAgregado { get; set; }
}

/// DTO de entrada para agregar un contacto a la agenda del usuario autenticado.
public class CreateContactoDto
{
    // Opcional en el request porque el controlador lo sobreescribe con el ID del JWT por seguridad.
    public int UsuarioPropietarioId { get; set; }

    [Required]
    public int UsuarioContactoId { get; set; }

    [MaxLength(100)]
    public string? AliasPersonalizado { get; set; }
}