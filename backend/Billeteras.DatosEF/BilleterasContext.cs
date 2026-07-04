using Microsoft.EntityFrameworkCore;
using Billeteras.Entidades;

namespace Billeteras.DatosEF;

/// DbContext de EF Core. La DB la crea el script db/init.sql (no usamos Migrations),
/// así que acá solo configuramos lo que EF necesita conocer para leer/escribir bien.
public class BilleterasContext(DbContextOptions<BilleterasContext> options) : DbContext(options)
{
    // Entidades Base (TP-04)
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Billetera> Billeteras => Set<Billetera>();
    public DbSet<CuentaBilletera> CuentasBilletera => Set<CuentaBilletera>();
    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Movimiento> Movimientos => Set<Movimiento>();

    // ==========================================
    // ENTIDADES EXTENDIDAS (BE-01)
    public DbSet<Rol> Roles => Set<Rol>();
    public DbSet<UsuarioRol> UsuariosRoles => Set<UsuarioRol>();
    public DbSet<Contacto> Contactos => Set<Contacto>();
    public DbSet<Comercio> Comercios => Set<Comercio>();
    public DbSet<Sucursal> Sucursales => Set<Sucursal>();
    public DbSet<ComercioBilletera> ComerciosBilleteras => Set<ComercioBilletera>();
    public DbSet<SolicitudCobro> SolicitudesCobro => Set<SolicitudCobro>();
    public DbSet<SolicitudCobroDetalle> SolicitudesCobroDetalles => Set<SolicitudCobroDetalle>();
    public DbSet<MotivoReporte> MotivosReporte => Set<MotivoReporte>();
    public DbSet<TicketSoporte> TicketsSoporte => Set<TicketSoporte>();
    public DbSet<TicketMensaje> TicketsMensajes => Set<TicketMensaje>();
    public DbSet<TicketAdjunto> TicketsAdjuntos => Set<TicketAdjunto>();
    public DbSet<Notificacion> Notificaciones => Set<Notificacion>();
    public DbSet<MetodoPagoExterno> MetodosPagoExternos => Set<MetodoPagoExterno>();
    public DbSet<CodigoVerificacion> CodigosVerificacion => Set<CodigoVerificacion>();
    public DbSet<UsuarioSesion> UsuariosSesiones => Set<UsuarioSesion>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Configuración Base
        modelBuilder.Entity<Usuario>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            // El default GETDATE() lo pone la DB; EF no manda valor en el INSERT.
            e.Property(u => u.FechaAlta)
                .HasDefaultValueSql("GETDATE()")
                .ValueGeneratedOnAdd();
        });

        modelBuilder.Entity<CuentaBilletera>(e =>
        {
            // El trigger trg_Auditar_CuentasBilletera bloquea OUTPUT INSERTED incluso
            // para leer el PK IDENTITY. UseSqlOutputClause(false) → EF usa SCOPE_IDENTITY()
            // en lugar de OUTPUT, lo que funciona correctamente con triggers.
            e.ToTable("CuentaBilletera", t => t.UseSqlOutputClause(false));

            // FechaVinculacion: se setea desde C# (DateTime.UtcNow), no se deja a la DB.
            e.Property(c => c.FechaVinculacion)
                .ValueGeneratedNever();
        });

        modelBuilder.Entity<Movimiento>(e =>
        {
            // MISMO CASO que CuentaBilletera: el trigger trg_Auditar_Movimientos hace
            // que SQL Server rechace el INSERT si EF usa "OUTPUT INSERTED" para leer el
            // PK IDENTITY (error 334). UseSqlOutputClause(false) → EF usa SCOPE_IDENTITY(),
            // que sí convive con triggers. Sin esto fallan enviar / cambiar / pagar-qr / anular.
            e.ToTable("Movimiento", t => t.UseSqlOutputClause(false));
        });

        // ==========================================
        // CONFIGURACIÓN DE CLAVES COMPUESTAS (BE-01)
        // EF Core requiere configurar las PK compuestas (relaciones N-N) por Fluent API
        modelBuilder.Entity<UsuarioRol>()
            .HasKey(ur => new { ur.UsuarioId, ur.RolId });

        modelBuilder.Entity<Contacto>()
            .HasKey(c => new { c.UsuarioPropietarioId, c.UsuarioContactoId });

        modelBuilder.Entity<ComercioBilletera>()
            .HasKey(cb => new { cb.ComercioId, cb.BilleteraId });

        // ── SolicitudCobro / Maestro-Detalle (BE-06) ──────────────────────────────
        // IMPORTANTE: FechaCreacion NO se marca como DB-generated.
        // Si lo fuera, EF Core usaría MERGE (en vez de INSERT) para recuperar el valor
        // generado por la DB, y SQL Server tiene un bug conocido donde MERGE puede
        // fallar con FK constraints aunque los datos sean válidos.
        // El valor lo seteamos desde C# (DateTime.UtcNow) → INSERT simple, sin problemas.
        modelBuilder.Entity<SolicitudCobro>(e =>
        {
            e.Property(s => s.FechaCreacion)
                .ValueGeneratedNever();  // EF usa el valor de C#, nunca le pide a la DB
        });

        // FK cabecera → Usuario solicitante (NoAction evita "multiple cascade paths")
        modelBuilder.Entity<SolicitudCobro>()
            .HasOne(s => s.UsuarioSolicitante)
            .WithMany()
            .HasForeignKey(s => s.UsuarioSolicitanteId)
            .OnDelete(DeleteBehavior.NoAction);

        // FK línea → cabecera (Cascade: si se borra la solicitud se borran sus líneas)
        modelBuilder.Entity<SolicitudCobroDetalle>()
            .HasOne(d => d.Solicitud)
            .WithMany(s => s.Lineas)
            .HasForeignKey(d => d.SolicitudId)
            .OnDelete(DeleteBehavior.Cascade);

        // FK línea → Usuario deudor (NoAction para no crear ciclo de cascade)
        modelBuilder.Entity<SolicitudCobroDetalle>()
            .HasOne(d => d.UsuarioDeudor)
            .WithMany()
            .HasForeignKey(d => d.UsuarioDeudorId)
            .OnDelete(DeleteBehavior.NoAction);

        // FK línea → Movimiento generado al pagar (NoAction)
        modelBuilder.Entity<SolicitudCobroDetalle>()
            .HasOne(d => d.Movimiento)
            .WithMany()
            .HasForeignKey(d => d.MovimientoId)
            .OnDelete(DeleteBehavior.NoAction);

        // ── TicketSoporte / Maestro-Detalle (BE-07) ───────────────────────────────
        // Ticket → Usuario (NoAction: evita ciclo cascade con Usuario)
        modelBuilder.Entity<TicketSoporte>()
            .HasOne(t => t.Usuario)
            .WithMany()
            .HasForeignKey(t => t.UsuarioId)
            .OnDelete(DeleteBehavior.NoAction);

        // Ticket → MotivoReporte (NoAction)
        modelBuilder.Entity<TicketSoporte>()
            .HasOne(t => t.Motivo)
            .WithMany()
            .HasForeignKey(t => t.MotivoId)
            .OnDelete(DeleteBehavior.NoAction);

        // Mensaje → Ticket (Cascade: al borrar ticket se borran sus mensajes)
        modelBuilder.Entity<TicketMensaje>()
            .HasOne(m => m.Ticket)
            .WithMany(t => t.Mensajes)
            .HasForeignKey(m => m.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        // Adjunto → Mensaje (Cascade: al borrar mensaje se borran sus adjuntos)
        modelBuilder.Entity<TicketAdjunto>()
            .HasOne(a => a.Mensaje)
            .WithMany(m => m.Adjuntos)
            .HasForeignKey(a => a.MensajeId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── CodigoVerificacion (A3/A4/A8) ─────────────────────────────────────────
        // Código → Usuario (NoAction: evita ciclo cascade con Usuario)
        modelBuilder.Entity<CodigoVerificacion>()
            .HasOne(c => c.Usuario)
            .WithMany()
            .HasForeignKey(c => c.UsuarioId)
            .OnDelete(DeleteBehavior.NoAction);

        // ── UsuarioSesion (D7) ─────────────────────────────────────────────────
        // Sesión → Usuario (NoAction: evita ciclo cascade con Usuario)
        modelBuilder.Entity<UsuarioSesion>()
            .HasOne(s => s.Usuario)
            .WithMany()
            .HasForeignKey(s => s.UsuarioId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}