# Configuración de la Base de Datos (SQLite)

Para poder ejecutar la API localmente, primero hay que generar el archivo de la base de datos rehabilitar.db.

### Requisitos Previos

Tener instalada la herramienta global de Entity Framework para la línea de comandos. Si no la tenés, instálala ejecutando:

`dotnet tool install --global dotnet-ef`

---

### Pasos para inicializar la Base de Datos

En la terminal desde la raíz del proyecto (rehabilitar/) ejecutá los siguientes comandos en orden:

1. Generar la migración inicial (Sólo si no existe la carpeta Migrations):
_(Nota: Este paso ya fue realizado y la migración inicial está en el repositorio, pero se documenta para futuras referencias)._

`dotnet ef migrations add InitialSetup --project Rehabilitar-back/src/Infrastructure/Infrastructure.csproj --startup-project Rehabilitar-back/src/API/API.csproj --output-dir Persistence/Migrations`


2. Aplicar las migraciones y crear la base de datos:
Con este comando se leen las migraciones existentes y se construye el archivo SQLite `rehabilitar.db` dentro de la carpeta de la API.

`dotnet ef database update --project Rehabilitar-back/src/Infrastructure/Infrastructure.csproj --startup-project Rehabilitar-back/src/API/API.csproj`

---

### Verificación:
Si el comando finaliza correctamente (`Done.`), deberías ver un archivo llamado rehabilitar.db en el directorio Rehabilitar-back/src/API/.