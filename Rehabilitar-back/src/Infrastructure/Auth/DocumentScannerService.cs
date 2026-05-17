using System.Text.RegularExpressions;
using Application.Auth.DTOs;
using Application.Common.Interfaces;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using Tesseract;
using ZXing;
using System.Globalization;

namespace Infrastructure.Auth;

public class DocumentScannerService : IDocumentScannerService
{
    public async Task<ParsedDniResponse> ScanDniAsync(Stream imageStream)
    {
        // Para no agotar el stream, copiamos a un MemoryStream
        using var memoryStream = new MemoryStream();
        await imageStream.CopyToAsync(memoryStream);

        // Paso A: Intentar con ZXing (PDF417)
        memoryStream.Position = 0;
        var barcodeData = ReadPdf417(memoryStream);

        // da los datos separados por @
        // ej: 00123456789@APELLIDO@NOMBRE@X@12345678@A@01/01/2002@01/01/2010

        if (!string.IsNullOrEmpty(barcodeData) && barcodeData.Contains('@'))
        {
            var parts = barcodeData.Split('@');
            if (parts.Length >= 8)
            {
                // parts[0] = N° de trámite
                // parts[1] = Apellidos
                // parts[2] = Nombres
                // parts[3] = Sexo
                // parts[4] = DNI
                // parts[5] = Ejemplar
                // parts[6] = Fecha de nacimiento (dd/MM/yyyy)
                // parts[7] = Fecha de emisión (dd/MM/yyyy)
                
                string fechaNacimientoStr = parts[6];
                if (DateTime.TryParseExact(fechaNacimientoStr, "dd/MM/yyyy", null, System.Globalization.DateTimeStyles.None, out var fechaNac))
                {
                    fechaNacimientoStr = fechaNac.ToString("yyyy-MM-dd");
                }

                var textInfo = CultureInfo.CurrentCulture.TextInfo;
                // ej: QUOKKA -> Quokka

                Console.WriteLine("--> DNI decodificado exitosamente usando código de barras (PDF417).");
                return new ParsedDniResponse(
                    IsValidId: true,
                    FirstName: textInfo.ToTitleCase(parts[2].ToLower()),
                    LastName: textInfo.ToTitleCase(parts[1].ToLower()),
                    DniNumber: parts[4],
                    FechaNacimiento: fechaNacimientoStr,
                    ErrorMessage: null
                );
            }
        }

        // Paso B: Intentar con Tesseract OCR
        memoryStream.Position = 0;
        return FallbackToTesseractOcr(memoryStream);
    }

    private string? ReadPdf417(MemoryStream stream)
    {
        try
        {
            using var image = Image.Load<Rgba32>(stream);
            var reader = new ZXing.ImageSharp.BarcodeReader<Rgba32>
            {
                Options = new ZXing.Common.DecodingOptions
                {
                    PossibleFormats = new[] { BarcodeFormat.PDF_417 },
                    TryHarder = true
                }
            };

            var result = reader.Decode(image);
            return result?.Text;
        }
        catch (Exception)
        {
            return null;
        }
    }

    private ParsedDniResponse FallbackToTesseractOcr(MemoryStream stream)
    {
        try
        {
            var tessDataPath = Path.Combine(AppContext.BaseDirectory, "Auth", "TessData");
            using var engine = new TesseractEngine(tessDataPath, "spa", EngineMode.Default);
            
            using var image = Pix.LoadFromMemory(stream.ToArray());
            using var page = engine.Process(image);
            
            var text = page.GetText();
            
            if (string.IsNullOrWhiteSpace(text))
            {
                return new ParsedDniResponse(false, null, null, null, null, "No se detectó texto en la imagen.");
            }

            // Extracción muy básica para MRZ TD1
            // Buscamos algo parecido a un número de DNI (7 o 8 dígitos)
            var dniMatch = Regex.Match(text, @"\b(\d{7,8})\b");
            string? dniNumber = dniMatch.Success ? dniMatch.Groups[1].Value : null;

            if (dniMatch.Success)
            {
                Console.WriteLine("--> DNI decodificado parcialmente usando Tesseract OCR.");
            }

            return new ParsedDniResponse(
                IsValidId: dniMatch.Success,
                FirstName: null, // Extraer nombre por OCR es propenso a errores sin un formato rígido
                LastName: null,
                DniNumber: dniNumber,
                FechaNacimiento: null,
                ErrorMessage: dniMatch.Success ? null : MensajeError(),
                ScanMethod: "Tesseract OCR"
            );
        }
        catch (Exception ex)
        {
            var realError = ex.InnerException?.Message ?? ex.Message;
            System.Console.WriteLine($"Error de OCR: {realError}");
            return new ParsedDniResponse(false, null, null, null, null, MensajeError());
        }
    }

    private static string MensajeError()
    {
        return "No pudimos extraer datos fiables por OCR. Por favor intente con el dorso o mejor iluminación.";
    }
}
