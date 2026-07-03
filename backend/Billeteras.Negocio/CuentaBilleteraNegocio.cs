using Billeteras.Datos.Interfaces;
using Billeteras.Entidades;
using Billeteras.Negocio.Dtos;
using Billeteras.Negocio.Interfaces;

namespace Billeteras.Negocio;

public class CuentaBilleteraNegocio(ICuentaBilleteraRepository repo) : ICuentaBilleteraNegocio
{
    public async Task<List<CuentaBilleteraResponse>> ObtenerTodosAsync()
        => (await repo.ObtenerTodosAsync()).Select(Map).ToList();

    public async Task<CuentaBilleteraResponse?> ObtenerPorIdAsync(int id)
    {
        var cuenta = await repo.ObtenerPorIdAsync(id);
        return cuenta is null ? null : Map(cuenta);
    }

    public async Task<CuentaBilleteraResponse> CrearAsync(int usuarioId, CrearCuentaBilleteraRequest req)
    {
        var cuenta = new CuentaBilletera
        {
            UsuarioId = usuarioId,
            BilleteraId = req.BilleteraId,
            Alias = req.Alias,
            SaldoActual = req.SaldoInicial
        };
        cuenta.CuentaBilleteraId = await repo.InsertarAsync(cuenta);
        return Map(cuenta);
    }

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

    public Task<bool> EliminarAsync(int id) => repo.EliminarAsync(id);

    public async Task<List<CuentaBilleteraResponse>> ObtenerActivasDeUsuarioAsync(int usuarioId)
    {
        var todas = await repo.ObtenerTodosAsync();
        return todas
            .Where(c => c.UsuarioId == usuarioId && c.Estado == "Activa")
            .Select(Map)
            .ToList();
    }

    public async Task<CuentaBilleteraResponse> VincularAsync(int usuarioId, VincularBilleteraRequest req)
    {
        var cuenta = await repo.VincularAsync(usuarioId, req.BilleteraId, req.Alias);
        return Map(cuenta);
    }

    public async Task<CuentaBilleteraResponse> DesvincularAsync(int cuentaId, int usuarioId)
    {
        var cuenta = await repo.DesvincularAsync(cuentaId, usuarioId);
        return Map(cuenta);
    }

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