using Billeteras.Datos.Interfaces;
using Billeteras.Entidades;
using Billeteras.Negocio.Dtos;
using Billeteras.Negocio.Interfaces;

namespace Billeteras.Negocio;

/// Lógica de negocio de CuentaBilletera: CRUD, filtrado de cuentas activas del
/// usuario y las operaciones de vincular/desvincular (delegadas al repositorio EF).
public class CuentaBilleteraNegocio(ICuentaBilleteraRepository repo) : ICuentaBilleteraNegocio
{
    // Trae todas las cuentas y las mapea a DTO de respuesta.
    public async Task<List<CuentaBilleteraResponse>> ObtenerTodosAsync()
        => (await repo.ObtenerTodosAsync()).Select(Map).ToList();

    // Busca una cuenta por Id y la mapea a DTO (null si no existe).
    public async Task<CuentaBilleteraResponse?> ObtenerPorIdAsync(int id)
    {
        var cuenta = await repo.ObtenerPorIdAsync(id);
        return cuenta is null ? null : Map(cuenta);
    }

    // Crea una cuenta para el usuario con saldo inicial y estado "Activa".
    public async Task<CuentaBilleteraResponse> CrearAsync(int usuarioId, CrearCuentaBilleteraRequest req)
    {
        var cuenta = new CuentaBilletera
        {
            UsuarioId = usuarioId,
            BilleteraId = req.BilleteraId,
            Alias = req.Alias,
            SaldoActual = req.SaldoInicial,
            // IMPORTANTE: EF está configurado con ValueGeneratedNever() para
            // FechaVinculacion, así que TENEMOS que darle un valor. Sin esto queda
            // en DateTime.MinValue (0001-01-01) → error "datetime2 fuera de rango".
            FechaVinculacion = DateTime.Now,
            Estado = "Activa"   // así aparece en /me (que filtra por Estado == "Activa")
        };
        cuenta.CuentaBilleteraId = await repo.InsertarAsync(cuenta);
        return Map(cuenta);
    }

    // Actualiza los datos de una cuenta existente; null si el Id no existe.
    public async Task<CuentaBilleteraResponse?> ActualizarAsync(int id, CuentaBilleteraRequest req)
    {
        var cuenta = await repo.ObtenerPorIdAsync(id);
        if (cuenta is null)
            return null;

        cuenta.UsuarioId = req.UsuarioId;
        cuenta.BilleteraId = req.BilleteraId;
        cuenta.Alias = req.Alias;
        cuenta.SaldoActual = req.SaldoActual;

        await repo.ActualizarAsync(cuenta);
        return Map(cuenta);
    }

    // Elimina la cuenta por Id (delega directo al repositorio).
    public Task<bool> EliminarAsync(int id) => repo.EliminarAsync(id);

    // Devuelve solo las cuentas Activas del usuario (las que se muestran en /me).
    public async Task<List<CuentaBilleteraResponse>> ObtenerActivasDeUsuarioAsync(int usuarioId)
    {
        var todas = await repo.ObtenerTodosAsync();
        return todas
            .Where(c => c.UsuarioId == usuarioId && c.Estado == "Activa")
            .Select(Map)
            .ToList();
    }

    // Vincula una billetera al usuario (validaciones transaccionales en el repo).
    public async Task<CuentaBilleteraResponse> VincularAsync(int usuarioId, VincularBilleteraRequest req)
    {
        var cuenta = await repo.VincularAsync(usuarioId, req.BilleteraId, req.Alias);
        return Map(cuenta);
    }

    // Desvincula (soft-delete) la cuenta validando dueño y estado en el repo.
    public async Task<CuentaBilleteraResponse> DesvincularAsync(int cuentaId, int usuarioId)
    {
        var cuenta = await repo.DesvincularAsync(cuentaId, usuarioId);
        return Map(cuenta);
    }

    // Convierte la entidad CuentaBilletera a su DTO (arma nombre de billetera/usuario).
    private static CuentaBilleteraResponse Map(CuentaBilletera c)
        => new(
            c.CuentaBilleteraId,
            c.UsuarioId,
            c.BilleteraId,
            c.Alias,
            c.SaldoActual,
            c.FechaVinculacion,
            c.Billetera?.Nombre,
            c.Usuario is null ? null : $"{c.Usuario.Nombre} {c.Usuario.Apellido}".Trim(),
            c.Estado);
}
