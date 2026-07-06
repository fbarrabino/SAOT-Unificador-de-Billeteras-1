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

/// DTO de entrada: emails de la agenda del teléfono a cruzar con usuarios registrados.
/// Solo se usan para buscar coincidencias; el backend NO los persiste (privacidad).
public class MatchContactosRequest
{
    public List<string> Emails { get; set; } = new();

    // Teléfonos de la agenda (opcional). Se cruzan contra Usuario.Telefono
    // normalizando a solo dígitos.
    public List<string> Telefonos { get; set; } = new();
}

/// DTO de salida: un contacto de la agenda que YA es usuario de la app
/// (listo para agregarlo como contacto con su UsuarioId).
public class MatchContactoDto
{
    public int UsuarioId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}