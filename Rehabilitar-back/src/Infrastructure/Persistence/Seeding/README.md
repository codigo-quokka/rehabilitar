# Datos Iniciales del Sistema (Seeding)

Este documento describe los usuarios y cuentas que se insertan automáticamente en la base de datos al iniciar la aplicación (seeding). Estas cuentas están destinadas para facilitar el desarrollo, las pruebas y garantizar que existan los roles básicos del sistema.

## Notas Generales de Seguridad
* **Todas las cuentas** generadas por el seeder tienen el email pre-confirmado (`EmailConfirmed = true`) para poder iniciar sesión directamente.
* La política de contraseñas de Identity está configurada temporalmente a un mínimo de 6 caracteres sin restricciones de mayúsculas o caracteres especiales (revisar `DependencyInjection.cs`).

---

## 1. Administrador del Sistema

Es la cuenta principal con acceso total al sistema.

* **Nombre:** Admin Administrador
* **Email / Username:** `admin@rehabilitar.com`
* **Contraseña:** `admin0`
* **Rol:** `Administrador`

---

## 2. Clientes (Pacientes)

Usuarios que pueden realizar reservas y ver sus actividades. 
*Nota: La fecha de nacimiento de los clientes de prueba está seteada de manera fija al 01/01/2000 (mayores de edad).*

| Nombre | Apellido | Email / Username | Contraseña | DNI | Teléfono | Rol |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Paul | Atreides | `paul@atreides.com` | `cliente` | 11222333 | 542214445566 | `Cliente Registrado` |
| Rocky | Balboa | `rocky@balboa.com` | `cliente` | 44555666 | 542217778899 | `Cliente Registrado` |
| Mr | Robot | `mr@robot.com` | `cliente` | 55666777 |  | `Cliente Registrado` |
| Daenerys | Targaryen | `daenerys@targaryen.com` | `cliente` | 10111222 | 541120204040 | `Cliente Registrado` |
| Marilina | Bertoldi | `marilina@bertoldi.com` | `cliente` | 22333444 |   | `Cliente Registrado` |
| Ricardo | Mollo | `ricardo@mollo.com` | `cliente` | 33444555 | 541110102020 | `Cliente Registrado` |

---

## 3. Profesores

Usuarios encargados de dictar las actividades y clases en las diferentes salas. Cada uno tiene asignada una especialidad específica de dominio.

| Nombre | Apellido | Email / Username | Contraseña | Especialidad | Rol |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Peter | Parker | `peter@parker.com` | `profesor` | TrenSuperior | `Profesor` |
| Bruce | Wayne | `bruce@wayne.com` | `profesor` | TrenMedio | `Profesor` |
| Clark | Kent | `clark@kent.com` | `profesor` | TrenInferior | `Profesor` |

---

## 4. Salas

| Nombre | Capacidad | Descripción |
| :--- | :--- | :--- |
| Sala A | 10 |  |
| Sala B | 20 |  |
| Sala C | 30 |  |
| Sala D | 50 |  |
| Sala E | 80 |  |

---

## Roles Creados en el Sistema

Además de los usuarios, el sistema asegura la existencia de los siguientes roles en la tabla `Roles` de Identity:

* `Administrador`
* `Recepción` (No hay usuarios asignados por defecto)
* `Profesor`
* `Cliente Registrado`

