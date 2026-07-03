import { LegalLayout, LegalSection } from './LegalLayout';

export function PrivacidadPage() {
  return (
    <LegalLayout label="Documento legal" title="Política de Privacidad" updatedAt="2 de julio de 2026">
      <p>
        Esta Política de Tratamiento de Datos Personales describe cómo <strong>RGYT Group</strong>{' '}
        ("nosotros"), operador de <strong>Automatiza360</strong>, recolecta, usa, almacena y protege los
        datos personales, en cumplimiento de la <strong>Ley 1581 de 2012</strong>, el Decreto 1377 de
        2013 y demás normas aplicables en Colombia.
      </p>

      <LegalSection number="1" title="Responsable del tratamiento">
        <p>
          RGYT Group — Automatiza360
          <br />
          Correo de contacto y canal de PQRS:{' '}
          <a href="mailto:soporteautomatiza360@rgytgroup.com" className="text-selva-600 font-medium hover:underline">
            soporteautomatiza360@rgytgroup.com
          </a>
        </p>
      </LegalSection>

      <LegalSection number="2" title="Datos que recolectamos">
        <p><strong>De los negocios usuarios (nuestros clientes):</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Datos de cuenta: nombre, correo electrónico, contraseña (almacenada con hash irreversible).</li>
          <li>Datos del negocio: nombre, industria, dirección, horarios, teléfono.</li>
          <li>Datos de facturación: plan, referencias de pago (los datos de tarjeta los procesa Wompi; nunca los almacenamos).</li>
          <li>Datos de uso: métricas de actividad en la plataforma, registros técnicos (logs) y de errores.</li>
        </ul>
        <p className="mt-3"><strong>De los clientes finales de cada negocio:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Número de teléfono y nombre (cuando lo comparten por WhatsApp o Instagram).</li>
          <li>Contenido de las conversaciones con el asistente del negocio.</li>
          <li>Historial de pedidos, citas y puntos de fidelidad dentro del negocio que los atiende.</li>
        </ul>
        <p>
          Respecto de los clientes finales, cada negocio actúa como responsable del tratamiento y
          Automatiza360 actúa como encargado, procesando los datos únicamente por instrucción del
          negocio y para prestar el Servicio.
        </p>
      </LegalSection>

      <LegalSection number="3" title="Finalidades del tratamiento">
        <ul className="list-disc pl-6 space-y-1">
          <li>Prestar el Servicio: atención automatizada, gestión de pedidos, citas, inventario y reportes.</li>
          <li>Procesar pagos de suscripción y emitir comprobantes.</li>
          <li>Enviar comunicaciones transaccionales (confirmaciones, recordatorios, reportes) y, con tu autorización, comunicaciones comerciales.</li>
          <li>Mejorar la seguridad, prevenir fraude y depurar errores del Servicio.</li>
          <li>Cumplir obligaciones legales.</li>
        </ul>
      </LegalSection>

      <LegalSection number="4" title="Inteligencia artificial">
        <p>
          Para generar las respuestas automatizadas, el contenido de los mensajes se procesa mediante
          modelos de IA de <strong>Google</strong> (Gemini) y <strong>Anthropic</strong> (Claude) bajo
          acuerdos de tratamiento de datos. No usamos las conversaciones de tus clientes para entrenar
          modelos propios ni las vendemos a terceros.
        </p>
      </LegalSection>

      <LegalSection number="5" title="Encargados y transferencias internacionales">
        <p>
          Para operar el Servicio compartimos datos con proveedores que actúan como subencargados,
          algunos ubicados fuera de Colombia (principalmente en Estados Unidos), con medidas de
          protección contractuales:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Twilio</strong> — envío y recepción de mensajes de WhatsApp.</li>
          <li><strong>Meta Platforms</strong> — WhatsApp Business e Instagram Messaging.</li>
          <li><strong>Wompi (Bancolombia)</strong> — procesamiento de pagos.</li>
          <li><strong>Supabase / proveedores de nube</strong> — alojamiento de base de datos y aplicación.</li>
          <li><strong>Google y Anthropic</strong> — generación de respuestas con IA.</li>
          <li><strong>Resend</strong> — envío de correos transaccionales.</li>
          <li><strong>Sentry</strong> — monitoreo de errores técnicos.</li>
        </ul>
      </LegalSection>

      <LegalSection number="6" title="Seguridad">
        <p>
          Aplicamos medidas técnicas y organizativas razonables: cifrado en tránsito (HTTPS/TLS),
          contraseñas con hash, cifrado en reposo de credenciales de integraciones, aislamiento total de
          datos entre negocios, control de acceso por roles y registro de auditoría de eventos sensibles.
        </p>
      </LegalSection>

      <LegalSection number="7" title="Derechos de los titulares (Ley 1581 de 2012)">
        <p>Como titular de datos personales tienes derecho a:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Conocer, actualizar y rectificar tus datos.</li>
          <li>Solicitar prueba de la autorización otorgada.</li>
          <li>Ser informado sobre el uso que se les ha dado.</li>
          <li>Revocar la autorización y/o solicitar la supresión cuando no exista un deber legal de conservarlos.</li>
          <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).</li>
        </ul>
        <p>
          Para ejercerlos, escribe a soporteautomatiza360@rgytgroup.com indicando tu solicitud.
          Respondemos consultas en máximo 10 días hábiles y reclamos en máximo 15 días hábiles,
          conforme a la ley. Los clientes finales también pueden dejar de recibir mensajes de campañas
          respondiendo <strong>STOP</strong> en cualquier momento.
        </p>
      </LegalSection>

      <LegalSection number="8" title="Conservación de los datos">
        <p>
          Conservamos los datos mientras la cuenta del negocio esté activa y por el tiempo necesario
          para cumplir obligaciones legales, contables o fiscales. Al cerrar tu cuenta puedes solicitar
          la exportación y posterior eliminación de tus datos.
        </p>
      </LegalSection>

      <LegalSection number="9" title="Cambios a esta política">
        <p>
          Publicaremos cualquier cambio en esta página y, si es sustancial, lo notificaremos por correo
          o dentro de la plataforma. La fecha de "última actualización" indica la versión vigente.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
