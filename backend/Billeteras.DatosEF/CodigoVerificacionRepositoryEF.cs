using Microsoft.EntityFrameworkCore;
using Billeteras.Entidades;
using Billeteras.Datos.Interfaces;

namespace Billeteras.DatosEF;

/// Implementación EF Core del repositorio de CodigoVerificacion (reset de pass / verificación de email).
public class CodigoVerificacionRepositoryEF(BilleterasContext context) : ICodigoVerificacionRepository
{
    // Inserta un código de verificación nuevo y lo devuelve.
    public async Task<CodigoVerificacion> InsertarAsync(CodigoVerificacion codigo)
    {
        context.CodigosVerificacion.Add(codigo);
        await context.SaveChangesAsync();
        return codigo;
    }

    // Último código emitido para ese usuario/tipo (para el throttle de reenvío).
    public async Task<CodigoVerificacion?> ObtenerUltimoAsync(int usuarioId, string tipo)
        => await context.CodigosVerificacion
            .Where(c => c.UsuarioId == usuarioId && c.Tipo == tipo)
            .OrderByDescending(c => c.FechaCreacion)
            .FirstOrDefaultAsync();

    // Código vigente: coincide, no usado y no vencido. Null si no hay match.
    public async Task<CodigoVerificacion?> ObtenerVigenteAsync(int usuarioId, string codigo, string tipo)
        => await context.CodigosVerificacion
            .Where(c => c.UsuarioId == usuarioId
                     && c.Codigo == codigo
                     && c.Tipo == tipo
                     && !c.Usado
                     && c.ExpiraEn > DateTime.Now)
            .OrderByDescending(c => c.FechaCreacion)
            .FirstOrDefaultAsync();

    // Marca el código como usado para que no pueda volver a canjearse.
    public async Task MarcarUsadoAsync(int codigoId)
    {
        var codigo = await context.CodigosVerificacion.FindAsync(codigoId);
        if (codigo != null)
        {
            codigo.Usado = true;
            await context.SaveChangesAsync();
        }
    }
}
