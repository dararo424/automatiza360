"""Genera docs/manual-usuario.pdf v2.0 — información completa + manual paso a paso.

Identidad "Selva Eléctrica": tinta #101B10, lima #C9F24B, selva #2C7229, hueso #F4F2EA.
"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
)

# ── PALETA (Selva Eléctrica) ─────────────────────
INK      = colors.HexColor('#101B10')
LIMA     = colors.HexColor('#C9F24B')
SELVA    = colors.HexColor('#2C7229')
SELVA_DK = colors.HexColor('#1D481F')
TEXT     = colors.HexColor('#22301F')
MUTED    = colors.HexColor('#6F6E5E')
BORDER   = colors.HexColor('#DCD9CD')
BONE     = colors.HexColor('#F4F2EA')
BONE_SF  = colors.HexColor('#FAF9F4')
CALLOUT  = colors.HexColor('#EEFBC8')
WARN_BG  = colors.HexColor('#FFFBEB')
TERM_FG  = colors.HexColor('#C9F24B')
WHITE    = colors.white

W, H = A4
PAGE_W = W - 4 * cm

def S(name, **kw):
    return ParagraphStyle(name, **kw)

sNormal = S('n',  fontName='Helvetica', fontSize=10, leading=15, textColor=TEXT, spaceAfter=4)
sBullet = S('b',  fontName='Helvetica', fontSize=10, leading=14, textColor=TEXT, leftIndent=14, spaceAfter=3)
sH1     = S('h1', fontName='Helvetica-Bold', fontSize=13, leading=18, textColor=WHITE,
            spaceBefore=16, spaceAfter=6, backColor=INK,
            leftPadding=10, rightPadding=8, topPadding=7, bottomPadding=7)
sH2     = S('h2', fontName='Helvetica-Bold', fontSize=11.5, leading=16, textColor=INK, spaceBefore=12, spaceAfter=4)
sH3     = S('h3', fontName='Helvetica-Bold', fontSize=10.5, leading=14, textColor=SELVA, spaceBefore=8, spaceAfter=3)
sTerm   = S('t',  fontName='Courier', fontSize=8.5, leading=13, textColor=TERM_FG, backColor=INK,
            leftPadding=10, rightPadding=8, topPadding=7, bottomPadding=7)
sMono   = S('m',  fontName='Courier', fontSize=8, leading=11, textColor=MUTED)

def sp(n=6): return Spacer(1, n)
def p(text, style=None): return Paragraph(text, style or sNormal)
def h1(text): return Paragraph(text, sH1)
def h2(text): return Paragraph(text, sH2)
def h3(text): return Paragraph(text, sH3)
def bullet(text): return Paragraph(f'•&nbsp;&nbsp;{text}', sBullet)

def steps(items):
    out = []
    for i, item in enumerate(items, 1):
        out.append(Paragraph(f'<b><font color="#2C7229">{i}.</font></b>&nbsp;&nbsp;{item}', sNormal))
    return out

def term(lines):
    return Paragraph('<br/>'.join(lines), sTerm)

def callout(text, bg=CALLOUT):
    t = Table([[Paragraph(text, S('c', fontName='Helvetica', fontSize=9, leading=13, textColor=TEXT))]],
              colWidths=[PAGE_W])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LINEBEFORE', (0, 0), (0, -1), 3, SELVA),
    ]))
    return t

def table(headers, rows, widths=None):
    hdr = S('th', fontName='Helvetica-Bold', fontSize=9, leading=12, textColor=WHITE)
    cell = S('td', fontName='Helvetica', fontSize=9, leading=12, textColor=TEXT)
    data = [[Paragraph(str(x), hdr) for x in headers]] + [
        [Paragraph(str(x), cell) for x in row] for row in rows
    ]
    t = Table(data, colWidths=widths or [PAGE_W / len(headers)] * len(headers), repeatRows=1)
    style = [
        ('BACKGROUND', (0, 0), (-1, 0), INK),
        ('GRID', (0, 0), (-1, -1), 0.3, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]
    for ri in range(2, len(data), 2):
        style.append(('BACKGROUND', (0, ri), (-1, ri), BONE_SF))
    t.setStyle(TableStyle(style))
    return t


out_path = '/home/user/automatiza360/docs/manual-usuario.pdf'
doc = SimpleDocTemplate(
    out_path, pagesize=A4,
    leftMargin=2 * cm, rightMargin=2 * cm, topMargin=2 * cm, bottomMargin=2 * cm,
    title='Automatiza360 — Información del producto y Manual de Usuario v2.0',
    author='Automatiza360',
)

story = []

# ══ PORTADA ══════════════════════════════════════
story += [
    Spacer(1, 2.2 * cm),
    Paragraph('automatiza<font color="#2C7229">360°</font>',
              S('cv', fontName='Helvetica-Bold', fontSize=34, leading=40, textColor=INK, alignment=TA_CENTER)),
    sp(14),
    Paragraph('Información del producto y<br/>Manual de Usuario paso a paso',
              S('cv2', fontName='Helvetica-Bold', fontSize=20, leading=26, textColor=TEXT, alignment=TA_CENTER)),
    sp(10),
    Paragraph('Tu negocio, atendido 24/7 desde WhatsApp e Instagram',
              S('cv3', fontName='Helvetica', fontSize=12, leading=16, textColor=MUTED, alignment=TA_CENTER)),
    sp(8),
    Paragraph('Versión 2.0 · Julio 2026 · automatiza360.com',
              S('cv4', fontName='Courier', fontSize=9, textColor=MUTED, alignment=TA_CENTER)),
    PageBreak(),
]

# ══ ÍNDICE ═══════════════════════════════════════
story.append(Paragraph('Contenido', S('toch', fontName='Helvetica-Bold', fontSize=14, textColor=INK, spaceAfter=10)))
TOC = [
    'PARTE I — EL PRODUCTO',
    '1. ¿Qué es Automatiza360?',
    '2. Qué puede hacer por tu negocio (por industria)',
    '3. Planes y precios (mensual y anual)',
    '',
    'PARTE II — MANUAL PASO A PASO',
    '4. Prueba el bot antes de registrarte (demo)',
    '5. Crear tu cuenta y primeros pasos',
    '6. El panel principal (Dashboard) y los datos de ejemplo',
    '7. El bot de WhatsApp para tus clientes',
    '8. El bot de administración (gestiona por WhatsApp)',
    '9. Órdenes y pedidos',
    '10. Agenda y citas',
    '11. Tickets de reparación y garantías',
    '12. Productos, inventario y menú del día',
    '13. Contactos, lealtad y exportación de datos',
    '14. Campañas de WhatsApp y cupones',
    '15. Gastos, caja y finanzas',
    '16. Equipo, roles y turnos',
    '17. Conectar Instagram (respuestas automáticas en DMs)',
    '18. Configuración del negocio y del bot',
    '19. Pagos, plan anual y facturación',
    '20. Privacidad, seguridad y marco legal',
    '21. Preguntas frecuentes',
]
for item in TOC:
    if item == '':
        story.append(sp(6))
    elif item.startswith('PARTE'):
        story.append(Paragraph(item, S('tp', fontName='Courier-Bold', fontSize=9, textColor=SELVA, spaceBefore=6, spaceAfter=4)))
    else:
        story.append(Paragraph(item, S('ti', fontName='Helvetica', fontSize=10, leading=15, textColor=TEXT)))
story.append(PageBreak())

# ══════════ PARTE I ══════════
story += [
    h1('1. ¿Qué es Automatiza360?'), sp(),
    p('Automatiza360 es una plataforma todo-en-uno que le da a tu negocio un <b>empleado virtual '
      'disponible 24/7</b>: un asistente con inteligencia artificial que atiende a tus clientes por '
      '<b>WhatsApp e Instagram</b> — toma pedidos, agenda citas, responde preguntas, registra tickets '
      'de reparación y aplica descuentos — mientras tú ves todo en un panel web y recibes reportes.'),
    sp(4),
    p('Además del bot para clientes, incluye un <b>bot de administración</b>: tú mismo gestionas el '
      'negocio escribiéndole por WhatsApp ("resumen del día", "gasté $45.000 en insumos", "cancela '
      'las citas de mañana") sin abrir ninguna aplicación.'),
    sp(4),
    h2('Lo que incluye la plataforma'),
    table(['Área', 'Funcionalidades'], [
        ['Atención automática', 'Bot IA por WhatsApp e Instagram, notas de voz, escalación a humano, opt-out (STOP)'],
        ['Operación', 'Órdenes, agenda de citas con recordatorios, tickets de reparación, garantías, menú del día'],
        ['Inventario', 'Productos con alertas de stock bajo, importación masiva por Excel/PDF/foto con IA'],
        ['Clientes', 'CRM de contactos, puntos de lealtad, cumpleaños automáticos, NPS, reseñas'],
        ['Marketing', 'Campañas segmentadas de WhatsApp, cupones, flujos automatizados, referidos'],
        ['Finanzas', 'Gastos, caja diaria, comparativo ingresos vs. gastos, exportación CSV'],
        ['Gestión', 'Equipo con roles, turnos, multi-sucursal, página pública con QR, PWA instalable'],
    ], widths=[4 * cm, PAGE_W - 4 * cm]),
    sp(4),
    callout('<b>Widget de ROI:</b> el dashboard te muestra cada mes cuántos mensajes respondió el bot, '
            'cuántas horas te ahorró y cuánto dinero representa ese ahorro en pesos colombianos.'),

    h1('2. Qué puede hacer por tu negocio (por industria)'), sp(),
    p('El bot se adapta automáticamente al tipo de negocio que elijas al registrarte:'),
    sp(4),
    table(['Industria', 'Lo que hace el bot'], [
        ['Restaurante / Panadería', 'Muestra el menú del día, toma pedidos completos con método de pago, confirma y notifica'],
        ['Tienda Tech / Taller', 'Registra equipos para reparación, informa el estado del ticket, genera cotizaciones'],
        ['Clínica / Consultorio', 'Consulta disponibilidad, agenda citas, envía recordatorios 24 h antes'],
        ['Salón / Spa / Barbería', 'Reserva por profesional y servicio, reagenda y cancela citas'],
        ['Tienda de ropa', 'Recomienda tallas según medidas, muestra catálogo, toma pedidos'],
        ['Farmacia', 'Consulta disponibilidad y precios de productos, toma pedidos'],
        ['Veterinaria', 'Agenda citas y lleva historial por mascota'],
        ['Gimnasio', 'Vende membresías y agenda clases'],
        ['Hotel', 'Gestiona reservas'],
    ], widths=[4.5 * cm, PAGE_W - 4.5 * cm]),

    h1('3. Planes y precios'), sp(),
    table(['Plan', 'Mensual', 'Anual (2 meses gratis)', 'Conversaciones', 'Equipo'], [
        ['Starter', '$79.000 COP', '$790.000 COP/año', '500/mes', '1 agente'],
        ['Pro ★', '$242.000 COP', '$2.420.000 COP/año', '2.000/mes', '3 agentes'],
        ['Business', '$529.000 COP', '$5.290.000 COP/año', 'Ilimitadas', 'Ilimitado'],
    ], widths=[2.6 * cm, 3.2 * cm, 4.4 * cm, 3.4 * cm, PAGE_W - 13.6 * cm]),
    sp(4),
    bullet('<b>Prueba gratis de 14 días</b> con acceso completo — sin tarjeta de crédito.'),
    bullet('<b>Plan anual:</b> pagas 10 meses y recibes 12 (ahorras el valor de 2 mensualidades).'),
    bullet('Pagos procesados en COP por <b>Wompi (Bancolombia)</b>; nunca almacenamos tu tarjeta.'),
    bullet('Reembolsos dentro de los primeros 7 días del cobro escribiendo a soporte.'),
    PageBreak(),
]

# ══════════ PARTE II ══════════
story += [
    h1('4. Prueba el bot antes de registrarte (demo)'), sp(),
    p('¿Quieres ver el bot en acción sin crear cuenta? Entra a <b>automatiza360.com/demo</b>:'),
] + steps([
    'Abre <b>/demo</b> desde el enlace "Chatea con un bot de ejemplo" en la pantalla de inicio de sesión.',
    'Conversa con el bot del restaurante ficticio "La Cocina de Marta" tocando las respuestas sugeridas.',
    'Pide el menú, haz un pedido, pregunta por tus puntos — verás exactamente lo que viven tus clientes.',
    'Al final, toca "Crear mi bot gratis" para empezar tu prueba de 14 días.',
]) + [

    h1('5. Crear tu cuenta y primeros pasos'), sp(),
    h2('5.1 Registro (menos de 3 minutos)'),
] + steps([
    'Entra a <b>automatiza360.com</b> y haz clic en "Crear cuenta gratis".',
    'Escribe el nombre de tu negocio y tu nombre completo.',
    'Selecciona tu <b>industria</b> — esto configura el bot y los módulos que verás.',
    'Ingresa tu correo, crea una contraseña y acepta los términos y la política de privacidad (puedes leerlos en /terminos y /privacidad).',
    'Haz clic en "Crear mi negocio". El sistema aprovisiona tu número de WhatsApp automáticamente.',
]) + [
    sp(4),
    callout('Recibirás un correo de bienvenida con las instrucciones para activar WhatsApp. En modo '
            'producción se te asigna un número; el equipo de Automatiza360 te acompaña en la aprobación de Meta.'),
    sp(4),
    h2('5.2 Checklist de onboarding'),
    p('Al entrar por primera vez verás una lista de tareas guiada:'),
    table(['Paso', 'Qué hacer'], [
        ['Perfil del negocio', 'Completa descripción, horarios, dirección y logo'],
        ['Agregar productos', 'Crea tu catálogo, menú o servicios'],
        ['Invitar equipo', 'Agrega empleados o socios con su rol'],
        ['Activar WhatsApp', 'Sigue las instrucciones del correo de bienvenida'],
        ['Compartir enlace', 'Descarga tu código QR y compártelo'],
    ], widths=[4.5 * cm, PAGE_W - 4.5 * cm]),
    sp(4),
    h2('5.3 Tu página pública y código QR'),
    p('Automatiza360 crea una página pública para tu negocio en:'),
    term(['https://automatiza360.com/negocio/tu-negocio']),
    sp(3),
    p('Desde el dashboard puedes <b>copiar el enlace</b> y <b>descargar el código QR</b> para imprimirlo '
      'en tu mostrador, menú o tarjetas. Quien lo escanee llega directo a tu WhatsApp.'),

    h1('6. El panel principal (Dashboard) y los datos de ejemplo'), sp(),
    h2('6.1 Datos de ejemplo'),
    p('Tu cuenta nueva incluye <b>datos de muestra</b> (órdenes, un contacto, una conversación y citas o '
      'tickets según tu industria) para que veas la plataforma funcionando desde el primer minuto. '
      'Un banner en el dashboard te lo indica:'),
] + steps([
    'Explora las órdenes, citas o tickets de ejemplo para familiarizarte con cada módulo.',
    'Cuando quieras empezar de cero, toca <b>"Eliminar ejemplos"</b> en el banner del dashboard.',
    'Todos los registros de muestra desaparecen al instante; tus datos reales no se tocan.',
]) + [
    sp(4),
    h2('6.2 Métricas en tiempo real'),
    bullet('<b>Órdenes/Citas de hoy</b> comparadas con ayer (flecha de tendencia).'),
    bullet('<b>Ingresos del mes</b>: suma de ventas no canceladas.'),
    bullet('<b>Conversaciones del mes</b> vs. la cuota de tu plan.'),
    bullet('<b>Stock bajo</b>: productos por debajo del mínimo.'),
    sp(3),
    h2('6.3 Widget de ROI'),
    p('La tarjeta oscura "Automatiza360 este mes" muestra: mensajes automatizados, horas ahorradas '
      '(3 min por mensaje), ahorro estimado en COP y órdenes tomadas por el bot.'),
    sp(3),
    h2('6.4 Gráfica de tendencias y actividad reciente'),
    p('Evolución de ventas, citas e ingresos de los últimos 30 días, y las últimas órdenes/citas sin salir del dashboard.'),

    h1('7. El bot de WhatsApp para tus clientes'), sp(),
    p('Es tu empleado estrella: atiende cualquier hora, todos los días. Funciones en todos los negocios:'),
    bullet('<b>Notas de voz:</b> transcribe y entiende los audios de tus clientes.'),
    bullet('<b>Cupones:</b> valida y aplica códigos de descuento automáticamente.'),
    bullet('<b>Puntos de lealtad:</b> informa el saldo y permite canjearlos.'),
    bullet('<b>Escalación humana:</b> si piden hablar con una persona, te llega una alerta al instante.'),
    bullet('<b>Opt-out:</b> si un cliente escribe STOP, queda excluido de campañas (cumplimiento legal).'),
    sp(4),
    h2('Ejemplo real de conversación (restaurante)'),
    term([
        'Cliente:  hola, qué hay hoy?',
        'Bot:      ¡Hola! Hoy tenemos:',
        '          • Bandeja paisa — $18.000',
        '          • Sancocho de gallina — $15.000',
        '          ¿Qué te gustaría pedir?',
        'Cliente:  una bandeja paisa, pago con Nequi',
        'Bot:      ✅ Pedido #47 confirmado. Te avisamos',
        '          cuando esté listo. Sumaste 2 puntos ⭐',
    ]),
    sp(3),
    callout('Puedes personalizar el <b>nombre del bot</b> y su <b>tono</b> (Formal, Amigable o Costeño) '
            'desde Configuración. Todos los mensajes llevan la firma "Powered by Automatiza360".'),

    h1('8. El bot de administración (gestiona por WhatsApp)'), sp(),
    p('Escríbele al mismo número desde tu teléfono registrado y el sistema detecta que eres el dueño o '
      'parte del equipo. Nada de esto lo ven tus clientes.'),
    sp(3),
    table(['Escribes...', 'El bot hace...'], [
        ['"resumen del día"', 'Ingresos, órdenes, citas y gastos de hoy'],
        ['"órdenes pendientes"', 'Lista lo que falta por preparar'],
        ['"citas de mañana"', 'Agenda completa del día siguiente'],
        ['"gasté $45.000 en ingredientes"', 'Registra el gasto en su categoría'],
        ['"hoy hay ajiaco a $16.000"', 'Actualiza el menú del día'],
        ['"orden 47 está lista"', 'Cambia el estado y notifica al cliente'],
        ['"cancela las citas del viernes desde las 2pm"', 'Cancela en bloque y avisa a los pacientes'],
        ['"crear cupón 20% descuento"', 'Genera el código al instante'],
        ['"últimas reseñas" / "stock bajo"', 'Consulta reseñas o inventario crítico'],
    ], widths=[7 * cm, PAGE_W - 7 * cm]),
    sp(3),
    p('También puede enviarte una <b>gráfica de ventas por WhatsApp</b> o un <b>reporte ejecutivo por correo</b>.'),

    h1('9. Órdenes y pedidos'), sp(),
] + steps([
    'Ve a <b>Órdenes</b> en el menú lateral. Filtra por estado: Pendiente, Confirmado, Preparando, Listo, Entregado.',
    'Haz clic en una orden para ver ítems, total, método de pago y teléfono del cliente.',
    'Cambia el estado con un clic — al pasar a <b>Listo</b>, el cliente recibe un WhatsApp automático.',
    'Exporta todas tus órdenes a Excel con el botón <b>"Exportar CSV"</b>.',
]) + [
    sp(3),
    callout('Las órdenes canceladas no se borran: quedan en el historial para efectos contables.', WARN_BG),

    h1('10. Agenda y citas'), sp(),
] + steps([
    'Ve a <b>Agenda</b>. Visualiza por lista, día o semana, y filtra por profesional o servicio.',
    'Para crear una cita manual: "Nueva cita" → servicio → profesional → fecha/hora → datos del cliente.',
    'El cliente recibe confirmación por WhatsApp y un <b>recordatorio automático 24 horas antes</b>.',
    'Estados: Agendada, Confirmada, Completada, No asistió, Cancelada.',
]) + [
    sp(3),
    p('¿Emergencia? Desde el bot de admin: <i>"cancela las citas del viernes desde las 2pm"</i> — el bot '
      'te confirma cuántas son, las cancela y notifica a cada paciente.'),

    h1('11. Tickets de reparación y garantías'), sp(),
] + steps([
    'Ve a <b>Tickets</b> → "Nuevo ticket": datos del cliente, equipo y falla reportada (fotos opcionales).',
    'El flujo de estados es: Recibido → Diagnóstico → Esperando piezas → Reparando → Listo → Entregado.',
    'El cliente puede preguntar por WhatsApp "¿cómo va mi equipo?" y el bot le responde el estado real.',
    'Al entregar, define el período de <b>garantía</b>; el bot podrá consultarla si el cliente regresa.',
    'También puedes crear tickets dictándoselos al bot de admin por WhatsApp.',
]) + [

    h1('12. Productos, inventario y menú del día'), sp(),
] + steps([
    'Ve a <b>Productos</b> o <b>Inventario</b> → "Nuevo producto": nombre, precio, stock actual, stock mínimo y foto.',
    'Cuando el stock cae bajo el mínimo, verás la alerta en el dashboard (y puedes preguntarle "stock bajo" al bot).',
    'Para cargar tu catálogo completo usa <b>importación masiva</b>: sube un Excel, un PDF o incluso una foto de tu lista — la IA extrae los productos.',
    'Restaurantes: publica el <b>Menú del día</b> y el bot lo ofrecerá automáticamente a quien pregunte.',
]) + [

    h1('13. Contactos, lealtad y exportación de datos'), sp(),
    h2('13.1 CRM automático'),
    p('Cada cliente que le escribe a tu bot queda guardado como contacto con su historial de compras, '
      'citas y conversaciones. Puedes etiquetarlos (VIP, frecuente, nuevo) para segmentar campañas.'),
    sp(3),
    h2('13.2 Programa de puntos'),
    bullet('Cada $10.000 COP en compras = 1 punto, acumulado automáticamente.'),
    bullet('El bot informa el saldo al cliente y permite canjear puntos en la próxima compra.'),
    bullet('Si registras la <b>fecha de cumpleaños</b>, el sistema envía la felicitación automáticamente ese día.'),
    sp(3),
    h2('13.3 Tus datos son tuyos'),
] + steps([
    'En <b>Contactos</b>, toca "Exportar CSV" para descargar toda tu base (nombre, teléfono, email, puntos, etiquetas).',
    'Órdenes, agenda, tickets y gastos también tienen su botón de exportación.',
    'Los archivos abren directo en Excel con acentos y ñ correctos.',
]) + [

    h1('14. Campañas de WhatsApp y cupones'), sp(),
    callout('Las campañas están disponibles en los planes <b>Pro</b> y <b>Business</b>.'),
    sp(3),
] + steps([
    'Ve a <b>Campañas</b> → "Nueva campaña" y escribe tu mensaje. Usa <b>{nombre}</b> para personalizar.',
    'Aplica filtros: por etiqueta, sin compras en N días, compras recientes o puntos mínimos.',
    'Toca "Ver destinatarios" para confirmar cuántas personas la recibirán.',
    'Envía. Los contactos desuscritos (STOP) se excluyen automáticamente y cada mensaje incluye la opción de baja.',
]) + [
    sp(3),
    p('En <b>Cupones</b> creas códigos de descuento (porcentaje o valor fijo, con vencimiento y límite de '
      'usos) que el bot valida y aplica solo. En <b>Flujos</b> configuras secuencias automáticas, por '
      'ejemplo: 2 días después de una compra → mensaje pidiendo reseña.'),

    h1('15. Gastos, caja y finanzas'), sp(),
] + steps([
    'Registra gastos en <b>Gastos</b> con su categoría (insumos, nómina, servicios...) o díctalos al bot de admin.',
    'Mira el comparativo <b>ingresos vs. gastos</b> del mes y la ganancia neta.',
    'El módulo <b>Caja</b> muestra el flujo del día: cuánto entró, cuánto salió y el saldo.',
    'Exporta el histórico completo con "Exportar CSV" para tu contador.',
]) + [

    h1('16. Equipo, roles y turnos'), sp(),
    table(['Rol', 'Permisos'], [
        ['Propietario (Owner)', 'Acceso total, configuración y facturación'],
        ['Administrador', 'Gestión completa excepto facturación'],
        ['Personal (Staff)', 'Operación diaria, sin configuración'],
    ], widths=[5 * cm, PAGE_W - 5 * cm]),
    sp(3),
] + steps([
    'Ve a <b>Equipo</b> → "Invitar miembro", escribe su correo y elige el rol.',
    'La persona recibe un correo para crear su contraseña y entrar.',
    'En <b>Turnos</b> organizas los horarios del personal; el bot de admin los consulta con "turnos de hoy".',
]) + [
    sp(3),
    p('Límite de miembros por plan: Starter 1 agente · Pro 3 agentes · Business ilimitado. '
      'Si tienes varias sedes, actívalas en <b>Sucursales</b> (plan Business).'),

    h1('17. Conectar Instagram (respuestas automáticas en DMs)'), sp(),
    p('El mismo bot que atiende WhatsApp puede responder los mensajes directos de tu Instagram.'),
    sp(3),
    h2('Requisitos'),
    bullet('Cuenta de <b>Instagram Business</b> (si es personal: Configuración → Cuenta → Cambiar a cuenta profesional — gratis).'),
    bullet('La cuenta debe estar <b>vinculada a una Página de Facebook</b>.'),
    sp(3),
    h2('Pasos para conectar'),
] + steps([
    'Ve a <b>Configuración</b> y busca la sección "Instagram DMs".',
    'Haz clic en <b>"Conectar Instagram →"</b>.',
    'Inicia sesión con tu cuenta de Facebook en la ventana de Meta y acepta los permisos.',
    'Al volver verás "✅ Instagram conectado" con el nombre de tu página.',
    'Listo: cada DM nuevo recibirá respuesta automática del bot, y las conversaciones quedan en tu panel.',
]) + [
    sp(3),
    p('Para desconectar, usa el botón "Desconectar Instagram" en la misma sección. El acceso queda '
      'guardado de forma <b>cifrada</b> en nuestros servidores.'),

    h1('18. Configuración del negocio y del bot'), sp(),
    bullet('<b>Información:</b> nombre, descripción, horarios, dirección y logo — el bot usa estos datos al responder.'),
    bullet('<b>Personalidad del bot:</b> nombre propio (ej. "Sofía") y tono Formal / Amigable / Costeño.'),
    bullet('<b>Notificaciones push:</b> activa las alertas en tu celular (la app es instalable como PWA).'),
    bullet('<b>Contraseña olvidada:</b> "¿Olvidaste tu contraseña?" en el login te envía un enlace válido por 1 hora.'),

    h1('19. Pagos, plan anual y facturación'), sp(),
] + steps([
    'Ve a <b>Planes</b> (o "Mi plan" → mejorar).',
    'Elige el período con el selector <b>Mensual / Anual</b> — el anual muestra cuánto ahorras (2 meses gratis).',
    'Selecciona tu plan y toca "Contratar". Serás redirigido al checkout seguro de <b>Wompi</b>.',
    'Paga con tarjeta, PSE o Nequi. Al aprobarse, tu plan se activa al instante y recibes el recibo por correo.',
    'En <b>Mi plan</b> ves tu historial de pagos y la fecha de renovación.',
]) + [
    sp(3),
    callout('¿Problemas con un cobro? Escribe a <b>soporteautomatiza360@rgytgroup.com</b> dentro de los '
            'primeros 7 días para gestionar el reembolso.'),

    h1('20. Privacidad, seguridad y marco legal'), sp(),
    bullet('Cumplimos la <b>Ley 1581 de 2012</b> de protección de datos de Colombia.'),
    bullet('Cada negocio opera con sus datos <b>completamente aislados</b> de los demás.'),
    bullet('Contraseñas con hash irreversible, conexiones HTTPS y credenciales de integraciones cifradas en reposo.'),
    bullet('Tus clientes pueden salir de las campañas en cualquier momento respondiendo <b>STOP</b>.'),
    bullet('Documentos completos en <b>automatiza360.com/terminos</b> y <b>automatiza360.com/privacidad</b>.'),

    h1('21. Preguntas frecuentes'), sp(),
]

FAQ = [
    ('¿Necesito un número de WhatsApp nuevo?',
     'No te preocupas por eso: al registrarte, el sistema aprovisiona un número de WhatsApp Business para tu negocio. Si ya tienes uno aprobado por Meta, también se puede usar.'),
    ('¿El bot funciona las 24 horas?',
     'Sí. Atiende a tus clientes a cualquier hora, incluso domingos y festivos.'),
    ('¿Puedo seguir respondiendo yo mismo?',
     'Sí. En Conversaciones ves todos los chats y puedes intervenir cuando quieras. Si un cliente pide un humano, recibes una alerta inmediata.'),
    ('¿Qué pasa si se acaba mi cuota de conversaciones?',
     'El bot informa amablemente al cliente y tú puedes subir de plan en cualquier momento; el cambio es inmediato.'),
    ('¿Puedo llevarme mis datos si me voy?',
     'Sí. Todos los módulos principales tienen exportación a CSV: contactos, órdenes, citas, tickets y gastos.'),
    ('¿Los datos de ejemplo afectan mis números reales?',
     'Solo mientras existan. Elimínalos con un clic desde el banner del dashboard y tus métricas quedan limpias.'),
    ('¿Cómo contacto a soporte?',
     'Por el chat de soporte dentro del panel o escribiendo a soporteautomatiza360@rgytgroup.com. Respondemos en máximo 24 horas hábiles.'),
]
for q, a in FAQ:
    story.append(h3(q))
    story.append(p(a))
    story.append(sp(3))

# ══ CIERRE ═══════════════════════════════════════
story += [
    PageBreak(),
    Spacer(1, 2 * cm),
    Paragraph('automatiza<font color="#2C7229">360°</font>',
              S('f0', fontName='Helvetica-Bold', fontSize=22, textColor=INK, alignment=TA_CENTER)),
    sp(8),
    Paragraph('Manual de Usuario v2.0 · Julio 2026',
              S('f1', fontName='Courier', fontSize=9, textColor=MUTED, alignment=TA_CENTER)),
    sp(4),
    Paragraph('¿Dudas? soporteautomatiza360@rgytgroup.com',
              S('f2', fontName='Helvetica', fontSize=10, textColor=MUTED, alignment=TA_CENTER)),
    sp(4),
    Paragraph('© 2026 Automatiza360 · RGYT Group. Todos los derechos reservados.',
              S('f3', fontName='Helvetica', fontSize=8, textColor=MUTED, alignment=TA_CENTER)),
]

doc.build(story)
print(f'✅ PDF v2.0 generado: {out_path} ({os.path.getsize(out_path) // 1024} KB)')
