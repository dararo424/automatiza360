# Automatiza360 — "El empleado que nunca duerme" 🤖

> Explicación amigable de todas las funcionalidades del producto.
> Versión Mayo 2026

---

## ¿De qué se trata?

Imagínate que tienes un negocio chiquito o mediano — un restaurante, una clínica, una tienda de tecnología, una veterinaria, lo que sea — y te la pasas todo el día respondiendo lo mismo por WhatsApp: *"¿a qué hora abren?"*, *"¿tienen disponible tal cosa?"*, *"quiero agendar una cita"*, *"¿cuánto cuesta?"*… Eso es lo que **Automatiza360** te quita de encima.

Es una plataforma **SaaS multi-tenant** (un solo sistema que sirve a muchos negocios distintos, cada uno aislado) pensada para pymes latinoamericanas. Lo bonito es que **opera principalmente desde WhatsApp**, que es donde la gente realmente vive, no en una app que nadie quiere descargar.

---

## La idea grande: dos bots en uno

El mismo número de WhatsApp atiende a **dos audiencias** distintas y el sistema sabe automáticamente quién es quién.

### 🟢 Para tus clientes — bot con Google Gemini

Atiende **24/7**, sabe del negocio (menú, precios, disponibilidad, políticas) y según la industria hace cosas diferentes:

- **Restaurante / Panadería** — Muestra el menú del día, toma pedidos completos (con cantidades y método de pago), avisa cuando está listo para recoger o entrega.
- **Tienda Tech / Taller** — Recibe equipos para reparar, registra nombre/teléfono/dispositivo/falla, da estado del ticket, genera cotizaciones automáticas.
- **Clínica / Salón / Veterinaria** — Muestra horarios libres en tiempo real, agenda/modifica/cancela citas, manda recordatorios 24h antes, gestiona múltiples profesionales y servicios.
- **Tienda de ropa** — Catálogo con precios, consulta de tallas, reservas.

Y además, transversal a todas las industrias:

- **Transcribe notas de voz** (Groq Whisper) — el cliente manda audio y el bot lo entiende.
- **Escalación humana** — si el cliente dice "quiero hablar con una persona", te notifica al equipo en tiempo real.
- **Valida cupones de descuento** y consulta **puntos de lealtad** acumulados.
- **Mantiene contexto** entre mensajes de la misma sesión.
- **Reinicio de sesión** — el cliente puede escribir "menu" o "reiniciar" y empezar de nuevo.
- **Opt-out automático** — si responden "STOP", se desuscriben de campañas.

### 🔵 Para ti (el dueño) y tu equipo — bot con Claude (Anthropic)

Cuando **tú** o un miembro de tu equipo escriben al mismo número, el sistema los reconoce y los conecta con un agente distinto que **administra el negocio entero por chat**.

**Reportes**
- Resumen del día: ingresos, pedidos/citas, gastos, comparativo con ayer.
- Resumen del mes: totales acumulados, tendencias.
- Envío de gráficas por WhatsApp (imagen).
- Reporte ejecutivo por email.

**Contactos**
- Buscar contacto por nombre o teléfono.
- Ver los últimos 10 contactos.
- Agregar contacto nuevo.

**Campañas**
- Lanzar campañas masivas a todos los contactos.
- El bot pide confirmación antes de enviar para evitar errores.

**Reseñas y cupones**
- Ver últimas valoraciones con promedio de calificación.
- Ver cupones activos (código, descuento, vencimiento).
- Crear cupones nuevos (porcentaje o monto fijo).

**Turnos del personal**
- Ver horario del equipo para hoy o cualquier fecha.

**Por industria**

- **Restaurante / Panadería** — Cargas el menú del día en lenguaje natural (*"hoy hay bandeja paisa $18.000 y sancocho $15.000"*), ves órdenes pendientes, cambias estado (Confirmado → Preparando → Listo → Entregado). Al pasar a "Listo" el cliente recibe notificación automática. Registras gastos del día.
- **Tienda Tech / Taller** — Creas tickets de reparación (con foto si la mandas), buscas por cliente, cambias estado (Recibido → Diagnóstico → Esperando piezas → Reparando → Listo → Entregado), ves cotizaciones pendientes, productos con stock bajo, garantías vigentes.
- **Clínica / Salón / Veterinaria** — Ves citas del día o del siguiente, creas citas manualmente, cambias estado (Confirmada / Completada / No asistió / Cancelada), reagendas con notificación automática al cliente, cancelas un rango horario completo notificando a todos.
- **Tienda de ropa / Farmacia** — Actualizas precio o stock por nombre, ves productos con stock bajo, agregas productos nuevos.

---

## El panel web (PWA)

Si prefieres clickear en vez de chatear, hay un panel web. Y como es **Progressive Web App**, se instala en el celular como app nativa.

### Dashboard

- Métricas en tiempo real: órdenes del día, ingresos del mes, citas pendientes, tickets abiertos.
- Comparativos hoy vs ayer para identificar tendencias rápido.
- Gráfica de tendencias de los últimos 30 días.
- **Widget de ROI** — calcula cuántas horas y plata te ha ahorrado la automatización.
- Métricas del bot: conversaciones del mes, tasa de respuesta, uso de cuota.
- Checklist de onboarding paso a paso.

### Operación

- **Pedidos** — Lista con filtros por estado/fecha, detalle con ítems y totales, cambio de estado, historial.
- **Agenda de citas** — Vista por día/semana/mes, crear/editar/cancelar, asignación a profesionales, disponibilidad configurable, recordatorios automáticos.
- **Inventario** — Catálogo con foto/precio/stock/stock mínimo, alertas, importación desde **PDF, Excel o imagen**, movimientos.
- **Tickets de reparación** — Flujo completo con historial, fotos del equipo, cotizaciones vinculadas, garantías.

### CRM y marketing

- **Contactos** — Base de datos con historial de compras y citas, sistema de **puntos de lealtad**, segmentación por etiquetas/actividad/puntos, fecha de cumpleaños, opt-out por contacto.
- **Campañas WhatsApp** — Mensajes con variables (`{nombre}`), filtros (por etiquetas, por puntos mínimos, clientes sin comprar en N días, clientes activos en N días), preview de destinatarios antes de enviar, historial con métricas, plantillas aprobadas por Meta, opt-out obligatorio.

### Finanzas y equipo

- **Gastos** — Registro por categoría, comparativo ingresos vs gastos del mes.
- **Equipo** — Roles (owner / admin / staff), límites por plan (3 / 10 / ilimitado).
- **Compras y proveedores** — Órdenes de compra, registro de precios, comparación entre proveedores.
- **Reportes** — Reporte ejecutivo por email con gráficas, caja diaria, flujo de caja proyectado, **NPS**, reseñas.

### Configuración y presencia pública

- Información del negocio (nombre, industria, horarios, descripción).
- Slug personalizado para la URL pública.
- Configuración de sucursales.
- **Página pública** (`automatiza360-frontend.vercel.app/negocio/mi-negocio`) con logo, horarios, botón directo a WhatsApp, SEO optimizado.
- **Menú público** para restaurantes (`/menu/mi-negocio`).
- **Código QR** descargable para imprimir y poner en el mostrador.

---

## Automatizaciones que corren solas

### Al cliente

| Evento | Canal |
|--------|-------|
| Pedido listo para recoger | WhatsApp |
| Recordatorio de cita (24h antes) | WhatsApp |
| Reagendamiento de cita | WhatsApp |
| Cancelación de cita | WhatsApp |
| Felicitación de cumpleaños | Email |

### Al negocio

| Evento | Canal |
|--------|-------|
| Cliente solicita atención humana | Email + panel |
| Resumen semanal (lunes 8am) | Email |
| Stock bajo en producto | Panel |

### Ciclo de vida de suscripción

- Aviso de trial expirando (3 días y 1 día antes).
- Trial vencido → suspensión automática.
- Suscripción por vencer.
- Pago confirmado → activación + recibo por email.
- Cancelación → acceso hasta fin de período.

---

## Pagos

**Integración con Wompi (Colombia)**

- Checkout nativo para upgrade de plan.
- Verificación de integridad de transacciones.
- Activación automática al confirmar pago.
- Recibo por email.
- Soporte de reembolsos.

**Cupones de descuento**

- Tipo porcentaje o monto fijo.
- Fecha de vencimiento configurable.
- Validación en tiempo real por el bot.

---

## Para los técnicos

### API y automatizaciones avanzadas

- **API Keys** (plan Business) con hash seguro y prefijo visible (`a360_xxxx…`), registro de último uso, revocación inmediata.
- **Constructor visual de flujos** condicionales por evento del negocio, con historial de ejecuciones.

### Stack tecnológico

| Componente | Tecnología |
|------------|------------|
| Backend API | NestJS 11 + TypeScript |
| Base de datos | PostgreSQL (Supabase) + Prisma ORM |
| Frontend | React 18 + Vite + TanStack Query + Tailwind |
| Bot cliente | Python FastAPI + Google Gemini |
| Bot admin | Python FastAPI + Anthropic Claude |
| Infra | Railway (backend + AI) + Vercel (frontend) |
| PWA | Service Worker + Web Push |

### Integraciones activas

| Servicio | Uso |
|----------|-----|
| Twilio | WhatsApp (envío/recepción) |
| Google Gemini | Agente de atención al cliente |
| Anthropic Claude | Agente de administración |
| Groq Whisper | Transcripción de notas de voz |
| Resend | Emails transaccionales |
| Wompi | Pagos (Colombia) |
| Sentry | Monitoreo de errores |

### Seguridad

- Autenticación JWT con rotación de refresh tokens (30 días).
- Contraseñas con bcrypt.
- Aislamiento total por tenant (multi-tenancy estricto).
- Rate limiting en endpoints críticos.
- Validación de firma en webhooks (Twilio, Wompi).
- Opt-out obligatorio en campañas.
- Tokens de reset de contraseña expiran en 1 hora.
- Invalidación de sesiones al cambiar contraseña.

---

## Planes y precios

| Característica | Starter | Pro | Business |
|----------------|---------|-----|----------|
| Conversaciones / mes | 500 | 2.000 | Ilimitadas |
| Miembros del equipo | 3 | 10 | Ilimitados |
| Campañas WhatsApp | ❌ | ✅ | ✅ |
| API Keys | ❌ | ❌ | ✅ |
| Todas las industrias | ✅ | ✅ | ✅ |
| Precio mensual (COP) | $79.000 | $242.000 | $529.000 |

---

## Industrias soportadas

| Industria | Casos de uso principales |
|-----------|--------------------------|
| Restaurante / Panadería | Menú del día, pedidos, estados, pagos |
| Tienda Tech / Taller | Tickets de reparación, cotizaciones, inventario, garantías |
| Clínica / Consultorio | Citas, recordatorios, historial |
| Salón / Spa | Reservas por servicio y profesional |
| Veterinaria | Citas, fichas de mascotas, seguimiento |
| Gimnasio | Clases, reservas, membresías |
| Hotel | Reservas, check-in/out, servicios |
| Farmacia | Catálogo, stock, pedidos |
| Tienda de ropa | Catálogo, tallas, inventario, pedidos |
| Negocio general | Contactos, campañas, ventas, reportes |

---

## El pitch en una frase

> *"Es como contratar a un empleado que atiende WhatsApp 24/7, no se cansa, te manda el reporte del día, te avisa si alguien quiere quejarse con un humano, agenda citas, toma pedidos, cobra, manda recordatorios… y te cuesta menos que un salario mínimo al mes."*

El slogan oficial lo resume bien:

**"Automatiza360 — La herramienta que trabaja mientras tú descansas."**
