import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { formatPrice, plans, site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Términos y condiciones · ${site.name}`,
};

export default function Terminos() {
  const { legal } = site;

  return (
    <LegalPage title="Términos y condiciones">
      <p>
        Estos términos regulan la contratación de los servicios de {site.name}, ofrecidos por{" "}
        {legal.owner}, con domicilio en {legal.address} (en adelante, &quot;{site.name}&quot;).
        Al contratar cualquiera de nuestros planes aceptas estos términos.
      </p>

      <h2>1. Servicios</h2>
      <p>
        {site.name} ofrece a negocios la creación de una página web, el alta y optimización de su
        perfil en Google Maps, una agenda en línea para que sus clientes soliciten citas y servicios
        relacionados, según el plan contratado:
      </p>
      <ul>
        {plans.map((plan) => (
          <li key={plan.id}>
            <b>{plan.name}</b> ({formatPrice(plan.price)}
            {plan.interval === "mes" ? " al mes" : " pago único"}): {plan.features.join(", ")}.
          </li>
        ))}
      </ul>

      <h2>2. Precios y pagos</h2>
      <ul>
        <li>Los precios están en pesos mexicanos (MXN) e incluyen los impuestos aplicables.</li>
        <li>
          Los pagos se procesan con tarjeta de crédito o débito a través de Stripe. {site.name} no
          almacena los datos de tu tarjeta.
        </li>
        <li>
          Los planes mensuales se cobran por adelantado y se renuevan automáticamente cada mes, en
          la misma fecha del primer pago, hasta que los canceles.
        </li>
        <li>
          Si un cobro mensual no se puede realizar, podremos suspender el servicio hasta que se
          regularice el pago.
        </li>
        <li>
          Si cambiamos los precios, te avisaremos con al menos 30 días de anticipación. El nuevo
          precio aplicará a partir del siguiente periodo después del aviso.
        </li>
      </ul>

      <h2>3. Entrega</h2>
      <p>
        Después del pago te contactaremos en un plazo máximo de 24 horas hábiles. Entregamos tu
        página en un plazo de 7 días naturales a partir de que nos envíes la información necesaria
        (nombre del negocio, servicios, precios, horarios, fotos y datos de contacto). Si la
        información llega incompleta, el plazo empieza a contar cuando la recibamos completa.
      </p>

      <h2>4. Tus responsabilidades</h2>
      <ul>
        <li>Darnos información veraz y actualizada de tu negocio.</li>
        <li>
          Contar con los derechos de los textos, logotipos y fotografías que nos envíes para
          publicar.
        </li>
        <li>
          Atender las citas que recibas por la agenda en línea y tratar los datos de tus clientes
          conforme a la ley.
        </li>
        <li>No usar el servicio para actividades ilícitas o engañosas.</li>
      </ul>

      <h2>5. Propiedad intelectual</h2>
      <p>
        Tu contenido (textos, fotos, logotipo y datos de tu negocio) es tuyo. El diseño, el código y
        las plantillas de la página son propiedad de {site.name} y te otorgamos una licencia de uso
        mientras tu plan esté vigente. En el plan Presencia, de pago único, la licencia de uso de la
        página entregada no tiene vencimiento.
      </p>

      <h2>6. Servicios de terceros</h2>
      <p>
        Nuestro servicio usa plataformas de terceros como Google Maps, WhatsApp, Stripe, Resend y
        Vercel. No somos responsables por cambios, fallas o decisiones de esas plataformas, como la
        verificación o suspensión de un perfil de Google o de una cuenta de WhatsApp Business.
      </p>

      <h2>7. Disponibilidad y limitación de responsabilidad</h2>
      <p>
        Hacemos nuestro mejor esfuerzo para que tu página y tu agenda estén disponibles en todo
        momento, pero no garantizamos que funcionen sin interrupciones. {site.name} no garantiza un
        número determinado de clientes o citas, y no es responsable por citas no atendidas,
        ganancias no obtenidas o daños indirectos. Nuestra responsabilidad máxima se limita al monto
        que hayas pagado en los últimos 3 meses de servicio.
      </p>

      <h2>8. Cancelación</h2>
      <p>
        Puedes cancelar tu plan mensual en cualquier momento. Consulta los detalles en nuestra{" "}
        <Link href="/reembolsos">Política de cancelaciones y reembolsos</Link>. Podemos dar por
        terminado el servicio si incumples estos términos.
      </p>

      <h2>9. Datos personales</h2>
      <p>
        Tratamos tus datos conforme a nuestro <Link href="/privacidad">Aviso de privacidad</Link>.
      </p>

      <h2>10. Cambios a estos términos</h2>
      <p>
        Podemos actualizar estos términos. Publicaremos la versión vigente en esta página y, si los
        cambios son importantes, te avisaremos por correo.
      </p>

      <h2>11. Ley aplicable</h2>
      <p>
        Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Para cualquier
        controversia, las partes se someten a los tribunales competentes de {legal.city}, sin
        perjuicio de los derechos que te otorga la Ley Federal de Protección al Consumidor ante la
        Procuraduría Federal del Consumidor (Profeco).
      </p>

      <h2>12. Contacto</h2>
      <p>
        Escríbenos a <a href={`mailto:${legal.email}`}>{legal.email}</a>.
      </p>
    </LegalPage>
  );
}
