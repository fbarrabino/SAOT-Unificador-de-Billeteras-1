using System.Text.RegularExpressions;

namespace Billeteras.Negocio;

/// Saneo de entrada de texto libre (defensa en profundidad contra XSS almacenado).
///
/// ¿Por qué existe si la app cliente es nativa y EF ya parametriza las consultas?
///   - SQLi: cubierto por EF Core / parámetros de ADO.NET (nunca concatenamos).
///   - XSS: la app móvil no renderiza HTML, pero si algún día esos datos se
///     muestran en una web (o en el panel de auditoría), no queremos haber
///     PERSISTIDO etiquetas ni scripts. Por eso limpiamos ANTES de guardar.
///
/// Es una limpieza conservadora: quita bloques &lt;script&gt; y cualquier etiqueta
/// HTML suelta, y recorta espacios. No toca el texto normal del usuario.
/// (Rúbrica 5.3 — Buenas prácticas OWASP.)
public static partial class Sanitizador
{
    // <script ...>...</script> completo, incluido su contenido.
    [GeneratedRegex(@"<script\b[^<]*(?:(?!</script>)<[^<]*)*</script>",
        RegexOptions.IgnoreCase | RegexOptions.Singleline)]
    private static partial Regex ScriptRegex();

    // Cualquier etiqueta HTML restante: <b>, <img ...>, </div>, <a href=...>, etc.
    [GeneratedRegex(@"<[^>]+>")]
    private static partial Regex TagRegex();

    /// Devuelve el texto sin bloques &lt;script&gt; ni etiquetas HTML, ya recortado.
    /// Si la entrada es null o solo espacios, la devuelve tal cual (no fuerza
    /// valores en campos opcionales; la obligatoriedad la validan las DataAnnotations).
    public static string? LimpiarTexto(string? entrada)
    {
        if (string.IsNullOrWhiteSpace(entrada))
            return entrada;

        var sinScripts = ScriptRegex().Replace(entrada, string.Empty);
        var sinTags = TagRegex().Replace(sinScripts, string.Empty);
        return sinTags.Trim();
    }
}
