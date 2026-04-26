# Automatiza360 — Documento de Funcionalidad del Producto

> Versión 1.0 · Abril 2026

---

## ¿Qué es Automatiza360?

Automatiza360 es una plataforma SaaS multi-tenant diseñada para pequeñas y medianas empresas latinoamericanas. Permite gestionar las operaciones del negocio — ventas, citas, inventario, clientes, pagos y más — directamente desde WhatsApp, sin necesidad de aprender software nuevo.

El sistema opera en dos dimensiones simultáneas:

- **Para el cliente final**: un agente de inteligencia artificial atiende 24/7 por WhatsApp, responde preguntas, toma pedidos, agenda citas y procesa pagos.
- **Para el dueño y su equipo**: otro agente de IA permite gestionar el negocio completo desde WhatsApp, más un panel web para control avanzado.

---

## Industrias soportadas

Automatiza360 adapta su comportamiento según el tipo de negocio:

| Industria | Casos de uso principales |
|-----------|--------------------------|
| **Restaurante / Panadería** | Menú del día, pedidos, estados de órdenes, pagos |
| **Tienda Tech / Taller de reparación** | Tickets de reparación, cotizaciones, inventario, garantías |
| **Clínica / Consultorio** | Agendamiento de citas, recordatorios, historial |
| **Salón de belleza / Spa** | Reservas por servicio y profesional, turnos |
| **Veterinaria** | Citas, fichas de mascotas, seguimiento |
| **Gimnasio** | Clases, reservas, membresías |
| **Hotel** | Reservas, check-in/check-out, servicios |
| **Farmacia** | Catálogo, stock de medicamentos, pedidos |
| **Tienda de ropa** | Catálogo, tallas, inventario, pedidos |
| **Negocio general** | Contactos, campañas, ventas, reportes |

---

## Módulo 1 — Bot de atención al cliente (WhatsApp)

### ¿Cómo funciona?

Cuando un cliente escribe al número de WhatsApp del negocio, un agente de IA (Google Gemini) lo atiende automáticamente. El agente conoce el negocio, sus productos, precios, disponibilidad y políticas.

### Capacidades por industria

**Restaurante / Panadería**
- Presenta el menú del día con precios
- Toma pedidos completos (múltiples ítems, cantidades, método de pago)
- Consulta disponibilidad de platos
- Notifica cuando el pedido está listo para recoger o entrega

**Tienda Tech / Taller**
- Recibe equipos para reparación (registra nombre, teléfono, dispositivo, falla)
- Consulta el estado de un ticket de reparación
- Genera cotizaciones automáticas
- Notifica cuando el equipo está listo

**Clínica / Salón / Veterinaria**
- Muestra disponibilidad de horarios en tiempo real
- Agenda, modifica y cancela citas
- Envía recordatorios automáticos 24 horas antes
- Gestiona múltiples profesionales y servicios

**Tienda de ropa**
- Consulta de tallas disponibles
- Catálogo de productos con precios
- Pedidos y reservas de productos

### Funciones comunes (todas las industrias)

- **Notas de voz**: el bot transcribe automáticamente las notas de voz y las procesa como texto
- **Escalación humana**: si el cliente pide hablar con una persona, el bot lo notifica al equipo en tiempo real
- **Cupones de descuento**: el bot valida y aplica códigos de descuento
- **Programa de puntos**: informa al cliente sus puntos acumulados y cómo usarlos
- **Historial de conversación**: mantiene contexto entre mensajes de la misma sesión
- **Reinicio de sesión**: el cliente puede escribir "menu" o "reiniciar" para empezar de nuevo
- **Opt-out**: si el cliente escribe "STOP", se lo desuscribe de campañas automáticamente

---

## Módulo 2 — Bot de administración (WhatsApp)

### ¿Cómo funciona?

Cuando el dueño, administrador o empleado escribe al mismo número de WhatsApp, el sistema los detecta automáticamente y los conecta con un agente de IA diferente (Claude de Anthropic) que tiene acceso completo a la gestión del negocio.

### Capacidades generales (todos los negocios)

**Reportes**
- Resumen del día: ingresos, pedidos/citas, gastos, comparativo con ayer
- Resumen del mes: totales acumulados, tendencias
- Envío de gráficas por WhatsApp (imagen)
- Envío de reporte ejecutivo por correo electrónico

**Contactos**
- Buscar contacto por nombre o teléfono
- Ver los últimos 10 contactos
- Agregar contacto nuevo

**Campañas**
- Lanzar campaña masiva a todos los contactos (con confirmación previa)
- El bot pide confirmación antes de enviar para evitar errores

**Reseñas**
- Ver las últimas valoraciones de clientes con promedio de calificación

**Cupones**
- Ver cupones activos con código, descuento y fecha de vencimiento
- Crear nuevo cupón (porcentaje o monto fijo)

**Turnos del personal**
- Ver el horario del equipo para hoy o cualquier fecha

### Capacidades por industria

**Restaurante / Panadería**
- Cargar el menú del día en lenguaje natural: *"hoy hay bandeja paisa $18.000 y sancocho $15.000"*
- Ver órdenes pendientes
- Cambiar el estado de una orden (Confirmado → Preparando → Listo → Entregado)
- Al pasar a "Listo", el cliente recibe notificación automática por WhatsApp
- Registrar gastos del día

**Tienda Tech / Taller**
- Crear tickets de reparación (con foto adjunta si la manda)
- Buscar ticket por nombre de cliente
- Cambiar estado del ticket (Recibido → Diagnóstico → Esperando piezas → Reparando → Listo → Entregado)
- Ver cotizaciones pendientes de respuesta
- Ver productos con stock bajo
- Ver garantías vigentes de clientes

**Clínica / Salón / Veterinaria**
- Ver citas del día o del día siguiente
- Crear cita manualmente para un cliente
- Cambiar estado de una cita (Confirmada, Completada, No asistió, Cancelada)
- Reagendar una cita (notifica automáticamente al cliente)
- Cancelar citas en un rango horario y notificar a todos los afectados

**Tienda de ropa / Farmacia**
- Actualizar precio o stock de un producto por nombre
- Ver productos con stock bajo
- Agregar producto nuevo al catálogo

---

## Módulo 3 — Panel web

El panel web ofrece control avanzado para quienes prefieren una interfaz visual. Es una Progressive Web App (PWA) — puede instalarse en el celular como si fuera una app nativa.

### Dashboard

- **Métricas en tiempo real**: órdenes del día, ingresos del mes, citas pendientes, tickets abiertos
- **Comparativos**: hoy vs ayer para identificar tendencias rápidamente
- **Gráfica de tendencias**: evolución de ventas y citas en los últimos 30 días
- **Widget de ROI**: calcula automáticamente cuántas horas y dinero ha ahorrado el negocio con la automatización
- **Métricas del bot**: conversaciones del mes, tasa de respuesta, uso de cuota
- **Últimas actividades**: órdenes recientes, próximas citas
- **Checklist de onboarding**: guía paso a paso para configurar el negocio desde cero

### Gestión de pedidos / órdenes

- Lista de órdenes con filtros por estado y fecha
- Detalle de cada orden con ítems, totales y datos del cliente
- Cambio de estado manual
- Historial completo

### Gestión de citas (Agenda)

- Vista de citas por día, semana o mes
- Crear, editar y cancelar citas
- Asignación a profesionales específicos
- Configuración de disponibilidad por profesional y servicio
- Recordatorios automáticos por WhatsApp

### Inventario / Productos

- Catálogo con foto, precio, stock, stock mínimo
- Alertas de stock bajo
- Importación de inventario desde PDF, Excel o imagen
- Control de movimientos de stock

### Tickets de reparación

- Flujo completo de estados con historial
- Adjuntar fotos del equipo
- Cotizaciones vinculadas al ticket
- Gestión de garantías

### Contactos y CRM

- Base de datos de clientes con historial de compras y citas
- Sistema de puntos de lealtad (acumulación y canje)
- Segmentación por etiquetas, actividad y puntos
- Fecha de cumpleaños para campañas automáticas
- Opt-out de campañas por contacto

### Campañas de WhatsApp

- Redacción del mensaje con variables personalizadas (`{nombre}`)
- Filtros de segmentación:
  - Por etiquetas
  - Por puntos mínimos de lealtad
  - Clientes sin comprar en N días (reactivación)
  - Clientes activos en los últimos N días (fidelización)
- Preview del número de destinatarios antes de enviar
- Historial de campañas con métricas de envío
- Soporte para plantillas aprobadas por Meta (Content Templates)
- Todos los mensajes incluyen opción de opt-out ("Responde STOP")

### Gastos

- Registro de gastos del negocio por categoría
- Comparativo ingresos vs gastos del mes

### Equipo

- Gestión de usuarios (dueño, admin, staff)
- Asignación de roles y permisos
- Límites de equipo según plan (3 / 10 / ilimitado)

### Compras y proveedores

- Órdenes de compra a proveedores
- Registro de precios de compra
- Comparación de precios entre proveedores

### Reportes y análisis

- Reporte ejecutivo enviable por email con gráficas
- Caja diaria (ingresos vs gastos)
- Flujo de caja proyectado
- NPS (Net Promoter Score) de clientes
- Reseñas y valoraciones

### Configuración del negocio

- Información básica: nombre, industria, horarios, descripción
- Slug personalizado para página pública
- Configuración de sucursales

### Página pública del negocio

Cada negocio tiene una URL pública (`automatiza360-frontend.vercel.app/negocio/mi-negocio`) con:
- Logo, nombre, descripción e industria
- Horarios de atención
- Botón directo a WhatsApp
- SEO optimizado (meta tags, og:tags)

Adicionalmente, para restaurantes: menú público (`/menu/mi-negocio`) con platos y precios del día.

### Código QR

El panel genera automáticamente un código QR que enlaza a la página pública. El dueño puede descargarlo e imprimirlo para poner en el mostrador, menú o tarjeta de presentación.

---

## Módulo 4 — Automatizaciones y ciclo de vida

### Notificaciones automáticas al cliente

| Evento | Canal | Automático |
|--------|-------|-----------|
| Pedido listo para recoger | WhatsApp | ✅ |
| Recordatorio de cita (24h antes) | WhatsApp | ✅ |
| Reagendamiento de cita | WhatsApp | ✅ |
| Cancelación de cita | WhatsApp | ✅ |
| Felicitación de cumpleaños | Email | ✅ |

### Notificaciones automáticas al negocio

| Evento | Canal | Automático |
|--------|-------|-----------|
| Cliente solicita atención humana | Email + panel | ✅ |
| Resumen semanal (lunes 8am) | Email | ✅ |
| Stock bajo en producto | Panel | ✅ |

### Ciclo de vida de suscripción

- Aviso de trial expirando (3 días y 1 día antes) → Email
- Trial vencido → Suspensión automática + Email
- Suscripción por vencer → Email
- Pago confirmado → Activación + Recibo por email
- Cancelación → Acceso hasta fin de período

---

## Módulo 5 — Pagos

### Integración con Wompi (Colombia)

- Checkout nativo para upgrade de plan
- Verificación de integridad de transacciones
- Activación automática al confirmar pago
- Recibo de pago por email
- Soporte para reembolsos

### Cupones de descuento

- Tipos: porcentaje o monto fijo
- Fecha de vencimiento configurable
- Validación en tiempo real por el bot

---

## Módulo 6 — API y automatizaciones avanzadas

### API Keys (plan Business)

- Generación de claves API con hash seguro
- Prefijo visible para identificación (`a360_xxxx...`)
- Registro de último uso
- Revocación inmediata

### Automatizaciones (Flujos)

- Constructor visual de flujos por pasos
- Ejecución condicional basada en eventos del negocio
- Historial de ejecuciones

### Integraciones activas

| Servicio | Uso |
|----------|-----|
| **Twilio** | Envío y recepción de mensajes WhatsApp |
| **Google Gemini** | Agente de atención al cliente |
| **Anthropic Claude** | Agente de administración interno |
| **Groq Whisper** | Transcripción de notas de voz |
| **Resend** | Envío de emails transaccionales |
| **Wompi** | Procesamiento de pagos (Colombia) |
| **Sentry** | Monitoreo de errores en producción |

---

## Planes y límites

| Característica | Starter | Pro | Business |
|----------------|---------|-----|----------|
| Conversaciones/mes | 500 | 2.000 | Ilimitadas |
| Miembros del equipo | 3 | 10 | Ilimitados |
| API Keys | ❌ | ❌ | ✅ |
| Campañas WhatsApp | ❌ | ✅ | ✅ |
| Todas las industrias | ✅ | ✅ | ✅ |
| Precio mensual (COP) | $79.000 | $242.000 | $529.000 |

---

## Seguridad y cumplimiento

- Autenticación JWT con rotación de refresh tokens (30 días)
- Contraseñas hasheadas con bcrypt
- Aislamiento total de datos por tenant (multi-tenancy estricto)
- Rate limiting en endpoints críticos
- Validación de firma en webhooks de Twilio y Wompi
- Opt-out obligatorio en campañas ("Responde STOP")
- Tokens de restablecimiento de contraseña con expiración de 1 hora
- Invalidación de sesiones al cambiar contraseña

---

## Arquitectura técnica (resumen)

| Componente | Tecnología |
|------------|------------|
| Backend API | NestJS v11 + TypeScript |
| Base de datos | PostgreSQL (Supabase) + Prisma ORM |
| Frontend | React 18 + Vite + TanStack Query + Tailwind CSS |
| Bot cliente | Python FastAPI + Google Gemini |
| Bot admin | Python FastAPI + Anthropic Claude |
| Infraestructura | Railway (backend + AI) · Vercel (frontend) |
| PWA | Service Worker + Web Push Notifications |

---

*Automatiza360 · La herramienta que trabaja mientras tú descansas.*
