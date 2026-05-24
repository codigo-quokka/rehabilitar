# Usar ngrok con MercadoPago en RehabilitAR

## ¿Por qué necesitamos ngrok?

MercadoPago, al procesar un pago, necesita notificar a nuestro backend mediante un **webhook** (una llamada HTTP POST a una URL pública). Cuando desarrollamos en local, nuestro backend corre en `http://localhost:5129`, una dirección que **no es accesible desde internet**.

**ngrok** crea un túnel seguro desde internet hacia nuestro `localhost`, generando una URL pública del estilo `https://milagro-azul.ngrok-free.dev`. MercadoPago puede golpear esa URL y el túnel redirige la petición a nuestro backend local.

Sin ngrok, los webhooks de MercadoPago nunca llegan a nuestro backend y los pagos quedan en un estado inconsistente.

---

## Prerrequisitos

Antes de empezar, asegurate de tener:

- [ ] El proyecto RehabilitAR funcionando localmente (backend en `http://localhost:5129`, frontend en `http://localhost:5173`)
- [ ] Una cuenta en [ngrok.com](https://ngrok.com) (es gratuita)
- [ ] `ngrok` instalado en tu sistema
- [ ] Las credenciales de MercadoPago configuradas (ya están en `appsettings.Development.json`)

---

## Paso a paso

### 1. Instalar ngrok

**Linux (apt):**
```bash
curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
```

**macOS (Homebrew):**
```bash
brew install ngrok/ngrok/ngrok
```

**Windows (winget):**
```bash
winget install ngrok
```

O descargá el binario desde [ngrok.com/download](https://ngrok.com/download).

### 2. Autenticar tu cuenta

Una vez instalado, conectá tu cuenta de ngrok:

```bash
ngrok config add-authtoken TU_TOKEN_DE_AUTH
```

Podés encontrar tu token en [dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken).

### 3. Levantar el túnel hacia el backend

Con el backend corriendo (en el puerto 5129), abrí una terminal y ejecutá:

```bash
ngrok http 5129
```

Vas a ver una salida como esta:

```
Forwarding  https://milagro-azul.ngrok-free.dev -> http://localhost:5129
```

Esa URL `https://milagro-azul.ngrok-free.dev` es tu **túnel activo**. De ahora en más, cualquier request que MercadoPago haga a esa URL va a llegar a tu backend local.

> **Importante**: dejá esta terminal abierta mientras desarrolles. Si la cerrás, el túnel se corta. También tené en cuenta que cada vez que reiniciás ngrok, la URL cambia (a menos que tengas una cuenta paga con dominio fijo).
**_Nota: no sé por qué las IAs dicen esto, según estuve probando mi URL siempre fue la misma y te dan una por cuenta que queda fija._**

---

### 4. Configurar los archivos del proyecto

#### Backend — `appsettings.Development.json`

Abrí `Rehabilitar-back/src/API/appsettings.Development.json` y actualizá la sección `MercadoPago` con la URL de tu túnel:

```json
"MercadoPago": {
    "WebhookSecret": "webhook_secret",
    "WebhookUrl": "https://milagro-azul.ngrok-free.dev/api/pagos/mercadopago/webhook",
    "AccessToken": "token"
}
```

Reemplazá `milagro-azul` con el subdominio que te haya asignado ngrok. **No olvides** la ruta completa `/api/pagos/mercadopago/webhook`.

---

### 5. Activá el webhook en el código

Este es un paso **fundamental**. Actualmente, el `MercadoPagoService.cs` tiene las líneas del webhook **comentadas**. Sin esto, MercadoPago no sabe a qué URL notificar.
_**Esto lo dejé comentado porque la URL también se configura desde la cuenta de MP y usando este método MP manda unas requests de más que terminan siempre en Bad Request (400). No debería generar ningún problema y todo debería funcionar igual de todas formas.**_

Abrí `Rehabilitar-back/src/Infrastructure/Services/MercadoPagoService.cs` y **descomentá** las líneas 28 y 48:

**Antes (comentado):**
```csharp
// var webhookUrl = _config["MercadoPago:WebhookUrl"];
// ...
// notification_url = webhookUrl
```

**Después (activo):**
```csharp
var webhookUrl = _config["MercadoPago:WebhookUrl"];
// ...
notification_url = webhookUrl
```

Esto le indica a MercadoPago que, ante cualquier evento de pago, envíe un POST a la URL del webhook que configuramos (la del túnel de ngrok).

---

### 6. Probar el flujo completo

1. **Actualizá los archivos de configuración** como se indica en los pasos 4 y 5.

2. **Iniciá el backend:**
   ```bash
   cd Rehabilitar-back
   dotnet run --project src/API/API.csproj
   ```

3. **Iniciá ngrok** (en otra terminal):
   ```bash
   ngrok http 5129
   ```
   Tomá nota de la URL generada (ej. `https://milagro-azul.ngrok-free.dev`).
   **_Acá separó back y front pero pueden tirar el `start.bat` o `start.sh` y después iniciar ngrok._**


4. **Iniciá el frontend** (en otra terminal):
   ```bash
   cd Rehabilitar-front
   npm run dev
   ```

5. **Hacé una reserva y pagá con MercadoPago** desde el frontend.

6. **Verificá que el webhook llega:** Al pagar, deberías ver en la terminal del backend algo como:
   ```
   [POST] /api/pagos/mercadopago/webhook -> 200 OK
   ```
   Si ves `401 Unauthorized`, revisá el `WebhookSecret`.

---

## Arquitectura del flujo

```
                     ┌──────────────────────┐
                     │   Frontend React      │
                     │  localhost:5173       │
                     └──────┬───────────────┘
                            │  POST /pagos/mercadopago/preferencia
                            ▼
                     ┌──────────────────────┐
                     │   Backend .NET        │
                     │  localhost:5129       │
                     └──────┬───────────────┘
                            │  POST /checkout/preferences
                            ▼
                     ┌──────────────────────┐
                     │   API MercadoPago     │
                     │  api.mercadopago.com  │
                     └──────┬───────────────┘
                            │  Devuelve initPoint
                            ▼
  Usuario ──────►   Redirige a MP ──────►  Paga
                            │
                            ▼  Webhook POST
                     ┌──────────────────────┐
                     │   🚇 ngrok tunnel     │
                     │  milagro-azul.ngrok-  │
                     │  free.dev             │
                     └──────────┬───────────┘
                                │  Reenvía a localhost:5129
                                ▼
                     ┌──────────────────────┐
                     │   Backend .NET        │
                     │  /api/pagos/mercadopago/webhook
                     └──────┘
```

---

## Solución de problemas comunes

### Acá me parece que empezó a tirar fruta :P

### "Recibo 401 Unauthorized en el webhook"

- Revisá que `MercadoPago:WebhookSecret` en `appsettings.Development.json` coincida con el secreto configurado en el panel de MercadoPago.
- Verificá que el `WebhookUrl` apunte exactamente a `https://tu-tunel.ngrok-free.dev/api/pagos/mercadopago/webhook`.

### "El webhook nunca se dispara"

- Asegurate de haber **descomentado** las líneas `notification_url` en `MercadoPagoService.cs`.
- Confirmá que ngrok esté corriendo y la URL del túnel esté bien configurada.
- Probá el túnel manualmente: `curl -X POST https://tu-tunel.ngrok-free.dev/api/pagos/mercadopago/webhook` debería devolver algo (no necesariamente 200, pero debería conectarse).

### "Al pagar, me redirige a localhost y no carga nada"

- El `back_urls` en `MercadoPagoService.cs` apunta a `localhost:5173`.
- Si estás probando en el mismo navegador de la máquina donde desarrollás, esto funciona bien.
- Si estás probando desde otro dispositivo (celular, otra PC), necesitás un segundo túnel de ngrok para el frontend y actualizar `Frontend:BaseUrlNoHttp` en la configuración.

### "Ngrok me dice que llegué al límite de conexiones"

- La cuenta gratuita de ngrok tiene un límite de 40 conexiones/minuto y 1 GB/mes de tráfico.
- Si estás haciendo muchas pruebas, esperá unos minutos o considerá upgradear a un plan pago.
- También podés usar alternativas como [bore](https://github.com/ekzhang/bore), [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/), o [localtunnel](https://github.com/localtunnel/localtunnel).

### "Me olvidé de actualizar la URL del túnel después de reiniciar ngrok"

- ngrok gratuito cambia la URL cada vez que se reinicia.
- **Siempre** que reiniciés ngrok, actualizá:
  - `MercadoPago:WebhookUrl` en `appsettings.Development.json`
  - `VITE_TUNNEL_HOST` en el `.env` del frontend

---

## Alternativas a ngrok

Si preferís otra herramienta, las configuraciones son similares:

| Herramienta          | Comando aproximado                         |
|----------------------|--------------------------------------------|
| **Cloudflare Tunnel** | `cloudflared tunnel --url http://localhost:5129` |
| **bore**              | `bore local 5129 --to bore.pub`            |
| **localtunnel**       | `npx localtunnel --port 5129`              |
| **serveo**            | `ssh -R 80:localhost:5129 serveo.net`      |

---

## Checklist rápida

Cada vez que quieras probar pagos con MercadoPago:

- [ ] Backend corriendo en `http://localhost:5129`
- [ ] Frontend corriendo en `http://localhost:5173`
- [ ] `ngrok http http://localhost:5129` corriendo en una terminal
- [ ] La URL del túnel actualizada en `appsettings.Development.json` → `MercadoPago:WebhookUrl`
- [ ] `MercadoPagoService.cs` con `notification_url` descomentado
- [ ] `VITE_TUNNEL_HOST` actualizado en `.env` del frontend
- [ ] Backend reiniciado después de los cambios de configuración
