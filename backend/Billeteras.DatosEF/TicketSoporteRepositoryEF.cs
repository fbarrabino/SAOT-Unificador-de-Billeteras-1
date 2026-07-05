using Microsoft.EntityFrameworkCore;
using Billeteras.Entidades;
using Billeteras.Datos.Interfaces;

namespace Billeteras.DatosEF;

/// Implementación EF Core del repositorio de TicketSoporte (maestro-detalle, BE-07).
public class TicketSoporteRepositoryEF(BilleterasContext context) : ITicketSoporteRepository
{
    // Trae todos los tickets de soporte.
    public async Task<IEnumerable<TicketSoporte>> GetAllAsync()
        => await context.TicketsSoporte.ToListAsync();

    // Busca un ticket por su Id (null si no existe).
    public async Task<TicketSoporte?> GetByIdAsync(int id)
        => await context.TicketsSoporte.FindAsync(id);

    // Devuelve los tickets abiertos por un usuario.
    public async Task<IEnumerable<TicketSoporte>> GetByUsuarioIdAsync(int usuarioId)
        => await context.TicketsSoporte.Where(t => t.UsuarioId == usuarioId).ToListAsync();

    // Agrega un ticket simple (sin mensajes) y lo devuelve.
    public async Task<TicketSoporte> AddAsync(TicketSoporte ticket)
    {
        context.TicketsSoporte.Add(ticket);
        await context.SaveChangesAsync();
        return ticket;
    }

    // Cambia el estado del ticket (ej. "Abierto" → "Cerrado") si existe.
    public async Task UpdateEstadoAsync(int id, string nuevoEstado)
    {
        var ticket = await context.TicketsSoporte.FindAsync(id);
        if (ticket != null)
        {
            ticket.Estado = nuevoEstado;
            await context.SaveChangesAsync();
        }
    }

    // ── Maestro-Detalle (BE-07) ───────────────────────────────────────────────

    /// <summary>
    /// Transacción: INSERT TicketSoporte → INSERT TicketMensaje → INSERT[] TicketAdjunto → COMMIT.
    /// Si cualquier paso falla se hace ROLLBACK completo (atomicidad garantizada).
    /// </summary>
    public async Task<int> CrearConMensajeYAdjuntosAsync(
        TicketSoporte ticket,
        TicketMensaje mensaje,
        List<TicketAdjunto> adjuntos)
    {
        await using var transaction = await context.Database.BeginTransactionAsync();
        try
        {
            // 1) Cabecera: EF genera el TicketId por IDENTITY
            context.TicketsSoporte.Add(ticket);
            await context.SaveChangesAsync();

            // 2) Primer mensaje: asignamos el TicketId recién generado
            mensaje.TicketId = ticket.TicketId;
            context.TicketsMensajes.Add(mensaje);
            await context.SaveChangesAsync();

            // 3) Adjuntos del mensaje: asignamos el MensajeId recién generado
            if (adjuntos.Count > 0)
            {
                foreach (var adj in adjuntos)
                    adj.MensajeId = mensaje.MensajeId;
                context.TicketsAdjuntos.AddRange(adjuntos);
                await context.SaveChangesAsync();
            }

            await transaction.CommitAsync();
            return ticket.TicketId;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// Devuelve el ticket con mensajes y adjuntos cargados (eager loading de 2 niveles).
    /// </summary>
    public async Task<TicketSoporte?> ObtenerConMensajesAsync(int ticketId)
        => await context.TicketsSoporte
            .Include(t => t.Motivo)
            .Include(t => t.Mensajes)
                .ThenInclude(m => m.Adjuntos)
            .FirstOrDefaultAsync(t => t.TicketId == ticketId);
}
