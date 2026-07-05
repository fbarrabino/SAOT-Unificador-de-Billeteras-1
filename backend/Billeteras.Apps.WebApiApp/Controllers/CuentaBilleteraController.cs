using Microsoft.AspNetCore.Mvc;
using Billeteras.Datos.Interfaces;
using Billeteras.Entidades;

namespace Billeteras.Apps.WebApiApp.Controllers;

/// Controlador MVC (vistas Razor, NO API REST) del TP-02/TP-04. Muestra cuentas y
/// movimientos y permite alternar entre datos SIMULADOS (mock en memoria) y la
/// base real (?source=db). Es la parte que usa el repositorio ADO en el módulo de vista.
public class CuentaBilleteraController : Controller
{
    private readonly ICuentaBilleteraRepository _cuentaRepo;
    private readonly IMovimientoRepository _movimientoRepo;

    // Datos simulados (fallback de demo) usados cuando source != "db".
    private static readonly List<Usuario> MockUsuarios = new()
    {
        new Usuario { UsuarioId = 1, Nombre = "Lautaro", Apellido = "Oporto", Email = "lautaro.oporto@example.com" },
        new Usuario { UsuarioId = 2, Nombre = "Franco", Apellido = "Barrabino", Email = "franco.barrabino@example.com" },
        new Usuario { UsuarioId = 3, Nombre = "Fabricio", Apellido = "Thompson", Email = "fabricio.thompson@example.com" }
    };

    private static readonly List<Billetera> MockBilleteras = new()
    {
        new Billetera { BilleteraId = 1, Nombre = "Mercado Pago" },
        new Billetera { BilleteraId = 2, Nombre = "Ualá" },
        new Billetera { BilleteraId = 3, Nombre = "Brubank" }
    };

    private static readonly List<CuentaBilletera> MockCuentas = new();
    private static readonly List<Movimiento> MockMovimientos = new();

    // Precarga las cuentas y movimientos simulados una sola vez (datos de demo).
    static CuentaBilleteraController()
    {
        MockCuentas.Add(new CuentaBilletera
        { 
            CuentaBilleteraId = 1, 
            UsuarioId = 1, 
            Usuario = MockUsuarios[0], 
            BilleteraId = 1, 
            Billetera = MockBilleteras[0], 
            Alias = "MercadoPago.Oporto", 
            SaldoActual = 150000.00m, 
            FechaVinculacion = DateTime.Now.AddDays(-10) 
        });
        MockCuentas.Add(new CuentaBilletera 
        { 
            CuentaBilleteraId = 2, 
            UsuarioId = 2, 
            Usuario = MockUsuarios[1], 
            BilleteraId = 2, 
            Billetera = MockBilleteras[1], 
            Alias = "Uala.Barrabino", 
            SaldoActual = 45000.50m, 
            FechaVinculacion = DateTime.Now.AddDays(-5) 
        });
        MockCuentas.Add(new CuentaBilletera 
        { 
            CuentaBilleteraId = 3, 
            UsuarioId = 3, 
            Usuario = MockUsuarios[2], 
            BilleteraId = 3, 
            Billetera = MockBilleteras[2], 
            Alias = "Brubank.Thompson", 
            SaldoActual = 98000.00m, 
            FechaVinculacion = DateTime.Now.AddDays(-2) 
        });

        MockMovimientos.AddRange(new[]
        {
            new Movimiento { MovimientoId = 1, CuentaBilleteraId = 1, Fecha = DateTime.Now.AddDays(-2), Descripcion = "Sueldo recibido", Monto = 200000.00m, Tipo = "Ingreso" },
            new Movimiento { MovimientoId = 2, CuentaBilleteraId = 1, Fecha = DateTime.Now.AddDays(-1), Descripcion = "Compra Alimentos", Monto = 50000.00m, Tipo = "Egreso" },
            new Movimiento { MovimientoId = 3, CuentaBilleteraId = 2, Fecha = DateTime.Now.AddDays(-3), Descripcion = "Transferencia de amigos", Monto = 50000.00m, Tipo = "Ingreso" },
            new Movimiento { MovimientoId = 4, CuentaBilleteraId = 2, Fecha = DateTime.Now.AddDays(-1), Descripcion = "Carga Sube", Monto = 4999.50m, Tipo = "Egreso" },
            new Movimiento { MovimientoId = 5, CuentaBilleteraId = 3, Fecha = DateTime.Now.AddDays(-1), Descripcion = "Pago de Luz", Monto = 12000.00m, Tipo = "Egreso" },
            new Movimiento { MovimientoId = 6, CuentaBilleteraId = 3, Fecha = DateTime.Now, Descripcion = "Cine y pochoclos", Monto = 10000.00m, Tipo = "Egreso" }
        });
    }

    public CuentaBilleteraController(ICuentaBilleteraRepository cuentaRepo, IMovimientoRepository movimientoRepo)
    {
        _cuentaRepo = cuentaRepo;
        _movimientoRepo = movimientoRepo;
    }

    // Vista lista: muestra todas las cuentas, desde mock o desde la DB (con fallback a mock si falla).
    public async Task<IActionResult> Index(string source = "mock")
    {
        source = source.ToLower() == "db" ? "db" : "mock";
        ViewData["Source"] = source;

        List<CuentaBilletera> cuentas;

        if (source == "db")
        {
            try
            {
                cuentas = await _cuentaRepo.ObtenerTodosAsync();
            }
            catch (Exception ex)
            {
                TempData["ErrorMessage"] = $"Error al acceder a la base de datos (TP-04): {ex.Message}. Mostrando datos simulados (TP-02) en su lugar.";
                source = "mock";
                ViewData["Source"] = "mock";
                cuentas = MockCuentas;
            }
        }
        else
        {
            cuentas = MockCuentas;
        }

        return View(cuentas);
    }

    // Vista detalle: una cuenta con sus movimientos, desde mock o desde la DB.
    public async Task<IActionResult> Details(int id, string source = "mock")
    {
        source = source.ToLower() == "db" ? "db" : "mock";
        ViewData["Source"] = source;

        CuentaBilletera? cuenta = null;
        List<Movimiento> movimientos = new();

        if (source == "db")
        {
            try
            {
                cuenta = await _cuentaRepo.ObtenerPorIdAsync(id);
                if (cuenta != null)
                {
                    var allMovs = await _movimientoRepo.ObtenerTodosAsync();
                    movimientos = allMovs.Where(m => m.CuentaBilleteraId == id).ToList();
                }
            }
            catch (Exception ex)
            {
                TempData["ErrorMessage"] = $"Error al consultar detalle en base de datos (TP-04): {ex.Message}.";
                return RedirectToAction(nameof(Index), new { source = "db" });
            }
        }
        else
        {
            cuenta = MockCuentas.FirstOrDefault(c => c.CuentaBilleteraId == id);
            if (cuenta != null)
            {
                movimientos = MockMovimientos.Where(m => m.CuentaBilleteraId == id).ToList();
            }
        }

        if (cuenta == null)
        {
            return NotFound();
        }

        ViewBag.Movimientos = movimientos;
        return View(cuenta);
    }
}
