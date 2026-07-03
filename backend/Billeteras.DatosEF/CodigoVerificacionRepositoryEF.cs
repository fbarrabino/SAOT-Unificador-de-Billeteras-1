using Microsoft.EntityFrameworkCore;
using Billeteras.Entidades;
using Billeteras.Datos.Interfaces;

namespace Billeteras.DatosEF;

public class CodigoVerificacionRepositoryEF(BilleterasContext context) : ICodigoVerificacionRepository
{
    public async Task<CodigoVerificacion> InsertarAsync(CodigoVerificacion codigo)
    {
        context.CodigosVerificacion.Add(codigo);
        await context.SaveChangesAsync();
        return codigo;
    }

    public async Task<CodigoVerificacion?> ObtenerUltimoAsync(int usuarioId, string tipo)
        => await context.CodigosVerificacion
            .Where(c => c.UsuarioId == usuarioId && c.Tipo == tipo)
            .OrderByDescending(c => c.FechaCreacion)
            .FirstOrDefaultAsync();

    public async Task<CodigoVerificacion?> ObtenerVigenteAsync(int usuarioId, string codigo, string tipo)
        => await context.CodigosVerificacion
            .Where(c => c.UsuarioId == usuarioId
                     && c.Codigo == codigo
                     && c.Tipo == tipo
                     && !c.Usado
                     && c.ExpiraEn > DateTime.Now)
            .OrderByDescending(c => c.FechaCreacion)
            .FirstOrDefaultAsync();

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
