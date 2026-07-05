namespace Billeteras.Negocio.Dtos;

/// DTO de salida de un método de pago externo (solo expone los últimos 4 dígitos).
public class MetodoPagoExternoDto
{
    public int MetodoId { get; set; }
    public int UsuarioId { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string UltimosCuatro { get; set; } = string.Empty;
    public string EntidadEmisora { get; set; } = string.Empty;
}

/// DTO de entrada para registrar un método de pago externo del usuario.
public class CreateMetodoPagoExternoDto
{
    public int UsuarioId { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string UltimosCuatro { get; set; } = string.Empty;
    public string EntidadEmisora { get; set; } = string.Empty;
}