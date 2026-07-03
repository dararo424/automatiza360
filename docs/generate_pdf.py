"""Generate docs/manual-usuario.pdf using ReportLab."""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.platypus.flowables import Flowable

# ── PALETTE ──────────────────────────────────────
INDIGO     = colors.HexColor('#4F46E5')
INDIGO_LT  = colors.HexColor('#818CF8')
DARK       = colors.HexColor('#0F172A')
SLATE      = colors.HexColor('#1E293B')
TEXT       = colors.HexColor('#334155')
MUTED      = colors.HexColor('#64748B')
BORDER     = colors.HexColor('#E2E8F0')
GRAY_BG    = colors.HexColor('#F8FAFC')
CALLOUT_BG = colors.HexColor('#EFF6FF')
TIP_BG     = colors.HexColor('#F0FDF4')
WARN_BG    = colors.HexColor('#FFFBEB')
TERM_BG    = colors.HexColor('#1E293B')
TERM_FG    = colors.HexColor('#94A3B8')
WHITE      = colors.white

W, H = A4
PAGE_W = W - 4 * cm   # usable width with 2cm margins each side

# ── STYLES ───────────────────────────────────────
styles = getSampleStyleSheet()

def S(name, **kw):
    return ParagraphStyle(name, **kw)

sNormal = S('sNormal', fontName='Helvetica', fontSize=10, leading=15,
             textColor=TEXT, spaceAfter=4)
sBullet = S('sBullet', fontName='Helvetica', fontSize=10, leading=14,
             textColor=TEXT, leftIndent=14, bulletIndent=0, spaceAfter=3,
             bulletText='•')
sH1     = S('sH1', fontName='Helvetica-Bold', fontSize=13, leading=18,
             textColor=WHITE, spaceBefore=16, spaceAfter=6, backColor=INDIGO,
             leftPadding=8, rightPadding=8, topPadding=6, bottomPadding=6)
sH2     = S('sH2', fontName='Helvetica-Bold', fontSize=12, leading=16,
             textColor=DARK, spaceBefore=12, spaceAfter=4)
sH3     = S('sH3', fontName='Helvetica-Bold', fontSize=10.5, leading=14,
             textColor=INDIGO, spaceBefore=8, spaceAfter=3)
sTerm   = S('sTerm', fontName='Courier', fontSize=8.5, leading=13,
             textColor=TERM_FG, backColor=TERM_BG,
             leftPadding=8, rightPadding=8, topPadding=6, bottomPadding=6)
sCover  = S('sCover', fontName='Helvetica-Bold', fontSize=32, leading=36,
             textColor=INDIGO_LT, alignment=TA_CENTER)
sCoverT = S('sCoverT', fontName='Helvetica-Bold', fontSize=22, leading=28,
             textColor=DARK, alignment=TA_CENTER)
sCoverS = S('sCoverS', fontName='Helvetica', fontSize=13, leading=18,
             textColor=MUTED, alignment=TA_CENTER)
sTOCH   = S('sTOCH', fontName='Helvetica-Bold', fontSize=13, leading=18,
             textColor=DARK, spaceAfter=8)
sTOC    = S('sTOC', fontName='Helvetica', fontSize=10, leading=15,
             textColor=TEXT, leftIndent=0)

# ── HELPERS ──────────────────────────────────────
def sp(n=6):
    return Spacer(1, n)


def p(text, style=None):
    return Paragraph(text, style or sNormal)


def h1(text):
    return Paragraph(text, sH1)


def h2(text):
    return Paragraph(text, sH2)


def h3(text):
    return Paragraph(text, sH3)


def bullet(text):
    return Paragraph(f'• {text}', sBullet)


def numbered_list(items):
    elems = []
    for i, item in enumerate(items, 1):
        elems.append(Paragraph(f'<b>{i}.</b> {item}', sNormal))
    return elems


def term_box(lines):
    """Dark terminal-style box."""
    content = '<br/>'.join(lines)
    return Paragraph(content, sTerm)


def callout(icon, text, bg=CALLOUT_BG):
    data = [[Paragraph(icon, S('ci', fontName='Helvetica', fontSize=12, textColor=TEXT)),
             Paragraph(text, S('ct', fontName='Helvetica', fontSize=9, leading=13, textColor=TEXT))]]
    t = Table(data, colWidths=[1.2 * cm, PAGE_W - 1.2 * cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
    ]))
    return t


def simple_table(headers, rows, col_widths=None):
    data = [headers] + rows
    n_cols = len(headers)
    if col_widths is None:
        col_widths = [PAGE_W / n_cols] * n_cols

    hdr_style = S('th', fontName='Helvetica-Bold', fontSize=9, leading=12,
                  textColor=WHITE)
    cell_style = S('td', fontName='Helvetica', fontSize=9, leading=12,
                   textColor=TEXT)

    table_data = []
    for ri, row in enumerate(data):
        table_row = []
        for ci, val in enumerate(row):
            s = hdr_style if ri == 0 else cell_style
            table_row.append(Paragraph(str(val), s))
        table_data.append(table_row)

    t = Table(table_data, colWidths=col_widths, repeatRows=1)
    style = [
        ('BACKGROUND', (0, 0), (-1, 0), INDIGO),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('GRID', (0, 0), (-1, -1), 0.3, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]
    for ri in range(1, len(data)):
        if ri % 2 == 0:
            style.append(('BACKGROUND', (0, ri), (-1, ri), GRAY_BG))
    t.setStyle(TableStyle(style))
    return t


# ── DOCUMENT ─────────────────────────────────────
output_path = '/home/user/automatiza360/docs/manual-usuario.pdf'
os.makedirs(os.path.dirname(output_path), exist_ok=True)

doc = SimpleDocTemplate(
    output_path,
    pagesize=A4,
    leftMargin=2 * cm,
    rightMargin=2 * cm,
    topMargin=2 * cm,
    bottomMargin=2 * cm,
    title='Manual de Usuario — Automatiza360',
    author='Automatiza360',
)

story = []

# ── COVER ────────────────────────────────────────
story.append(Spacer(1, 2 * cm))
story.append(Paragraph('A360', sCover))
story.append(sp(12))
story.append(Paragraph('Manual de Usuario', sCoverT))
story.append(sp(8))
story.append(Paragraph('Automatiza360 — Gestiona tu negocio desde WhatsApp', sCoverS))
story.append(sp(6))
story.append(Paragraph('Versión 1.0  ·  Junio 2026  ·  automatiza360.com', sCoverS))
story.append(PageBreak())

# ── TABLE OF CONTENTS ────────────────────────────
story.append(Paragraph('Contenido', sTOCH))
toc_items = [
    '1.  Primeros pasos — Registro y configuración',
    '2.  Panel principal (Dashboard)',
    '3.  Bot de WhatsApp para clientes',
    '4.  Bot de administración (WhatsApp)',
    '5.  Gestión de pedidos y órdenes',
    '6.  Agenda y citas',
    '7.  Tickets de reparación',
    '8.  Productos e inventario',
    '9.  Contactos y programa de lealtad',
    '10. Campañas de WhatsApp',
    '11. Gastos y caja',
    '12. Equipo y usuarios',
    '13. Integraciones (Instagram DMs)',
    '14. Configuración del negocio',
    '15. Planes y facturación',
    '16. Preguntas frecuentes',
]
for item in toc_items:
    story.append(Paragraph(item, sTOC))
    story.append(sp(2))
story.append(PageBreak())

# ══════════════════════════════════════════════
# SECTION 1
# ══════════════════════════════════════════════
story += [
    h1('Sección 1 — Primeros pasos — Registro y configuración'), sp(),
    h2('1.1 Crear tu cuenta'),
    p('El proceso de registro toma menos de 3 minutos y no requiere tarjeta de crédito. Tienes <b>14 días de prueba gratuita</b>.'),
    sp(4),
] + numbered_list([
    'Ingresa a <b>automatiza360.com</b> y haz clic en "Crear cuenta gratis".',
    'Escribe el <b>nombre de tu negocio</b> y tu <b>nombre completo</b>.',
    'Selecciona la <b>industria</b> de tu negocio (restaurante, clínica, tienda, etc.).',
    'Ingresa tu <b>correo electrónico</b> y crea una <b>contraseña</b> segura.',
    'Acepta los términos y haz clic en "Crear mi negocio".',
]) + [
    sp(6),
    callout('ℹ', 'Recibirás un correo de bienvenida con los siguientes pasos para configurar tu bot de WhatsApp.'),
    sp(8),
    h2('1.2 Checklist de onboarding'),
    p('Al ingresar por primera vez verás una lista de tareas en tu panel principal:'),
    sp(4),
    simple_table(
        ['Paso', 'Descripción'],
        [
            ['Perfil del negocio', 'Nombre, descripción, horarios y dirección'],
            ['Agregar productos', 'Crea tu catálogo o menú inicial'],
            ['Invitar equipo', 'Agrega a tus empleados o socios'],
            ['Activar WhatsApp', 'Conecta tu número de WhatsApp Business'],
            ['Compartir enlace', 'Difunde tu página pública y código QR'],
        ],
        col_widths=[6 * cm, PAGE_W - 6 * cm]
    ),
    sp(8),
    h2('1.3 Tu página pública y código QR'),
    p('Automatiza360 crea automáticamente una <b>página pública</b> para tu negocio:'),
    sp(4),
    term_box(['https://automatiza360.com/negocio/tu-negocio']),
    sp(4),
    p('Esta página muestra tu información, horarios y un botón directo a WhatsApp. Desde el panel puedes <b>descargar tu código QR</b> para imprimir y poner en tu negocio.'),
]

# ══════════════════════════════════════════════
# SECTION 2
# ══════════════════════════════════════════════
story += [
    h1('Sección 2 — Panel principal (Dashboard)'), sp(),
    p('El dashboard es la pantalla principal de Automatiza360. Muestra un resumen en tiempo real del estado de tu negocio.'),
    sp(4),
    h2('2.1 Métricas del día'),
    bullet('Órdenes / Citas — Total del día vs. ayer.'),
    bullet('Ingresos del mes — Suma de todas las ventas no canceladas del mes en curso.'),
    bullet('Conversaciones — Clientes atendidos por el bot este mes vs. tu cuota del plan.'),
    bullet('Stock bajo — Productos por debajo del stock mínimo configurado.'),
    sp(4),
    h2('2.2 Gráfica de tendencias'),
    p('La gráfica muestra la evolución de ventas, citas e ingresos de los últimos 30 días.'),
    sp(4),
    h2('2.3 Widget de ROI'),
    p('Este widget calcula cuánto tiempo y dinero te ha ahorrado el bot este mes:'),
    bullet('Mensajes automatizados: total de respuestas enviadas por el bot'),
    bullet('Horas ahorradas: estimado en base a 3 minutos por mensaje'),
    bullet('Ahorro estimado: en pesos colombianos'),
    sp(4),
    h2('2.4 Últimas actividades'),
    p('Ver las últimas 5 órdenes y próximas citas sin tener que navegar a cada módulo.'),
]

# ══════════════════════════════════════════════
# SECTION 3
# ══════════════════════════════════════════════
story += [
    h1('Sección 3 — Bot de WhatsApp para clientes'), sp(),
    p('El bot de WhatsApp es tu empleado virtual disponible <b>24 horas, 7 días a la semana</b>. Atiende a tus clientes, toma pedidos, agenda citas y responde preguntas — todo de forma automática.'),
    sp(4),
    h2('3.1 ¿Qué puede hacer el bot?'),
    simple_table(
        ['Industria', 'Funciones principales'],
        [
            ['Restaurante / Panadería', 'Mostrar menú del día, tomar pedidos completos, confirmar pago'],
            ['Tienda Tech / Taller', 'Registrar equipos para reparación, consultar estado, cotizaciones'],
            ['Clínica / Consultorio', 'Ver disponibilidad, agendar citas, enviar recordatorios'],
            ['Salón / Spa / Veterinaria', 'Reservar por profesional y servicio, modificar citas'],
            ['Tienda de ropa', 'Consultar tallas, catálogo de productos, hacer pedidos'],
            ['Farmacia', 'Consultar disponibilidad de medicamentos, precios'],
        ],
        col_widths=[5.5 * cm, PAGE_W - 5.5 * cm]
    ),
    sp(4),
    h2('3.2 Funciones comunes (todos los negocios)'),
    bullet('Notas de voz: el bot transcribe y entiende los audios de los clientes'),
    bullet('Cupones de descuento: valida y aplica códigos automáticamente'),
    bullet('Puntos de lealtad: informa al cliente sus puntos acumulados'),
    bullet('Escalación humana: si el cliente pide un humano, te avisa en tiempo real'),
    bullet('Reinicio: el cliente escribe "menu" o "reiniciar" para empezar de nuevo'),
    sp(4),
    h2('3.3 Ejemplo de conversación (Restaurante)'),
    term_box([
        '👤 Cliente: hola, qué hay hoy?',
        '🤖 Bot: ¡Hola! Hoy tenemos:',
        '   • Bandeja paisa — $18.000',
        '   • Sancocho de gallina — $15.000',
        '   • Ajiaco — $16.000',
        '   ¿Qué te gustaría pedir? 😊',
        '',
        '👤 Cliente: una bandeja paisa por favor, pago con efectivo',
        '🤖 Bot: ✅ Pedido #47 confirmado. Te avisamos cuando esté listo.',
        '   Powered by Automatiza360 🤖',
    ]),
    sp(4),
    h2('3.4 Opt-out (desuscripción)'),
    p('Si un cliente no desea recibir más mensajes, puede escribir <b>STOP</b> en cualquier momento. El sistema lo registra automáticamente.'),
    sp(4),
    callout('ℹ', 'El bot responde en el mismo idioma y tono configurado para tu negocio. Puedes ajustar el nombre del bot y su tono (Formal / Amigable / Costeño) desde Configuración.'),
]

# ══════════════════════════════════════════════
# SECTION 4
# ══════════════════════════════════════════════
story += [
    h1('Sección 4 — Bot de administración (WhatsApp)'), sp(),
    p('El bot de administración te permite gestionar tu negocio <b>desde el mismo número de WhatsApp</b>, sin abrir ninguna app.'),
    sp(4),
    callout('💡', 'El sistema detecta automáticamente si quien escribe es dueño, admin o empleado, y activa el modo de administración. Tus clientes nunca ven estas conversaciones.', bg=TIP_BG),
    sp(4),
    h2('4.1 Comandos disponibles'),
    simple_table(
        ['Lo que escribes', 'Lo que hace el bot'],
        [
            ['"resumen del día"', 'Muestra ingresos, órdenes, citas y gastos de hoy'],
            ['"órdenes pendientes"', 'Lista las órdenes que faltan por preparar'],
            ['"citas de mañana"', 'Muestra el horario completo del día siguiente'],
            ['"gasté $45.000 en ingredientes"', 'Registra el gasto automáticamente'],
            ['"estado del ticket de Juan García"', 'Busca y muestra el ticket de reparación'],
            ['"cancelar citas de mañana desde las 2pm"', 'Cancela en rango y notifica a los pacientes'],
            ['"crear cupón 20% descuento"', 'Crea un código de descuento nuevo'],
        ],
        col_widths=[7 * cm, PAGE_W - 7 * cm]
    ),
    sp(4),
    h2('4.2 Cambiar estado de órdenes'),
    term_box([
        '👤 Dueño: orden 47 está lista',
        '🤖 Admin Bot: ✅ Orden #47 marcada como LISTA.',
        '   El cliente fue notificado por WhatsApp automáticamente.',
    ]),
]

# ══════════════════════════════════════════════
# SECTION 5
# ══════════════════════════════════════════════
story += [
    h1('Sección 5 — Gestión de pedidos y órdenes'), sp(),
    h2('5.1 Ver pedidos'),
    p('Ve a <b>Órdenes</b> en el menú lateral. Verás todos los pedidos ordenados por fecha, con filtros por estado:'),
    bullet('PENDIENTE — Pedido recibido, sin confirmar'),
    bullet('CONFIRMADO — Confirmado, en preparación'),
    bullet('PREPARANDO — En cocina o proceso'),
    bullet('LISTO — Listo para entrega/recogida'),
    bullet('ENTREGADO — Completado'),
    sp(4),
    h2('5.2 Cambiar estado'),
    p('Haz clic en cualquier orden y selecciona el nuevo estado. Al pasar a LISTO, el cliente recibe automáticamente un WhatsApp de notificación.'),
    sp(4),
    h2('5.3 Detalle de orden'),
    p('Cada orden muestra: lista de ítems, cantidades, total, método de pago, teléfono del cliente y historial de cambios de estado.'),
    sp(4),
    callout('⚠', 'Las órdenes canceladas no se eliminan — quedan en el historial para efectos contables.', bg=WARN_BG),
]

# ══════════════════════════════════════════════
# SECTION 6
# ══════════════════════════════════════════════
story += [
    h1('Sección 6 — Agenda y citas'), sp(),
    h2('6.1 Ver agenda'),
    p('Ve a <b>Agenda</b> en el menú. Puedes ver las citas en formato lista, día o semana, y filtrar por profesional o servicio.'),
    sp(4),
    h2('6.2 Crear cita manualmente'),
] + numbered_list([
    'Haz clic en el botón "Nueva cita" (esquina superior derecha).',
    'Selecciona el servicio y el profesional.',
    'Elige la fecha y hora disponible.',
    'Ingresa el nombre y teléfono del cliente.',
    'Guarda — el cliente recibe confirmación por WhatsApp.',
]) + [
    sp(4),
    h2('6.3 Recordatorios automáticos'),
    p('El sistema envía automáticamente un recordatorio por WhatsApp <b>24 horas antes</b> de cada cita. No necesitas hacer nada.'),
    sp(4),
    h2('6.4 Estados de citas'),
    simple_table(
        ['Estado', 'Significado'],
        [
            ['AGENDADA', 'Cita creada, pendiente de confirmación'],
            ['CONFIRMADA', 'Cliente confirmó asistencia'],
            ['COMPLETADA', 'Servicio realizado'],
            ['NO ASISTIÓ', 'Cliente no se presentó (no-show)'],
            ['CANCELADA', 'Cancelada por el negocio o el cliente'],
        ],
        col_widths=[5 * cm, PAGE_W - 5 * cm]
    ),
]

# ══════════════════════════════════════════════
# SECTION 7
# ══════════════════════════════════════════════
story += [
    h1('Sección 7 — Tickets de reparación'), sp(),
    p('Módulo diseñado para talleres y tiendas tech. Gestiona el flujo completo desde que el cliente deja el equipo hasta que lo recoge.'),
    sp(4),
    h2('7.1 Crear un ticket'),
] + numbered_list([
    'Ve a Tickets y haz clic en "Nuevo ticket".',
    'Ingresa datos del cliente (nombre, teléfono) y del equipo (dispositivo, falla reportada).',
    'Opcionalmente adjunta fotos del equipo.',
    'El ticket se crea con estado RECIBIDO y se le asigna un número único.',
]) + [
    sp(4),
    h2('7.2 Flujo de estados'),
    term_box(['RECIBIDO → DIAGNÓSTICO → ESPERANDO PIEZAS → REPARANDO → LISTO → ENTREGADO']),
    sp(4),
    h2('7.3 Garantías'),
    p('Al marcar un ticket como ENTREGADO, puedes definir el período de garantía. El sistema guarda las garantías vigentes y el bot puede consultarlas cuando el cliente regrese.'),
    sp(4),
    h2('7.4 Crear tickets desde WhatsApp'),
    term_box([
        '👤 "nuevo ticket: Juan García, cel 3001234567, Samsung S22, no enciende"',
        '🤖 "✅ Ticket #89 creado para Juan García — Samsung S22.',
        '   Si tienes foto del equipo, mándala y la adjunto."',
    ]),
]

# ══════════════════════════════════════════════
# SECTION 8
# ══════════════════════════════════════════════
story += [
    h1('Sección 8 — Productos e inventario'), sp(),
    h2('8.1 Agregar un producto'),
] + numbered_list([
    'Ve a Productos o Inventario.',
    'Haz clic en "Nuevo producto".',
    'Completa: nombre, precio, stock actual, stock mínimo y categoría.',
    'Sube una foto (opcional).',
    'Guarda — el producto ya está disponible para el bot.',
]) + [
    sp(4),
    h2('8.2 Alertas de stock bajo'),
    p('Cuando el stock cae por debajo del mínimo configurado, aparece una alerta en el dashboard.'),
    sp(4),
    h2('8.3 Importar inventario masivo'),
    p('Puedes importar tu catálogo completo desde:'),
    bullet('Archivo Excel (.xlsx)'),
    bullet('Archivo PDF con lista de productos'),
    bullet('Foto de una lista escrita o impresa'),
    p('El sistema usa inteligencia artificial para extraer los productos automáticamente.'),
    sp(4),
    h2('8.4 Menú del día (Restaurantes)'),
    p('Ve a <b>Menú del día</b> para publicar los platos disponibles hoy. El bot los mostrará automáticamente a los clientes que pregunten.'),
]

# ══════════════════════════════════════════════
# SECTION 9
# ══════════════════════════════════════════════
story += [
    h1('Sección 9 — Contactos y programa de lealtad'), sp(),
    h2('9.1 Base de contactos'),
    p('Todos los clientes que han interactuado con tu bot se guardan automáticamente como contactos.'),
    sp(4),
    h2('9.2 Programa de puntos'),
    p('Cada compra acumula puntos automáticamente (1 punto por cada $10.000 COP):'),
    simple_table(
        ['Acción', 'Puntos'],
        [
            ['Compra de $10.000', '+1 punto'],
            ['Compra de $100.000', '+10 puntos'],
            ['Canje de puntos', 'Se descuentan del total'],
        ],
        col_widths=[8 * cm, PAGE_W - 8 * cm]
    ),
    sp(4),
    h2('9.3 Segmentación por etiquetas'),
    p('Puedes asignar etiquetas a tus contactos (VIP, frecuente, nuevo) y usar esas etiquetas para enviar campañas segmentadas.'),
    sp(4),
    h2('9.4 Fecha de cumpleaños'),
    p('Al agregar la fecha de cumpleaños de un contacto, el sistema envía automáticamente un mensaje de felicitación el día de su cumpleaños.'),
]

# ══════════════════════════════════════════════
# SECTION 10
# ══════════════════════════════════════════════
story += [
    h1('Sección 10 — Campañas de WhatsApp'), sp(),
    callout('ℹ', 'Las campañas de WhatsApp están disponibles en los planes Pro y Business.'),
    sp(4),
    h2('10.1 Crear una campaña'),
] + numbered_list([
    'Ve a Campañas y haz clic en "Nueva campaña".',
    'Escribe el mensaje. Usa {nombre} para personalizar con el nombre del cliente.',
    'Define los filtros de segmentación (opcional).',
    'Haz clic en "Ver destinatarios" para confirmar cuántos recibirán el mensaje.',
    'Haz clic en "Enviar campaña".',
]) + [
    sp(4),
    h2('10.2 Filtros de segmentación'),
    simple_table(
        ['Filtro', 'Uso'],
        [
            ['Por etiquetas', 'Solo contactos con etiqueta específica'],
            ['Sin compras en N días', 'Reactivar clientes inactivos'],
            ['Compras recientes', 'Premiar a clientes frecuentes'],
            ['Puntos mínimos', 'Campañas exclusivas para clientes VIP'],
        ],
        col_widths=[6 * cm, PAGE_W - 6 * cm]
    ),
    sp(4),
    h2('10.3 Ejemplo de mensaje'),
    term_box([
        '¡Hola {nombre}! 👋 Este fin de semana tenemos 20% de descuento.',
        'Usa el código FINDE20 al agendar tu cita.',
        '¡Te esperamos! 😊',
        '',
        'Responde STOP para no recibir más mensajes.',
    ]),
    sp(4),
    h2('10.4 Cupones de descuento'),
    bullet('Tipo: porcentaje (%) o monto fijo ($)'),
    bullet('Fecha de vencimiento'),
    bullet('Código personalizado'),
]

# ══════════════════════════════════════════════
# SECTION 11
# ══════════════════════════════════════════════
story += [
    h1('Sección 11 — Gastos y caja'), sp(),
    h2('11.1 Registrar gastos'),
    p('Ve a <b>Gastos</b> para registrar los costos del negocio. Puedes categorizarlos (insumos, servicios, nómina, etc.) y ver el comparativo ingresos vs. gastos del mes.'),
    sp(4),
    h2('11.2 Registrar desde WhatsApp'),
    term_box([
        '👤 "gasté $80.000 en ingredientes para la cocina"',
        '🤖 "✅ Gasto de $80.000 registrado en categoría Insumos."',
    ]),
    sp(4),
    h2('11.3 Módulo de caja'),
    p('El módulo de Caja muestra el flujo de dinero del día: cuánto entró (ventas) y cuánto salió (gastos), con el saldo neto.'),
]

# ══════════════════════════════════════════════
# SECTION 12
# ══════════════════════════════════════════════
story += [
    h1('Sección 12 — Equipo y usuarios'), sp(),
    h2('12.1 Roles disponibles'),
    simple_table(
        ['Rol', 'Permisos'],
        [
            ['Dueño (Owner)', 'Acceso total, configuración, facturación'],
            ['Admin', 'Gestión completa excepto facturación'],
            ['Staff', 'Operación diaria, sin configuración'],
        ],
        col_widths=[5 * cm, PAGE_W - 5 * cm]
    ),
    h2('12.2 Invitar un miembro'),
] + numbered_list([
    'Ve a Equipo y haz clic en "Invitar miembro".',
    'Ingresa el correo electrónico y selecciona el rol.',
    'La persona recibirá un correo de invitación para crear su cuenta.',
]) + [
    sp(4),
    h2('12.3 Límites por plan'),
    simple_table(
        ['Plan', 'Máximo de miembros'],
        [
            ['Starter', '3 miembros'],
            ['Pro', '10 miembros'],
            ['Business', 'Ilimitados'],
        ],
        col_widths=[6 * cm, PAGE_W - 6 * cm]
    ),
    h2('12.4 Turnos del personal'),
    p('Ve a <b>Turnos</b> para gestionar los horarios de tu equipo. El bot de admin puede consultarlos escribiendo "turnos de hoy".'),
]

# ══════════════════════════════════════════════
# SECTION 13
# ══════════════════════════════════════════════
story += [
    h1('Sección 13 — Integraciones — Instagram DMs'), sp(),
    p('Conecta tu cuenta de Instagram Business para que el bot responda automáticamente los mensajes directos (DMs) de tus seguidores — exactamente igual que WhatsApp.'),
    sp(4),
    h2('13.1 Requisitos previos'),
    bullet('Cuenta de Instagram Business (no cuenta personal)'),
    bullet('La cuenta de Instagram debe estar vinculada a una Página de Facebook'),
    sp(4),
    callout('ℹ', 'Si tienes una cuenta personal de Instagram, puedes convertirla a Business gratis desde: Configuración → Cuenta → Cambiar a cuenta profesional.'),
    sp(4),
    h2('13.2 Conectar Instagram'),
] + numbered_list([
    'Ve a Configuración en el menú lateral.',
    'Busca la sección "Instagram DMs".',
    'Haz clic en el botón "Conectar Instagram →".',
    'Se abrirá una ventana de Meta — inicia sesión con tu cuenta de Facebook.',
    'Selecciona los permisos y haz clic en "Continuar".',
    'Regresarás al panel con la confirmación "✅ Instagram conectado exitosamente".',
]) + [
    sp(4),
    h2('13.3 Qué pasa después'),
    p('Una vez conectado, el bot responderá todos los DMs nuevos que lleguen a tu Instagram con las mismas capacidades que el bot de WhatsApp.'),
    sp(4),
    h2('13.4 Desconectar Instagram'),
    p('En cualquier momento puedes desconectar tu Instagram desde la misma sección de Configuración.'),
]

# ══════════════════════════════════════════════
# SECTION 14
# ══════════════════════════════════════════════
story += [
    h1('Sección 14 — Configuración del negocio'), sp(),
    h2('14.1 Información básica'),
    bullet('Nombre del negocio y descripción'),
    bullet('Horarios de atención'),
    bullet('Dirección y ciudad'),
    bullet('Logo (foto de perfil)'),
    sp(4),
    h2('14.2 Personalizar el bot'),
    simple_table(
        ['Opción', 'Descripción'],
        [
            ['Nombre del bot', 'Cómo se presenta el asistente (ej: "Soy Sofía, tu asistente...")'],
            ['Tono Formal', 'Profesional y respetuoso, ideal para clínicas y servicios'],
            ['Tono Amigable', 'Cercano y cálido, recomendado para la mayoría'],
            ['Tono Costeño', 'Descomplicado y alegre, ideal para negocios del Caribe'],
        ],
        col_widths=[4.5 * cm, PAGE_W - 4.5 * cm]
    ),
    h2('14.3 Sucursales'),
    p('Si tienes varias ubicaciones, ve a <b>Sucursales</b> para registrarlas. Cada sucursal puede tener su propio horario y dirección.'),
    sp(4),
    h2('14.4 Recuperar contraseña'),
    p('Si olvidaste tu contraseña, haz clic en "¿Olvidaste tu contraseña?" en la pantalla de inicio. Recibirás un correo con un enlace válido por 1 hora.'),
]

# ══════════════════════════════════════════════
# SECTION 15
# ══════════════════════════════════════════════
story += [
    h1('Sección 15 — Planes y facturación'), sp(),
    h2('15.1 Planes disponibles'),
    simple_table(
        ['Plan', 'Precio mensual', 'Conversaciones', 'Equipo', 'Campañas'],
        [
            ['Starter', '$79.000 COP', '500/mes', '3 personas', 'No'],
            ['Pro', '$242.000 COP', '2.000/mes', '10 personas', 'Sí'],
            ['Business', '$529.000 COP', 'Ilimitadas', 'Ilimitado', 'Sí'],
        ],
        col_widths=[3.5*cm, 3.5*cm, 3.5*cm, 3.5*cm, PAGE_W - 14*cm]
    ),
    sp(4),
    h2('15.2 Actualizar tu plan'),
] + numbered_list([
    'Ve a Mi Plan en el menú lateral.',
    'Selecciona el plan al que deseas pasar.',
    'Completa el pago con tu tarjeta (procesado por Wompi — 100% seguro).',
    'Tu plan se activa inmediatamente y recibes el recibo por correo.',
]) + [
    sp(4),
    h2('15.3 Período de prueba'),
    p('Todos los negocios nuevos tienen <b>14 días de prueba gratuita</b> con acceso completo al plan Pro. No se requiere tarjeta de crédito.'),
    sp(4),
    h2('15.4 Reembolsos'),
    p('Si tienes problemas con un pago, contacta a soporte en <b>soporteautomatiza360@rgytgroup.com</b> dentro de los primeros 7 días del cobro.'),
]

# ══════════════════════════════════════════════
# SECTION 16
# ══════════════════════════════════════════════
story += [h1('Sección 16 — Preguntas frecuentes'), sp()]

faq = [
    ('¿Necesito un número de WhatsApp nuevo?',
     'El equipo de Automatiza360 te asigna un número de WhatsApp Business. Si ya tienes uno aprobado por Meta, también se puede usar.'),
    ('¿El bot funciona las 24 horas?',
     'Sí. El bot nunca descansa. Atiende a tus clientes en cualquier horario, incluso domingos y festivos.'),
    ('¿Los clientes saben que están hablando con un bot?',
     'Los mensajes incluyen "Powered by Automatiza360 🤖" al final. Puedes ajustar el nombre del bot para que se sienta más personal.'),
    ('¿Puedo seguir respondiendo manualmente?',
     'Sí. En la sección Conversaciones puedes ver todos los chats y responder directamente si lo prefieres.'),
    ('¿Qué pasa si se me acaba la cuota de conversaciones?',
     'El bot le informa al cliente que el negocio ha alcanzado su límite del mes y lo invita a contactar en el próximo mes.'),
    ('¿Mis datos están seguros?',
     'Sí. Cada negocio tiene sus datos completamente aislados. Usamos cifrado, contraseñas hasheadas y conexiones seguras (HTTPS). Cumplimos con la Ley 1581 de Protección de Datos de Colombia.'),
    ('¿Cómo contacto a soporte?',
     'Escríbenos a soporteautomatiza360@rgytgroup.com o abre un ticket desde el panel en la sección Soporte. Tiempo de respuesta: máximo 24 horas hábiles.'),
]
for q, a in faq:
    story.append(h3(q))
    story.append(p(a))
    story.append(sp(4))

# ── FOOTER ───────────────────────────────────────
story.append(PageBreak())
story += [
    Spacer(1, 1.5 * cm),
    Paragraph('<b><font color="#4F46E5">Automatiza360</font></b>', S('f1',
        fontName='Helvetica-Bold', fontSize=14, alignment=TA_CENTER)),
    sp(4),
    Paragraph('Manual de Usuario v1.0  ·  Junio 2026', S('f2',
        fontName='Helvetica', fontSize=10, textColor=MUTED, alignment=TA_CENTER)),
    sp(4),
    Paragraph('¿Tienes dudas? Escríbenos a <b>soporteautomatiza360@rgytgroup.com</b>', S('f3',
        fontName='Helvetica', fontSize=10, textColor=MUTED, alignment=TA_CENTER)),
    sp(4),
    Paragraph('© 2026 Automatiza360. Todos los derechos reservados.', S('f4',
        fontName='Helvetica', fontSize=9, textColor=MUTED, alignment=TA_CENTER)),
]

# Build PDF
doc.build(story)
print(f'✅ manual-usuario.pdf created successfully at {output_path}')
