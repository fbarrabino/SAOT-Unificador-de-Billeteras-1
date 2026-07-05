using Microsoft.EntityFrameworkCore;
using Billeteras.Datos.Interfaces;
using Billeteras.Entidades;

namespace Billeteras.DatosEF;

/// Implementación EF Core del repositorio de Usuario.
public class UsuarioRepositoryEF(BilleterasContext ctx) : IUsuarioRepository
{
    // Trae todos los usuarios.
    public async Task<List<Usuario>> ObtenerTodosAsync()
        => await ctx.Usuarios.ToListAsync();

    // Busca un usuario por su clave primaria (null si no existe).
    public async Task<Usuario?> ObtenerPorIdAsync(int id)
        => await ctx.Usuarios.FindAsync(id);

    // Busca un usuario por email (clave del login); null si no existe.
    public async Task<Usuario?> ObtenerPorEmailAsync(string email)
        => await ctx.Usuarios.FirstOrDefaultAsync(u => u.Email == email);

    // Inserta un usuario nuevo y devuelve el Id generado.
    public async Task<int> InsertarAsync(Usuario entidad)
    {
        ctx.Usuarios.Add(entidad);
        await ctx.SaveChangesAsync();
        return entidad.UsuarioId;
    }

    // Actualiza un usuario; true si se guardó algún cambio.
    public async Task<bool> ActualizarAsync(Usuario entidad)
    {
        ctx.Usuarios.Update(entidad);
        return await ctx.SaveChangesAsync() > 0;
    }

    // Elimina el usuario por Id; false si no existía.
    public async Task<bool> EliminarAsync(int id)
    {
        var entidad = await ctx.Usuarios.FindAsync(id);
        if (entidad is null) return false;
        ctx.Usuarios.Remove(entidad);
        return await ctx.SaveChangesAsync() > 0;
    }

    // Devuelve los nombres de rol del usuario (join UsuarioRol → Rol).
    public Task<List<string>> ObtenerNombresRolesAsync(int usuarioId)
        => (from ur in ctx.UsuariosRoles
            join r in ctx.Roles on ur.RolId equals r.RolId
            where ur.UsuarioId == usuarioId
            select r.Nombre).ToListAsync();
}
