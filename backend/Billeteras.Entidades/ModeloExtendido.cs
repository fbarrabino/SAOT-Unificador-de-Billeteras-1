using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Billeteras.Entidades
{
    // ==========================================
    // MÓDULO DE SEGURIDAD Y ROLES
    // ==========================================
    [Table("Rol")]
    public class Rol
    {
        [Key]
        public int RolId { get; set; }
        [Required]
        [MaxLength(50)]
        public string Nombre { get; set; } = string.Empty;
        [MaxLength(255)]
        public string? Descripcion { get; set; } // Nullable
    }

    [Table("UsuarioRol")]
    public class UsuarioRol
    {
        [Key, Column(Order = 0)]
        public int UsuarioId { get; set; }
        [Key, Column(Order = 1)]
        public int RolId { get; set; }
    }

    // ==========================================
    // MÓDULO DE RED Y CONTACTOS
    // ==========================================
    [Table("Contacto")]
    public class Contacto
    {
        [Key, Column(Order = 0)]
        public int UsuarioPropietarioId { get; set; }
        [Key, Column(Order = 1)]
        public int UsuarioContactoId { get; set; }
        [MaxLength(50)]
        public string? AliasPersonalizado { get; set; } // Nullable
        public DateTime FechaAgregado { get; set; } = DateTime.Now;
    }

    // ==========================================
    // MÓDULO DE COMERCIOS Y SUCURSALES
    // ==========================================
    [Table("Comercio")]
    public class Comercio
    {
        [Key]
        public int ComercioId { get; set; }
        [Required]
        [MaxLength(100)]
        public string RazonSocial { get; set; } = string.Empty;
        [Required]
        [MaxLength(20)]
        public string Cuit { get; set; } = string.Empty;
    }

    [Table("Sucursal")]
    public class Sucursal
    {
        [Key]
        public int SucursalId { get; set; }
        public int ComercioId { get; set; }
        [Required]
        [MaxLength(200)]
        public string Direccion { get; set; } = string.Empty;
        [Required]
        [MaxLength(255)]
        public string CodigoQRBase { get; set; } = string.Empty;
    }

    [Table("ComercioBilletera")]
    public class ComercioBilletera
    {
        [Key, Column(Order = 0)]
        public int ComercioId { get; set; }
        [Key, Column(Order = 1)]
        public int BilleteraId { get; set; }
        public decimal TasaComision { get; set; }
    }

    // ==========================================
    // MÓDULO DE SOLICITUDES DE PAGO/COBRO
    // ==========================================
    [Table("SolicitudCobro")]
    public class SolicitudCobro
    {
        [Key]
        public int SolicitudId { get; set; }

        [Required]
        public int UsuarioSolicitanteId { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal MontoTotal { get; set; }

        public DateTime FechaVencimiento { get; set; }

        [MaxLength(20)]
        public string Estado { get; set; } = "Pendiente";

        // Campos agregados para la tarea Maestro-Detalle
        [MaxLength(250)]
        public string? Descripcion { get; set; }

        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        // Navegación: líneas del detalle
        [ForeignKey(nameof(UsuarioSolicitanteId))]
        public Usuario? UsuarioSolicitante { get; set; }

        public ICollection<SolicitudCobroDetalle> Lineas { get; set; } = [];
    }

    [Table("SolicitudCobroDetalle")]
    public class SolicitudCobroDetalle
    {
        [Key]
        public int DetalleSolicitudId { get; set; }

        public int SolicitudId { get; set; }

        public int UsuarioDeudorId { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal MontoMita { get; set; }

        public bool Pagado { get; set; } = false;

        // Campos agregados para la tarea Maestro-Detalle
        [MaxLength(250)]
        public string? Concepto { get; set; }

        /// FK al Movimiento generado cuando esta línea es pagada (null mientras Pagado=false).
        public int? MovimientoId { get; set; }

        // Navegaciones
        [ForeignKey(nameof(SolicitudId))]
        public SolicitudCobro? Solicitud { get; set; }

        [ForeignKey(nameof(UsuarioDeudorId))]
        public Usuario? UsuarioDeudor { get; set; }

        [ForeignKey(nameof(MovimientoId))]
        public Movimiento? Movimiento { get; set; }
    }

    // ==========================================
    // MÓDULO DE SOPORTE TÉCNICO
    // ==========================================
    [Table("MotivoReporte")]
    public class MotivoReporte
    {
        [Key]
        public int MotivoId { get; set; }
        [Required]
        [MaxLength(100)]
        public string Titulo { get; set; } = string.Empty;
        public int Gravedad { get; set; } = 1;
    }

    [Table("TicketSoporte")]
    public class TicketSoporte
    {
        [Key]
        public int TicketId { get; set; }
        public int UsuarioId { get; set; }
        public int MotivoId { get; set; }
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
        [MaxLength(20)]
        public string Estado { get; set; } = "Abierto";

        // Navegación
        [ForeignKey(nameof(UsuarioId))]
        public Usuario? Usuario { get; set; }
        [ForeignKey(nameof(MotivoId))]
        public MotivoReporte? Motivo { get; set; }
        public ICollection<TicketMensaje> Mensajes { get; set; } = [];
    }

    [Table("TicketMensaje")]
    public class TicketMensaje
    {
        [Key]
        public int MensajeId { get; set; }
        public int TicketId { get; set; }
        public bool RemitenteEsSoporte { get; set; } = false;
        [Required]
        public string CuerpoMensaje { get; set; } = string.Empty;
        public DateTime FechaEnvio { get; set; } = DateTime.Now;

        // Navegación
        [ForeignKey(nameof(TicketId))]
        public TicketSoporte? Ticket { get; set; }
        public ICollection<TicketAdjunto> Adjuntos { get; set; } = [];
    }

    [Table("TicketAdjunto")]
    public class TicketAdjunto
    {
        [Key]
        public int AdjuntoId { get; set; }
        public int MensajeId { get; set; }
        [Required]
        [Column(TypeName = "varchar(max)")]
        public string UrlArchivo { get; set; } = string.Empty;
        [Required]
        [MaxLength(50)]
        public string TipoMime { get; set; } = string.Empty;

        // Navegación
        [ForeignKey(nameof(MensajeId))]
        public TicketMensaje? Mensaje { get; set; }
    }

    // ==========================================
    // MÓDULO DE NOTIFICACIONES Y MÉTODOS DE PAGO
    // ==========================================
    [Table("Notificacion")]
    public class Notificacion
    {
        [Key]
        public int NotificacionId { get; set; }
        public int UsuarioId { get; set; }
        [Required]
        [MaxLength(100)]
        public string Titulo { get; set; } = string.Empty;
        [Required]
        [MaxLength(255)]
        public string Mensaje { get; set; } = string.Empty;
        public bool Leida { get; set; } = false;
        public DateTime FechaEmision { get; set; } = DateTime.Now;
    }

    [Table("MetodoPagoExterno")]
    public class MetodoPagoExterno
    {
        [Key]
        public int MetodoId { get; set; }
        public int UsuarioId { get; set; }
        [Required]
        [MaxLength(50)]
        public string Tipo { get; set; } = string.Empty;
        [Required]
        [MaxLength(4)]
        public string UltimosCuatro { get; set; } = string.Empty;
        [Required]
        [MaxLength(100)]
        public string EntidadEmisora { get; set; } = string.Empty;
    }
}