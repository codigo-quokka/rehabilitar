# Datos Iniciales del Sistema (Seeding)

Este documento describe los usuarios y cuentas que se insertan automáticamente en la base de datos al iniciar la aplicación (seeding). Estas cuentas están destinadas para facilitar el desarrollo, las pruebas y garantizar que existan los roles básicos del sistema.

## Notas Generales de Seguridad
* **Todas las cuentas** generadas por el seeder tienen el email pre-confirmado (`EmailConfirmed = true`) para poder iniciar sesión directamente.

---

## 1. Administrador y Recepción del Sistema

Cuentas con privilegios administrativos o de gestión.

* **Administrador:**
    * **Email / Username:** `admin@rehabilitar.com`
    * **Contraseña:** `admin`
    * **Rol:** `Administrador`

* **Recepción:**
    * **Email / Username:** `recepcion@rehabilitar.com`
    * **Contraseña:** `recepcion`
    * **Rol:** `Recepción`

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
| José | Hernández | joseh@gmail.com | `cliente` | 10000000 |  | `Cliente Registrado` |
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

## 5. Actividades Iniciales

El sistema genera las siguientes actividades para facilitar las pruebas de flujo de reservas:

| Nombre | Especialidad | Frecuencia | Estado |
| :--- | :--- | :--- | :--- |
| Yoga Terapéutico | TrenSuperior | Esporadica | Aprobada |
| Rehabilitación de Hombro | TrenSuperior | Recurrente | EnCurso |
| Ejercicios Core | TrenMedio | Recurrente | Aprobada |
| Fortalecimiento Lumbar | TrenMedio | Esporadica | Propuesta |
| Rehabilitación de Rodilla | TrenInferior | Recurrente | EnCurso |
| Tonificación General | TrenSuperior | Recurrente | Aprobada |
| Estiramientos Asistidos | TrenInferior | Esporadica | Propuesta |
| Gimnasia Postural | TrenMedio | Recurrente | EnCurso |

---


