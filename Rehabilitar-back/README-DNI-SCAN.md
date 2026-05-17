# Requisitos del Sistema: Escáner de DNI

La funcionalidad de escaneo de DNI en el registro utiliza dos métodos de extracción de datos:
1. **Lectura de Código de Barras (PDF417):** Utiliza la librería `ZXing.Net`. Está escrita íntegramente en C# y **funciona automáticamente** en cualquier sistema sin configuración extra. Provee 100% de precisión.
2. **Reconocimiento Óptico de Caracteres (Tesseract OCR):** Se utiliza como "Plan B" si el código de barras no es legible. Para que este método funcione, **requiere que el motor Tesseract esté instalado a nivel del sistema operativo**.

Si no tienes Tesseract instalado, el backend no crasheará, pero si la foto del DNI es mala y falla el código de barras, fallará la lectura completa arrojando un error en consola.

A continuación se detallan las instrucciones para instalar Tesseract según tu sistema operativo:

---

## 🪟 Windows 10 / 11

El wrapper de .NET suele resolver las dependencias nativas en Windows descargando las `.dll` necesarias automáticamente. Sin embargo, si obtienes un error de librería no encontrada (`TargetInvocationException`), deberás instalar el motor manualmente:

1. Descarga el instalador de Tesseract OCR para Windows desde el repositorio no oficial de UB-Mannheim: [tesseract-ocr-w64-setup.exe](https://github.com/UB-Mannheim/tesseract/wiki)
2. Durante la instalación, en la sección de **"Additional language data"**, asegúrate de desplegar el menú y marcar **"Spanish"** para descargar el paquete `spa`.
3. Reinicia tu IDE o consola antes de volver a ejecutar el proyecto.

---

## 🐧 Linux: Ubuntu / Debian / Pop!_OS

En distribuciones basadas en Debian, la instalación de la librería compartida `.so` y los idiomas es directa a través del gestor de paquetes.

Abre la terminal y ejecuta:
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr tesseract-ocr-spa
```
El wrapper de .NET (`Tesseract`) encontrará automáticamente las librerías dinámicas.

---

## 🐧 Linux: Arch Linux / Manjaro / CachyOS

Las distribuciones basadas en Arch Linux empaquetan las librerías con nombres de archivo versionados que el wrapper de C# no reconoce por defecto (buscan `libdl.so` o `libleptonica-1.82.0.so`).

**1. Instalar los paquetes:**
```bash
sudo pacman -S tesseract tesseract-data-spa
```

**2. Solucionar el problema de librerías nativas (Symlinks):**
Si al intentar escanear con OCR recibes el error `Unable to load shared library 'libdl'` o `Failed to find library libleptonica`, deberás crear enlaces simbólicos dentro de la carpeta compilada de la API para que .NET las encuentre.

Abre una terminal en la raíz de infra (`Rehabilitar-back/src/Infrastructure/`) y ejecuta:

```bash
# Crear la carpeta x64 esperada por el wrapper
mkdir -p x64

# Enlazar leptonica y tesseract (verifica primero tu versión instalada en /usr/lib)
ln -sf /usr/lib/libleptonica.so.6.0.0 x64/libleptonica-1.82.0.so
ln -sf /usr/lib/libtesseract.so.5.0.5 x64/libtesseract50.so

# Enlazar libdl (requerido desde glibc 2.34+)
ln -sf /usr/lib/libdl.so.2 libdl.so
```

**Nota:** Estos enlaces simbólicos son locales para tu máquina y NO deben ser subidos al repositorio. El archivo `Infrastructure.csproj` solo debe contener la configuración para copiar la carpeta `TessData`.
No lo pusheo completo para no joder en los SOs que no son Arch así que también vas a tener que sumar estas líneas:
```xml
<ItemGroup>
  <!--
  estas ya están incluidas en el .csproj nuevo:
  <None Update="tessdata\**\*">
    <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
  </None>
  estas son las que hay que agregar: -->
  <None Update="x64\**\*">
    <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
  </None>
  <None Update="libdl.so">
    <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
  </None>
</ItemGroup>
```
Con este comando le decís a git que haga como que este archivo nunca cambió así no te aparece en el git status ni se te pushea sin querer:
`git update-index --assume-unchanged Rehabilitar-back/src/Infrastructure/Infrastructure.csproj`
Si querés volver a subir cambios de este archivo, se revierte con `--no-assume-unchanged`.

---

### ¿Cómo verificar que está funcionando?
Al subir una foto desde el frontend, revisa la consola donde se ejecuta la API de .NET. Deberías ver uno de estos mensajes:
* `--> DNI decodificado exitosamente usando código de barras (PDF417).` (No usó Tesseract).
* `--> DNI decodificado parcialmente usando Tesseract OCR.` (Tesseract se cargó correctamente y leyó algunos datos).