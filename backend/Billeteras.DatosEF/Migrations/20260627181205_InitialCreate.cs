using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Billeteras.DatosEF.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Billetera",
                columns: table => new
                {
                    BilleteraId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    LogoUrl = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Billetera", x => x.BilleteraId);
                });

            migrationBuilder.CreateTable(
                name: "Categoria",
                columns: table => new
                {
                    CategoriaId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Tipo = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categoria", x => x.CategoriaId);
                });

            migrationBuilder.CreateTable(
                name: "Comercio",
                columns: table => new
                {
                    ComercioId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RazonSocial = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Cuit = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Comercio", x => x.ComercioId);
                });

            migrationBuilder.CreateTable(
                name: "ComercioBilletera",
                columns: table => new
                {
                    ComercioId = table.Column<int>(type: "int", nullable: false),
                    BilleteraId = table.Column<int>(type: "int", nullable: false),
                    TasaComision = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComercioBilletera", x => new { x.ComercioId, x.BilleteraId });
                });

            migrationBuilder.CreateTable(
                name: "Contacto",
                columns: table => new
                {
                    UsuarioPropietarioId = table.Column<int>(type: "int", nullable: false),
                    UsuarioContactoId = table.Column<int>(type: "int", nullable: false),
                    AliasPersonalizado = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    FechaAgregado = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Contacto", x => new { x.UsuarioPropietarioId, x.UsuarioContactoId });
                });

            migrationBuilder.CreateTable(
                name: "MetodoPagoExterno",
                columns: table => new
                {
                    MetodoId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    Tipo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    UltimosCuatro = table.Column<string>(type: "nvarchar(4)", maxLength: 4, nullable: false),
                    EntidadEmisora = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MetodoPagoExterno", x => x.MetodoId);
                });

            migrationBuilder.CreateTable(
                name: "MotivoReporte",
                columns: table => new
                {
                    MotivoId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Titulo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Gravedad = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MotivoReporte", x => x.MotivoId);
                });

            migrationBuilder.CreateTable(
                name: "Notificacion",
                columns: table => new
                {
                    NotificacionId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    Titulo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Mensaje = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Leida = table.Column<bool>(type: "bit", nullable: false),
                    FechaEmision = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notificacion", x => x.NotificacionId);
                });

            migrationBuilder.CreateTable(
                name: "Rol",
                columns: table => new
                {
                    RolId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Rol", x => x.RolId);
                });

            migrationBuilder.CreateTable(
                name: "Sucursal",
                columns: table => new
                {
                    SucursalId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ComercioId = table.Column<int>(type: "int", nullable: false),
                    Direccion = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    CodigoQRBase = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Sucursal", x => x.SucursalId);
                });

            migrationBuilder.CreateTable(
                name: "Usuario",
                columns: table => new
                {
                    UsuarioId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Apellido = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    FechaAlta = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuario", x => x.UsuarioId);
                });

            migrationBuilder.CreateTable(
                name: "UsuarioRol",
                columns: table => new
                {
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    RolId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsuarioRol", x => new { x.UsuarioId, x.RolId });
                });

            migrationBuilder.CreateTable(
                name: "CuentaBilletera",
                columns: table => new
                {
                    CuentaBilleteraId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    BilleteraId = table.Column<int>(type: "int", nullable: false),
                    Alias = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SaldoActual = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    FechaVinculacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CuentaBilletera", x => x.CuentaBilleteraId);
                    table.ForeignKey(
                        name: "FK_CuentaBilletera_Billetera_BilleteraId",
                        column: x => x.BilleteraId,
                        principalTable: "Billetera",
                        principalColumn: "BilleteraId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CuentaBilletera_Usuario_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuario",
                        principalColumn: "UsuarioId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SolicitudCobro",
                columns: table => new
                {
                    SolicitudId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioSolicitanteId = table.Column<int>(type: "int", nullable: false),
                    MontoTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    FechaVencimiento = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SolicitudCobro", x => x.SolicitudId);
                    table.ForeignKey(
                        name: "FK_SolicitudCobro_Usuario_UsuarioSolicitanteId",
                        column: x => x.UsuarioSolicitanteId,
                        principalTable: "Usuario",
                        principalColumn: "UsuarioId");
                });

            migrationBuilder.CreateTable(
                name: "TicketSoporte",
                columns: table => new
                {
                    TicketId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    MotivoId = table.Column<int>(type: "int", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketSoporte", x => x.TicketId);
                    table.ForeignKey(
                        name: "FK_TicketSoporte_MotivoReporte_MotivoId",
                        column: x => x.MotivoId,
                        principalTable: "MotivoReporte",
                        principalColumn: "MotivoId");
                    table.ForeignKey(
                        name: "FK_TicketSoporte_Usuario_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuario",
                        principalColumn: "UsuarioId");
                });

            migrationBuilder.CreateTable(
                name: "Movimiento",
                columns: table => new
                {
                    MovimientoId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CuentaBilleteraId = table.Column<int>(type: "int", nullable: false),
                    CategoriaId = table.Column<int>(type: "int", nullable: false),
                    Fecha = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    Monto = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Tipo = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    MetadataExtranjera = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Anulado = table.Column<bool>(type: "bit", nullable: false),
                    FechaAnulacion = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Movimiento", x => x.MovimientoId);
                    table.ForeignKey(
                        name: "FK_Movimiento_Categoria_CategoriaId",
                        column: x => x.CategoriaId,
                        principalTable: "Categoria",
                        principalColumn: "CategoriaId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Movimiento_CuentaBilletera_CuentaBilleteraId",
                        column: x => x.CuentaBilleteraId,
                        principalTable: "CuentaBilletera",
                        principalColumn: "CuentaBilleteraId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TicketMensaje",
                columns: table => new
                {
                    MensajeId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TicketId = table.Column<int>(type: "int", nullable: false),
                    RemitenteEsSoporte = table.Column<bool>(type: "bit", nullable: false),
                    CuerpoMensaje = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FechaEnvio = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketMensaje", x => x.MensajeId);
                    table.ForeignKey(
                        name: "FK_TicketMensaje_TicketSoporte_TicketId",
                        column: x => x.TicketId,
                        principalTable: "TicketSoporte",
                        principalColumn: "TicketId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SolicitudCobroDetalle",
                columns: table => new
                {
                    DetalleSolicitudId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SolicitudId = table.Column<int>(type: "int", nullable: false),
                    UsuarioDeudorId = table.Column<int>(type: "int", nullable: false),
                    MontoMita = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Pagado = table.Column<bool>(type: "bit", nullable: false),
                    Concepto = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    MovimientoId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SolicitudCobroDetalle", x => x.DetalleSolicitudId);
                    table.ForeignKey(
                        name: "FK_SolicitudCobroDetalle_Movimiento_MovimientoId",
                        column: x => x.MovimientoId,
                        principalTable: "Movimiento",
                        principalColumn: "MovimientoId");
                    table.ForeignKey(
                        name: "FK_SolicitudCobroDetalle_SolicitudCobro_SolicitudId",
                        column: x => x.SolicitudId,
                        principalTable: "SolicitudCobro",
                        principalColumn: "SolicitudId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SolicitudCobroDetalle_Usuario_UsuarioDeudorId",
                        column: x => x.UsuarioDeudorId,
                        principalTable: "Usuario",
                        principalColumn: "UsuarioId");
                });

            migrationBuilder.CreateTable(
                name: "TicketAdjunto",
                columns: table => new
                {
                    AdjuntoId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MensajeId = table.Column<int>(type: "int", nullable: false),
                    UrlArchivo = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    TipoMime = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketAdjunto", x => x.AdjuntoId);
                    table.ForeignKey(
                        name: "FK_TicketAdjunto_TicketMensaje_MensajeId",
                        column: x => x.MensajeId,
                        principalTable: "TicketMensaje",
                        principalColumn: "MensajeId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CuentaBilletera_BilleteraId",
                table: "CuentaBilletera",
                column: "BilleteraId");

            migrationBuilder.CreateIndex(
                name: "IX_CuentaBilletera_UsuarioId",
                table: "CuentaBilletera",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Movimiento_CategoriaId",
                table: "Movimiento",
                column: "CategoriaId");

            migrationBuilder.CreateIndex(
                name: "IX_Movimiento_CuentaBilleteraId",
                table: "Movimiento",
                column: "CuentaBilleteraId");

            migrationBuilder.CreateIndex(
                name: "IX_SolicitudCobro_UsuarioSolicitanteId",
                table: "SolicitudCobro",
                column: "UsuarioSolicitanteId");

            migrationBuilder.CreateIndex(
                name: "IX_SolicitudCobroDetalle_MovimientoId",
                table: "SolicitudCobroDetalle",
                column: "MovimientoId");

            migrationBuilder.CreateIndex(
                name: "IX_SolicitudCobroDetalle_SolicitudId",
                table: "SolicitudCobroDetalle",
                column: "SolicitudId");

            migrationBuilder.CreateIndex(
                name: "IX_SolicitudCobroDetalle_UsuarioDeudorId",
                table: "SolicitudCobroDetalle",
                column: "UsuarioDeudorId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketAdjunto_MensajeId",
                table: "TicketAdjunto",
                column: "MensajeId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketMensaje_TicketId",
                table: "TicketMensaje",
                column: "TicketId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketSoporte_MotivoId",
                table: "TicketSoporte",
                column: "MotivoId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketSoporte_UsuarioId",
                table: "TicketSoporte",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Usuario_Email",
                table: "Usuario",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Comercio");

            migrationBuilder.DropTable(
                name: "ComercioBilletera");

            migrationBuilder.DropTable(
                name: "Contacto");

            migrationBuilder.DropTable(
                name: "MetodoPagoExterno");

            migrationBuilder.DropTable(
                name: "Notificacion");

            migrationBuilder.DropTable(
                name: "Rol");

            migrationBuilder.DropTable(
                name: "SolicitudCobroDetalle");

            migrationBuilder.DropTable(
                name: "Sucursal");

            migrationBuilder.DropTable(
                name: "TicketAdjunto");

            migrationBuilder.DropTable(
                name: "UsuarioRol");

            migrationBuilder.DropTable(
                name: "Movimiento");

            migrationBuilder.DropTable(
                name: "SolicitudCobro");

            migrationBuilder.DropTable(
                name: "TicketMensaje");

            migrationBuilder.DropTable(
                name: "Categoria");

            migrationBuilder.DropTable(
                name: "CuentaBilletera");

            migrationBuilder.DropTable(
                name: "TicketSoporte");

            migrationBuilder.DropTable(
                name: "Billetera");

            migrationBuilder.DropTable(
                name: "MotivoReporte");

            migrationBuilder.DropTable(
                name: "Usuario");
        }
    }
}
