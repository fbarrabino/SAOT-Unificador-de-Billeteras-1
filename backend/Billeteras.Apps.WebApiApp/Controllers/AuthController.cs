using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Billeteras.Apps.WebApiApp.Dtos;
using Billeteras.Negocio.Dtos;
using Billeteras.Negocio.Interfaces;

namespace Billeteras.Apps.WebApiApp.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IUsuarioNegocio usuarios, IVerificacionNegocio verificacion, IConfiguration config) : ControllerBase
{
    /// POST /api/auth/register — público. Crea un usuario (email único + hash BCrypt).
    [HttpPost("register")]
    public async Task<ActionResult<UsuarioResponse>> Register([FromBody] RegisterRequest req)
    {
        var creado = await usuarios.RegistrarAsync(
            new RegistrarUsuarioRequest(req.Nombre, req.Apellido, req.Email, req.Password));

        if (creado is null)
            return BadRequest(new { mensaje = "Ya existe un usuario con ese email." });

        // A8: dispara el código de verificación de email (mismo mecanismo que
        // forgot-password, distinto Tipo). No bloquea el registro si algo falla acá.
        await verificacion.SolicitarCodigoAsync(creado.Email, TiposCodigoVerificacion.VerificacionEmail);

        return Ok(creado);
    }

    /// POST /api/auth/login — público. Devuelve un JWT si las credenciales son válidas.
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest req)
    {
        var usuario = await usuarios.AutenticarAsync(req.Email, req.Password);
        if (usuario is null)
            return Unauthorized(new { mensaje = "Email o contraseña inválidos." });

        // BE-11: cargamos los roles del usuario para inyectarlos como claims;
        // si no tiene roles explícitos en UsuarioRol le asignamos "User" por
        // defecto para que todos los endpoints [Authorize] sigan funcionando.
        var roles = await usuarios.ObtenerNombresRolesAsync(usuario.UsuarioId);
        if (roles.Count == 0) roles.Add("User");

        var (token, expiraEn) = GenerarToken(usuario, roles);
        return Ok(new LoginResponse(token, expiraEn, usuario));
    }

    /// POST /api/auth/forgot-password — público. Genera y "envía" (log) un código
    /// de 6 dígitos. Nunca revela si el email existe; devuelve 429 si hay throttle.
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
    {
        var resultado = await verificacion.SolicitarCodigoAsync(req.Email, TiposCodigoVerificacion.ResetPassword);
        if (!resultado.Ok)
            return StatusCode(429, new { mensaje = resultado.Mensaje, segundosRestantes = resultado.SegundosRestantes });

        return Ok(new { mensaje = resultado.Mensaje });
    }

    /// POST /api/auth/reset-password — público. Valida el código de 6 dígitos y,
    /// si es válido, actualiza la contraseña (BCrypt).
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
    {
        var resultado = await verificacion.ResetearPasswordAsync(req.Email, req.Codigo, req.NuevaPassword);
        if (!resultado.Ok)
            return BadRequest(new { mensaje = resultado.Mensaje });

        return Ok(new { mensaje = resultado.Mensaje });
    }

    /// POST /api/auth/verify-email — público. Valida el código de 6 dígitos enviado
    /// al registrarse y marca Usuario.EmailVerificado = true.
    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest req)
    {
        var resultado = await verificacion.VerificarEmailAsync(req.Email, req.Codigo);
        if (!resultado.Ok)
            return BadRequest(new { mensaje = resultado.Mensaje });

        return Ok(new { mensaje = resultado.Mensaje });
    }

    /// POST /api/auth/resend-verification-email — público. Reenvía el código de
    /// verificación de email (mismo throttle de 60s que forgot-password).
    [HttpPost("resend-verification-email")]
    public async Task<IActionResult> ResendVerificationEmail([FromBody] ForgotPasswordRequest req)
    {
        var resultado = await verificacion.SolicitarCodigoAsync(req.Email, TiposCodigoVerificacion.VerificacionEmail);
        if (!resultado.Ok)
            return StatusCode(429, new { mensaje = resultado.Mensaje, segundosRestantes = resultado.SegundosRestantes });

        return Ok(new { mensaje = resultado.Mensaje });
    }

    /// GET /api/auth/me — protegido. Devuelve el usuario del token.
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UsuarioResponse>> Me()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(idClaim, out var usuarioId))
            return Unauthorized();

        var usuario = await usuarios.ObtenerPorIdAsync(usuarioId);
        return usuario is null ? NotFound() : Ok(usuario);
    }

    /// POST /api/auth/change-password — protegido. Requiere la contraseña actual
    /// (BCrypt.Verify) para poder setear la nueva.
    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(idClaim, out var usuarioId))
            return Unauthorized();

        var resultado = await usuarios.CambiarPasswordAsync(usuarioId, req.PasswordActual, req.PasswordNueva);
        if (!resultado.Ok)
            return BadRequest(new { mensaje = resultado.Mensaje });

        return Ok(new { mensaje = resultado.Mensaje });
    }

    private (string token, DateTime expiraEn) GenerarToken(UsuarioResponse usuario, IEnumerable<string> roles)
    {
        var jwt = config.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!));
        var credenciales = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var minutos = int.Parse(jwt["ExpiresInMinutes"] ?? "120");
        var expiraEn = DateTime.UtcNow.AddMinutes(minutos);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, usuario.UsuarioId.ToString()),
            new(ClaimTypes.Name, usuario.Email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims: claims,
            expires: expiraEn,
            signingCredentials: credenciales);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiraEn);
    }
}