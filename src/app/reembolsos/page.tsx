import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: `Cancelaciones y reembolsos · ${site.name}`,
};

export default function Reembolsos() {
  const { legal } = site;
  const mail = <a href={`mailto:${legal.email}`}>{legal.email}</a>;

  return (
    <LegalPage title="Cancelaciones y reembolsos">
      <p>
        Queremos que estés contento con {site.name}. Aquí te explicamos cómo cancelar y en qué casos
        te devolvemos tu dinero.
      </p>

      <h2>Planes mensuales (Agenda y Pro)</h2>
      <ul>
        <li>
          <b>Sin plazo forzoso.</b> Puedes cancelar cuando quieras, sin penalización.
        </li>
        <li>
          <b>Garantía de 7 días.</b> Si cancelas dentro de los primeros 7 días naturales después de
          tu primer pago, te devolvemos el 100% de ese pago.
        </li>
        <li>
          Después de esos 7 días, al cancelar ya no se te hará ningún cobro nuevo y conservarás el
          servicio hasta el final del mes que ya pagaste. No hacemos reembolsos parciales por los
          días no usados.
        </li>
        <li>
          Para cancelar a tiempo, avísanos al menos 1 día antes de tu siguiente fecha de cobro.
        </li>
      </ul>

      <h2>Plan Presencia (pago único)</h2>
      <ul>
        <li>
          <b>Antes de empezar:</b> si cancelas antes de que te enviemos la primera versión de tu
          página, te devolvemos el 100% del pago.
        </li>
        <li>
          <b>Después de la primera versión:</b> ya no hay reembolso, pero incluimos hasta 2 rondas
          de cambios para que la página quede como la quieres.
        </li>
        <li>
          <b>Si no cumplimos:</b> si no entregamos tu página en el plazo prometido (7 días naturales
          desde que recibimos toda tu información), puedes pedir el reembolso total.
        </li>
      </ul>

      <h2>Cómo cancelar o pedir un reembolso</h2>
      <p>
        Escríbenos a {mail} o por{" "}
        <a
          href={whatsappLink(`Hola, quiero cancelar mi plan de ${site.name}.`)}
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp
        </a>{" "}
        con el nombre de tu negocio y el correo con el que pagaste. Te confirmaremos la cancelación
        en un máximo de 2 días hábiles.
      </p>

      <h2>Cuándo se refleja el reembolso</h2>
      <p>
        Los reembolsos se hacen a la misma tarjeta con la que pagaste. Normalmente se reflejan en tu
        estado de cuenta entre 5 y 10 días hábiles después de que lo procesamos, según tu banco.
      </p>

      <h2>Cargos no reconocidos</h2>
      <p>
        Si ves un cargo de {site.name} que no reconoces, escríbenos antes de levantar una
        aclaración con tu banco. Lo revisaremos y, si procede, lo reembolsaremos de inmediato.
      </p>
    </LegalPage>
  );
}
