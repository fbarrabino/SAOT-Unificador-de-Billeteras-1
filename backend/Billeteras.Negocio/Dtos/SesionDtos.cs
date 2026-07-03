namespace Billeteras.Negocio.Dtos;

/// Fila de la lista de "dispositivos conectados" (D7).
public record SesionResponse(
    int SesionId,
    string? DispositivoNombre,
    string? IpUltimoLogin,
    DateTime FechaCreacion,
    DateTime UltimaActividad,
    bool EsSesionActual);
