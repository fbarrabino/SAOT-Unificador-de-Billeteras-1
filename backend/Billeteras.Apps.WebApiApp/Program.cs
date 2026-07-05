using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
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
// Envío real de los códigos por email (SMTP / MailKit). Config en sección "Email".
builder.Services.AddScoped<IEmailSender, EmailSender>();

// --- Sesiones / dispositivos conectados (D7) ---
builder.Services.AddScoped<IUsuarioSesionRepository, UsuarioSesionRepositoryEF>();
builder.Services.AddScoped<ISesionNegocio, SesionNegocio>();

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

        // D7: si la sesión de este token fue revocada ("Cerrar" en Dispositivos
        // conectados), el token deja de ser válido aunque su firma/expiración
        // sigan siendo correctas.
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var jti = context.Principal?.FindFirstValue(JwtRegisteredClaimNames.Jti);
                if (jti is null) return;

                var repo = context.HttpContext.RequestServices.GetRequiredService<IUsuarioSesionRepository>();
                var sesion = await repo.ObtenerPorJtiAsync(jti);
                if (sesion is not null && !sesion.Activa)
                    context.Fail("La sesión fue cerrada.");
            }
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllersWithViews();

// ─── Swagger / OpenAPI (rúbrica 6.3 — documentación de la API) ────────────────
// Genera la doc interactiva en /swagger. Con AddSecurityDefinition sumamos el
// botón "Authorize" para pegar el JWT y probar los endpoints protegidos.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Billeteras API — Unificador de Billeteras (SaOT)",
        Version = "v1",
        Description = "API REST del TP Integrador de Programación III (UTN FRRe). "
                    + "Para probar endpoints protegidos: hacé login en /api/auth/login, "
                    + "copiá el token y pegalo en el botón Authorize."
    });

    // Definición del esquema Bearer (Microsoft.OpenApi 2.x → sin Reference inline).
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Pegá SOLO el token JWT (sin escribir 'Bearer ' adelante)."
    });

    // En Swashbuckle 10 el requirement se arma con una función que recibe el
    // documento; la referencia al esquema se hace con OpenApiSecuritySchemeReference.
    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        { new OpenApiSecuritySchemeReference("Bearer", document, null), new List<string>() }
    });
});

// ─── CORS restrictivo (rúbrica 5.3 / OWASP) ──────────────────────────────────
// En vez de abrir a "*", permitimos SOLO los orígenes declarados en appsettings
// ("Cors:AllowedOrigins"). Si no hay ninguno configurado, caemos a los orígenes
// típicos de desarrollo (Expo web / Metro). La app móvil nativa no usa CORS, así
// que no se ve afectada por esta restricción.
var origenesPermitidos = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>();

if (origenesPermitidos is null || origenesPermitidos.Length == 0)
{
    origenesPermitidos = new[]
    {
        "http://localhost:8081",   // Expo web / Metro
        "http://localhost:19006",  // Expo web (legacy)
        "http://localhost:3000"    // dev genérico
    };
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("Restrictiva", policy =>
        policy.WithOrigins(origenesPermitidos)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
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

// Swagger UI disponible en /swagger (lo dejamos siempre activo para la demo/corrección).
app.UseSwagger();
app.UseSwaggerUI(o =>
{
    o.SwaggerEndpoint("/swagger/v1/swagger.json", "Billeteras API v1");
    o.DocumentTitle = "Billeteras API — Swagger";
});

// ─── Security headers (rúbrica 5.3 / OWASP) ──────────────────────────────────
// Cabeceras defensivas en TODAS las respuestas: evitan MIME sniffing, embebido
// en iframes (clickjacking) y fuga de la URL por Referer.
app.Use(async (context, next) =>
{
    var headers = context.Response.Headers;
    headers["X-Content-Type-Options"] = "nosniff";
    headers["X-Frame-Options"] = "DENY";
    headers["Referrer-Policy"] = "no-referrer";
    await next();
});

// HSTS: fuerza HTTPS en el navegador (solo fuera de Development, donde el cert
// autofirmado y http local complicarían la demo).
if (!app.Environment.IsDevelopment())
    app.UseHsts();

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors("Restrictiva");
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