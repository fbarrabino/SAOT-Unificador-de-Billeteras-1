using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Billeteras.Datos;
using Billeteras.Datos.Interfaces;
using Billeteras.DatosEF;
using Billeteras.Negocio;
using Billeteras.Negocio.Interfaces;
// Maestro-Detalle (usings requeridos para los tipos concretos del módulo)
// Los tipos están en los ensamblados ya referenciados; este using es solo por claridad.

var builder = WebApplication.CreateBuilder(args);

// Connection string (appsettings.json → IConfiguration)
var connStr = builder.Configuration.GetConnectionString("BilleterasDB")
    ?? throw new InvalidOperationException("Falta la connection string 'BilleterasDB' en appsettings.json.");

// DbContext (EF Core / SQL Server)
builder.Services.AddDbContext<BilleterasContext>(opt => opt.UseSqlServer(connStr));

// Repositorios: por DEFECTO EF Core.
builder.Services.AddScoped<IUsuarioRepository, UsuarioRepositoryEF>();
builder.Services.AddScoped<IBilleteraRepository, BilleteraRepositoryEF>();
builder.Services.AddScoped<ICategoriaRepository, CategoriaRepositoryEF>();
builder.Services.AddScoped<ICuentaBilleteraRepository, CuentaBilleteraRepositoryEF>();
builder.Services.AddScoped<IMovimientoRepository, MovimientoRepositoryEF>();

// --- NUESTROS REPOSITORIOS (BE-02) ---
builder.Services.AddScoped<IMetodoPagoExternoRepository, MetodoPagoExternoRepositoryEF>();
builder.Services.AddScoped<ITicketSoporteRepository, TicketSoporteRepositoryEF>();

// --- MAESTRO-DETALLE: Tickets de Soporte (BE-07) ---
builder.Services.AddScoped<ITicketSoporteNegocio, TicketSoporteNegocio>();

// --- MAESTRO-DETALLE: Solicitudes de Cobro ---
builder.Services.AddScoped<ISolicitudCobroRepository, SolicitudCobroRepositoryEF>();
builder.Services.AddScoped<ISolicitudCobroNegocio, SolicitudCobroNegocio>();
// --- OPERACIONES TRANSACCIONALES (BE-03/04/05) ---
builder.Services.AddScoped<IOperacionesRepository, OperacionesRepositoryEF>();
builder.Services.AddScoped<IOperacionesNegocio, OperacionesNegocio>();

// --- NEO4J (BD-04) ---
// El IDriver del paquete es thread-safe → singleton para reusar el pool de
// conexiones entre requests. La instancia se crea desde el config "Neo4j".
builder.Services.AddSingleton<INeo4jService, Neo4jService>();

// Servicios de Negocio
builder.Services.AddScoped<IUsuarioNegocio, UsuarioNegocio>();
builder.Services.AddScoped<IBilleteraNegocio, BilleteraNegocio>();
builder.Services.AddScoped<ICategoriaNegocio, CategoriaNegocio>();
builder.Services.AddScoped<ICuentaBilleteraNegocio, CuentaBilleteraNegocio>();
builder.Services.AddScoped<IMovimientoNegocio, MovimientoNegocio>();
builder.Services.AddScoped<IContactoRepository, ContactoRepositoryEF>();

// --- Códigos de verificación: reset de contraseña / verificación de email (A3/A4/A8) ---
builder.Services.AddScoped<ICodigoVerificacionRepository, CodigoVerificacionRepositoryEF>();
builder.Services.AddScoped<IVerificacionNegocio, VerificacionNegocio>();

// Autenticación JWT (Key, Issuer, Audience, ExpiresInMinutes desde appsettings.json)
var jwt = builder.Configuration.GetSection("Jwt");
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            IssuerSigningKey = signingKey
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllersWithViews();

// CORS abierto (política "AllowAll")
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

// ─── Neo4j: constraints de unicidad (BD-04) ──────────────────────────────────
// Se ejecutan una sola vez al arrancar; los IF NOT EXISTS los hacen idempotentes.
// Si Neo4j no está corriendo (o falla el login), logueamos y seguimos: la API
// queda usable contra SQL aunque el grafo no esté disponible.
try
{
    await using var scope = app.Services.CreateAsyncScope();
    var neo4j = scope.ServiceProvider.GetRequiredService<INeo4jService>();
    await neo4j.ExecuteAsync("CREATE CONSTRAINT usuario_id   IF NOT EXISTS FOR (u:Usuario)         REQUIRE u.usuarioId         IS UNIQUE");
    await neo4j.ExecuteAsync("CREATE CONSTRAINT billetera_id IF NOT EXISTS FOR (b:Billetera)       REQUIRE b.billeteraId       IS UNIQUE");
    await neo4j.ExecuteAsync("CREATE CONSTRAINT cuenta_id    IF NOT EXISTS FOR (c:CuentaBilletera) REQUIRE c.cuentaBilleteraId IS UNIQUE");
    await neo4j.ExecuteAsync("CREATE CONSTRAINT comercio_id  IF NOT EXISTS FOR (co:Comercio)       REQUIRE co.comercioId       IS UNIQUE");
    Console.WriteLine("[Neo4j] Constraints aplicados correctamente.");
}
catch (Exception ex)
{
    Console.Error.WriteLine($"[Neo4j] No se pudieron aplicar los constraints — la API seguirá funcionando sin el grafo. Detalle: {ex.Message}");
}

// Pipeline
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

// Mapeo de controladores API (attribute routing — [Route], [HttpGet], etc.)
// IMPORTANTE: sin esta línea ningún endpoint /api/* responde.
app.MapControllers();

// Ruta MVC convencional para las vistas Razor existentes (CuentaBilletera/Index, etc.)
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=CuentaBilletera}/{action=Index}/{id?}");

app.Run();