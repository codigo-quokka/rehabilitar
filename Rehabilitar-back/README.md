# Configuración de la Base de Datos (SQLite)

Para poder ejecutar la API localmente, primero hay que generar el archivo de la base de datos rehabilitar.db.

### Requisitos Previos

Tener instalada la herramienta global de Entity Framework para la línea de comandos. Si no la tenés, instálala ejecutando:

`dotnet tool install --global dotnet-ef`

---

### Pasos para inicializar la Base de Datos

En la terminal desde la raíz del proyecto (rehabilitar/) ejecutá los siguientes comandos en orden:

1. Generar una nueva migración (Sólo cuando modifiques la estructura de la base de datos):
Este comando **no se corre siempre**. Solo tenés que ejecutarlo cuando hayas agregado, borrado o modificado alguna propiedad en las entidades de la capa de Dominio (ej. `Reserva`, `User`) o en el `DbContext`. 
Al hacerlo, le estás sacando una "foto" a tus cambios. **Importante:** Acordate de cambiar la palabra `NombreDeTuMigracion` por algo descriptivo (ej. `AgregadaTablaSalas`).

`dotnet ef migrations add NombreDeTuMigracion --project Rehabilitar-back/src/Infrastructure/Infrastructure.csproj --startup-project Rehabilitar-back/src/API/API.csproj --output-dir Persistence/Migrations`


2. Aplicar las migraciones y crear la base de datos:
Con este comando se leen las migraciones existentes y se construye el archivo SQLite `rehabilitar.db` dentro de la carpeta de la API.

`dotnet ef database update --project Rehabilitar-back/src/Infrastructure/Infrastructure.csproj --startup-project Rehabilitar-back/src/API/API.csproj`

---

### Verificación:
Si el comando finaliza correctamente (`Done.`), deberías ver un archivo llamado rehabilitar.db en el directorio Rehabilitar-back/src/API/.