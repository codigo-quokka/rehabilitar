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
* **Rol:** `admin`

---

## 2. Clientes (Pacientes)

Usuarios que pueden realizar reservas y ver sus actividades. 
*Nota: La fecha de nacimiento de los clientes de prueba está seteada de manera fija al 01/01/2000 (mayores de edad).*

| Nombre | Apellido | Email / Username | Contraseña | DNI | Teléfono | Rol |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Paul | Atreides | `paul@atreides.com` | `cliente` | 11222333 | 542214445566 | `registered_client` |
| Rocky | Balboa | `rocky@balboa.com` | `cliente` | 44555666 | 542217778899 | `registered_client` |

---

## 3. Profesores

Usuarios encargados de dictar las actividades y clases en las diferentes salas. Cada uno tiene asignada una especialidad específica de dominio.

| Nombre | Apellido | Email / Username | Contraseña | Especialidad | Rol |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Peter | Parker | `peter@parker.com` | `profesor` | TrenSuperior | `professor` |
| Bruce | Wayne | `bruce@wayne.com` | `profesor` | TrenMedio | `professor` |
| Clark | Kent | `clark@kent.com` | `profesor` | TrenInferior | `professor` |

---

## Roles Creados en el Sistema

Además de los usuarios, el sistema asegura la existencia de los siguientes roles en la tabla `Roles` de Identity:

* `admin`
* `reception` (No hay usuarios asignados por defecto)
* `professor`
* `registered_client`
* `guest`
