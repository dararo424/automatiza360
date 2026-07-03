import { LegalLayout, LegalSection } from './LegalLayout';

export function TerminosPage() {
  return (
    <LegalLayout label="Documento legal" title="Términos y Condiciones" updatedAt="2 de julio de 2026">
      <p>
        Estos Términos y Condiciones (los "Términos") regulan el acceso y uso de la plataforma
        <strong> Automatiza360</strong> (el "Servicio"), operada por <strong>RGYT Group</strong> ("nosotros"),
        disponible en automatiza360.com. Al crear una cuenta o usar el Servicio aceptas estos Términos
        en su totalidad. Si no estás de acuerdo, no uses el Servicio.
      </p>

      <LegalSection number="1" title="Descripción del Servicio">
        <p>
          Automatiza360 es una plataforma de software como servicio (SaaS) que permite a negocios
          gestionar su operación y atender a sus clientes por WhatsApp e Instagram mediante asistentes
          automatizados con inteligencia artificial: toma de pedidos, agendamiento de citas, tickets de
          reparación, inventario, campañas de mensajería, gestión de contactos y reportes, entre otras
          funcionalidades según el plan contratado.
        </p>
      </LegalSection>

      <LegalSection number="2" title="Cuentas y responsabilidad del usuario">
        <p>
          Para usar el Servicio debes registrar una cuenta con información veraz y mantener la
          confidencialidad de tus credenciales. Eres responsable de toda la actividad que ocurra bajo tu
          cuenta y la de los usuarios que invites a tu equipo (roles Propietario, Administrador y Personal).
        </p>
        <p>
          Debes ser mayor de 18 años y tener capacidad legal para representar al negocio que registras.
        </p>
      </LegalSection>

      <LegalSection number="3" title="Uso aceptable">
        <p>Te comprometes a NO usar el Servicio para:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Enviar mensajes no solicitados (spam) o contactar personas que no han dado su consentimiento.</li>
          <li>Actividades ilegales, fraudulentas, engañosas o que infrinjan derechos de terceros.</li>
          <li>Violar las políticas de las plataformas de mensajería (WhatsApp Business / Meta).</li>
          <li>Intentar acceder a datos de otros negocios, vulnerar la seguridad o realizar ingeniería inversa del Servicio.</li>
        </ul>
        <p>
          El Servicio incluye mecanismos de exclusión (opt-out): si un cliente final responde "STOP",
          dejará de recibir campañas. Manipular o eludir estos mecanismos es causal de suspensión.
        </p>
      </LegalSection>

      <LegalSection number="4" title="Planes, pagos y facturación">
        <p>
          El Servicio se ofrece bajo planes de suscripción (Starter, Pro y Business) con cobro mensual o
          anual por adelantado, procesado en pesos colombianos (COP) a través de <strong>Wompi</strong>,
          pasarela de pagos de Bancolombia. No almacenamos datos de tarjetas.
        </p>
        <p>
          Los negocios nuevos cuentan con un período de prueba gratuito de 14 días sin necesidad de
          tarjeta. Al finalizar la prueba, el acceso se suspende hasta que se active un plan.
        </p>
        <p>
          Puedes solicitar reembolso dentro de los 7 días siguientes a un cobro escribiendo a
          soporteautomatiza360@rgytgroup.com. Los cobros de períodos ya prestados no son reembolsables.
        </p>
      </LegalSection>

      <LegalSection number="5" title="Contenido y datos de tu negocio">
        <p>
          Los datos que cargas al Servicio (productos, contactos, órdenes, conversaciones) son de tu
          propiedad. Nos otorgas una licencia limitada para procesarlos únicamente con el fin de prestar
          el Servicio. Puedes exportar tus datos en cualquier momento desde la plataforma y solicitar su
          eliminación al cerrar tu cuenta.
        </p>
        <p>
          Cada negocio (tenant) opera con sus datos completamente aislados de los demás negocios de la
          plataforma.
        </p>
      </LegalSection>

      <LegalSection number="6" title="Inteligencia artificial">
        <p>
          Las respuestas de los asistentes automatizados se generan con modelos de inteligencia
          artificial de terceros (Google y Anthropic). Aunque optimizamos su precisión, las respuestas
          pueden contener errores; eres responsable de supervisar la atención que el bot da a tus
          clientes y de la información de tu negocio que el bot comunica (precios, horarios, menú).
          Los mensajes generados incluyen la marca "Powered by Automatiza360".
        </p>
      </LegalSection>

      <LegalSection number="7" title="Servicios de terceros">
        <p>
          El Servicio depende de proveedores externos: Twilio (mensajería WhatsApp), Meta (WhatsApp e
          Instagram), Wompi (pagos), entre otros. No somos responsables por interrupciones, cambios de
          políticas o tarifas de dichos proveedores, aunque haremos esfuerzos razonables por mitigar su
          impacto.
        </p>
      </LegalSection>

      <LegalSection number="8" title="Disponibilidad y soporte">
        <p>
          Trabajamos por mantener el Servicio disponible de forma continua, pero no garantizamos
          disponibilidad ininterrumpida. Realizamos mantenimientos y actualizaciones periódicas. El
          soporte se presta por correo y por el chat de la plataforma, con tiempo de respuesta objetivo
          de 24 horas hábiles.
        </p>
      </LegalSection>

      <LegalSection number="9" title="Limitación de responsabilidad">
        <p>
          En la máxima medida permitida por la ley colombiana, nuestra responsabilidad total frente a
          cualquier reclamo derivado del Servicio se limita al valor pagado por ti en los 3 meses
          anteriores al hecho que origina el reclamo. No respondemos por lucro cesante, pérdida de
          datos causada por terceros ni daños indirectos.
        </p>
      </LegalSection>

      <LegalSection number="10" title="Suspensión y terminación">
        <p>
          Puedes cancelar tu suscripción en cualquier momento; el Servicio permanecerá activo hasta el
          final del período pagado. Podemos suspender o terminar cuentas que incumplan estos Términos,
          en particular la sección de Uso Aceptable, notificándote al correo registrado.
        </p>
      </LegalSection>

      <LegalSection number="11" title="Cambios a estos Términos">
        <p>
          Podemos actualizar estos Términos. Si el cambio es material, lo notificaremos por correo o
          dentro de la plataforma con al menos 15 días de anticipación. El uso continuado del Servicio
          después de la fecha de vigencia constituye aceptación.
        </p>
      </LegalSection>

      <LegalSection number="12" title="Ley aplicable">
        <p>
          Estos Términos se rigen por las leyes de la República de Colombia. Cualquier controversia se
          someterá a los jueces competentes de Colombia.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
