import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Aviso de privacidad · ${site.name}`,
};

export default function Privacidad() {
  const { legal } = site;
  const mail = <a href={`mailto:${legal.email}`}>{legal.email}</a>;

  return (
    <LegalPage title="Aviso de privacidad">
      <h2>Responsable</h2>
      <p>
        {legal.owner}, con domicilio en {legal.address}, es responsable del tratamiento de tus datos
        personales, en términos de la Ley Federal de Protección de Datos Personales en Posesión de
        los Particulares. Para cualquier tema de privacidad escríbenos a {mail}.
      </p>

      <h2>Datos que recabamos</h2>
      <ul>
        <li>
          <b>Si contratas un plan:</b> nombre, correo electrónico y teléfono. Los datos de tu tarjeta
          los recibe y procesa directamente Stripe; nosotros no los vemos ni los guardamos.
        </li>
        <li>
          <b>Si te suscribes al boletín:</b> correo electrónico.
        </li>
        <li>
          <b>Si reservas una cita en una página creada por {site.name}:</b> nombre, teléfono, correo
          electrónico (opcional), servicio, fecha y hora de la cita.
        </li>
        <li>
          <b>Si participas en el programa de recomendados:</b> quién te invitó o a quién invitaste, para
          entregar las recompensas. A tus amigos solo les mostramos tu primer nombre.
        </li>
        <li>
          <b>Si nos contactas:</b> los datos que nos compartas por correo o WhatsApp.
        </li>
      </ul>
      <p>No recabamos datos personales sensibles.</p>

      <h2>Para qué usamos tus datos</h2>
      <p>Finalidades necesarias para el servicio:</p>
      <ul>
        <li>Procesar tu pago y, en su caso, tu suscripción mensual.</li>
        <li>Contactarte para crear, entregar y dar mantenimiento a tu página.</li>
        <li>Registrar tus citas y enviar avisos y confirmaciones por correo o WhatsApp.</li>
        <li>Atender dudas, aclaraciones, cancelaciones y reembolsos.</li>
        <li>Cumplir obligaciones legales y fiscales.</li>
      </ul>
      <p>Finalidades adicionales, que no son necesarias para el servicio:</p>
      <ul>
        <li>Enviarte nuestro boletín con consejos y promociones.</li>
      </ul>
      <p>
        Si no quieres que usemos tus datos para las finalidades adicionales, puedes darte de baja
        con el enlace que viene en cada boletín o escribiendo a {mail}. Esto no afecta los servicios
        que contrataste.
      </p>

      <h2>Con quién compartimos tus datos</h2>
      <p>
        Usamos proveedores que tratan datos por cuenta nuestra y solo para prestar el servicio:
      </p>
      <ul>
        <li>
          <b>Stripe</b>, para procesar pagos.
        </li>
        <li>
          <b>Resend</b>, para enviar correos y administrar el boletín.
        </li>
        <li>
          <b>Vercel</b>, para alojar el sitio web.
        </li>
      </ul>
      <p>
        Algunos de estos proveedores están fuera de México. Las citas que se reservan en la página
        de un negocio se envían a ese negocio para que pueda atenderlas. No vendemos tus datos ni
        los compartimos con terceros para sus propios fines, salvo cuando lo exija una autoridad
        competente.
      </p>

      <h2>Tus derechos (ARCO)</h2>
      <p>
        Tienes derecho a Acceder a tus datos, Rectificarlos, Cancelarlos u Oponerte a su uso, así
        como a revocar tu consentimiento. Para hacerlo, envía un correo a {mail} con:
      </p>
      <ul>
        <li>Tu nombre y un medio para responderte.</li>
        <li>Una identificación oficial, o la de tu representante legal.</li>
        <li>Qué derecho quieres ejercer y sobre qué datos.</li>
      </ul>
      <p>
        Te responderemos en un plazo máximo de 20 días hábiles y, si procede, aplicaremos tu
        solicitud dentro de los 15 días hábiles siguientes.
      </p>

      <h2>Cookies</h2>
      <p>
        Nuestro sitio no usa cookies propias de publicidad ni de rastreo. El mapa de Google y la
        página de pago de Stripe pueden usar sus propias cookies, de acuerdo con las políticas de
        esas empresas.
      </p>

      <h2>Cuánto tiempo guardamos tus datos</h2>
      <p>
        Guardamos tus datos mientras tengas una relación con nosotros y después solo el tiempo que
        exijan las obligaciones legales y fiscales aplicables.
      </p>

      <h2>Cambios a este aviso</h2>
      <p>
        Publicaremos cualquier cambio a este aviso de privacidad en esta misma página, indicando la
        fecha de la última actualización.
      </p>
    </LegalPage>
  );
}
