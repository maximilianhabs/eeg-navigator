import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Impressum & Rechtliches' }

export default function ImpressumPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-10 animate-fade-in py-4">

      {/* Back */}
      <Link href="/"
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all hover:-translate-x-0.5"
        style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/>
        </svg>
        Atlas
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Impressum &amp; Rechtliches
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Angaben gemäß § 5 DDG · Datenschutz · Nutzungsrecht · Medizinischer Hinweis
        </p>
      </div>

      {/* ── Impressum ── */}
      <Section title="Impressum" subtitle="Angaben gemäß § 5 DDG">
        <Field label="Verantwortlicher">
          Maximilian Habs
        </Field>
        <Field label="Anschrift">
          Bezirksklinikum Mainkofen<br/>
          Mainkofen 1<br/>
          94469 Deggendorf<br/>
          Deutschland
        </Field>
        <Field label="Kontakt">
          <a href="mailto:maximilian.habs@googlemail.com"
            className="hover:underline"
            style={{ color: 'var(--brand)' }}>
            maximilian.habs@googlemail.com
          </a>
        </Field>
        <Field label="Inhaltlich Verantwortlicher">
          Maximilian Habs (Anschrift wie oben)
        </Field>
        <p className="text-xs leading-relaxed mt-2" style={{ color: 'var(--text-tertiary)' }}>
          Diese Plattform wird als privates, nicht-kommerzielles Lehr- und Forschungsprojekt
          betrieben. Sie ist nicht öffentlich zugänglich und richtet sich ausschließlich an
          ausgewählte, persönlich eingeladene Nutzer aus dem medizinischen Fachbereich.
        </p>
      </Section>

      <div id="feedback" className="scroll-mt-20">
        <Section title="Über das Projekt, Feedback &amp; EDF-Beiträge">
          <p>
            EEG Navigator ist ein deutschsprachiges Lehr- und Nachschlagewerk von
            Maximilian Habs für medizinisches Fachpersonal. Hinweise auf Fehler,
            fachliche Ergänzungen und Vorschläge zur Bedienung sind willkommen.
          </p>
          <p>
            Schreiben Sie an{' '}
            <a href="mailto:maximilian.habs@googlemail.com?subject=Feedback%20zum%20EEG%20Navigator"
              className="underline underline-offset-2" style={{ color: 'var(--brand)' }}>
              maximilian.habs@googlemail.com
            </a>.
            Nennen Sie nach Möglichkeit die betroffene Seite oder Entitäts-ID und
            beschreiben Sie Ihren Vorschlag. Bitte senden Sie keine personenbezogenen
            Patientendaten, auch nicht in Screenshots oder im Nachrichtentext.
          </p>
          <SubSection title="Eigene EDF-Beispiele beitragen">
            Sie können anonymisierte EDF-Beispielaufnahmen für die Lehre per E-Mail
            vorschlagen. Entfernen Sie vor dem Versand alle identifizierenden Angaben,
            insbesondere aus Dateinamen, Patienten- und Aufzeichnungsfeldern,
            Datumsangaben, Freitext und Annotationen. Das bloße Umbenennen der Datei
            genügt nicht. Wenn Sie unsicher sind, nehmen Sie zunächst ohne Dateianhang
            Kontakt auf.
          </SubSection>
          <p>
            Bitte reichen Sie nur Aufnahmen ein, zu deren Weitergabe und Veröffentlichung
            Sie berechtigt sind. Ergänzen Sie eine kurze fachliche Beschreibung des
            EEG-Phänomens und Angaben zur Herkunft ohne Personenbezug. Maximilian Habs
            prüft die vorgeschlagenen Dateien vor einer möglichen Aufnahme in die
            Website. Veröffentlichungsumfang, Namensnennung und Lizenz werden vorab
            abgestimmt; eine Einsendung wird nicht automatisch veröffentlicht.
          </p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Die Kontaktlinks öffnen Ihr E-Mail-Programm. Es gibt keinen direkten
            Datei-Upload auf dieser Website. Ihre E-Mail-Adresse und die mitgesendeten
            Angaben werden zur Bearbeitung Ihrer Anfrage und zur Abstimmung eines
            möglichen Beitrags verwendet.
          </p>
        </Section>
      </div>

      {/* ── Medizinischer Disclaimer ── */}
      <Section title="Medizinischer Hinweis" subtitle="Kein Medizinprodukt · Keine klinische Entscheidungshilfe">
        <div className="rounded-xl border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-900/20 pl-4 pr-3 py-3 space-y-2">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Dieser EEG Navigator ist kein Medizinprodukt im Sinne der EU-Verordnung 2017/745 (MDR).
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Die Inhalte dieser Plattform dienen ausschließlich zu Lehr-, Aus- und Weiterbildungszwecken
            sowie zur wissenschaftlichen Information für medizinisches Fachpersonal. Sie ersetzen
            in keinem Fall die eigenverantwortliche klinische Beurteilung durch qualifizierte Ärztinnen
            und Ärzte.
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Die hier dargestellten EEG-Muster, Klassifikationen, Differenzialdiagnosen und klinischen
            Hinweise sind didaktisch aufbereitet und können von individuellen Patientenbefunden abweichen.
            Sie dürfen nicht als Grundlage für Diagnosestellung, Therapieentscheidung oder klinisches
            Handeln verwendet werden.
          </p>
          <p className="text-xs leading-relaxed font-medium" style={{ color: 'var(--text-primary)' }}>
            Die medizinische Verantwortung verbleibt stets bei der behandelnden Ärztin bzw. dem
            behandelnden Arzt. Die Nutzung dieser Plattform erfolgt auf eigene Verantwortung.
          </p>
        </div>
      </Section>

      {/* ── Haftungsausschluss ── */}
      <Section title="Haftungsausschluss">
        <SubSection title="Haftung für Inhalte">
          Die Inhalte dieser Plattform wurden mit größtmöglicher Sorgfalt erstellt und basieren
          auf aktueller medizinischer Fachliteratur. Eine Gewähr für die Richtigkeit, Vollständigkeit
          und Aktualität kann dennoch nicht übernommen werden. Die Verantwortung für klinische
          Entscheidungen liegt ausschließlich beim handelnden Arzt.
        </SubSection>
        <SubSection title="Haftung für Links">
          Diese Plattform enthält keine externen Links zu Drittseiten. Sollten solche künftig
          eingebunden werden, wird auf den Inhalt externer Seiten kein Einfluss genommen.
          Für Inhalte verlinkter Seiten ist stets der jeweilige Anbieter verantwortlich.
        </SubSection>
        <SubSection title="Verfügbarkeit">
          Der Betrieb dieser Plattform als nichtöffentliches Testsystem erfolgt ohne Gewährleistung
          dauerhafter Verfügbarkeit. Änderungen, Unterbrechungen oder Abschaltung können jederzeit
          ohne Vorankündigung erfolgen.
        </SubSection>
      </Section>

      {/* ── Urheberrecht ── */}
      <Section title="Urheberrecht &amp; Geistiges Eigentum">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Alle Inhalte dieser Plattform — einschließlich Texte, Strukturen, Konzepte, Datenbanken,
          Klassifikationssysteme, didaktische Aufbereitungen, Wizard-Logiken, Algorithmen und das
          zugrunde liegende Lehrkonzept — sind urheberrechtlich geschützt.
        </p>
        <p className="text-sm leading-relaxed mt-2" style={{ color: 'var(--text-secondary)' }}>
          © {new Date().getFullYear()} Maximilian Habs. Alle Rechte vorbehalten.
        </p>
        <p className="text-sm leading-relaxed mt-2" style={{ color: 'var(--text-secondary)' }}>
          Die Vervielfältigung, Verbreitung, öffentliche Wiedergabe oder Bearbeitung der Inhalte —
          ganz oder in Teilen — ist ohne ausdrückliche schriftliche Genehmigung des Urhebers
          nicht gestattet. Dies gilt insbesondere für:
        </p>
        <ul className="mt-2 space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {[
            'Die EEG-Entitätsdatenbank (Wellen und Artefakte) mit allen strukturierten Feldern',
            'Das regelbasierte Klassifikations- und Wizard-System',
            'Die didaktischen Teaching-Module und Entwicklungsmodule',
            'Die Gesamtarchitektur und Navigationskonzepte der Plattform',
            'Alle grafischen Darstellungen, Diagramme und Visualisierungen',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0 bg-blue-500"/>
              {item}
            </li>
          ))}
        </ul>
        <p className="text-sm leading-relaxed mt-3" style={{ color: 'var(--text-secondary)' }}>
          Eine Nutzung für eigene kommerzielle oder nicht-kommerzielle Projekte — auch in
          abgewandelter Form — bedarf der vorherigen schriftlichen Zustimmung. Anfragen richten
          Sie bitte an die oben genannte E-Mail-Adresse.
        </p>
      </Section>

      {/* ── Datenschutz ── */}
      <Section title="Datenschutzerklärung" subtitle="gemäß DSGVO / DS-GVO Art. 13">
        <SubSection title="Verantwortlicher für die Datenverarbeitung">
          Maximilian Habs, Bezirksklinikum Mainkofen, Mainkofen 1, 94469 Deggendorf<br/>
          E-Mail: maximilian.habs@googlemail.com
        </SubSection>
        <SubSection title="Erhobene Daten">
          Diese Plattform erhebt folgende personenbezogene Daten:
          <ul className="mt-1.5 space-y-1">
            {[
              'Benutzername (beim Login vergeben, kein Klarbezug zur Person erforderlich)',
              'Passwort (gespeichert ausschließlich als bcrypt-Hash, nicht lesbar)',
              'Sitzungs-Cookie (httpOnly, signiert, 10 Stunden Gültigkeit) zur Authentifizierung',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0 bg-blue-500"/>
                {item}
              </li>
            ))}
          </ul>
        </SubSection>
        <SubSection title="Nicht erhobene Daten">
          Es werden <strong>keine</strong> Analyse- oder Trackingdaten erhoben. Es existieren keine:
          <ul className="mt-1.5 space-y-1">
            {[
              'Analytics (Google Analytics, Matomo o.ä.)',
              'Nutzungsstatistiken oder Seitenaufruf-Protokolle',
              'Drittanbieter-Cookies oder Tracking-Pixel',
              'Weitergabe von Daten an Dritte',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0 bg-slate-400"/>
                {item}
              </li>
            ))}
          </ul>
        </SubSection>
        <SubSection title="Zweck der Datenverarbeitung">
          Die bei der Anmeldung erhobenen Daten dienen der Zugangskontrolle zu dieser
          nicht-öffentlichen Plattform. Bei einer Kontaktaufnahme per E-Mail werden
          die mitgesendeten Angaben zur Bearbeitung der Anfrage verwendet.
          Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung / berechtigtes Interesse).
        </SubSection>
        <SubSection title="Datenspeicherung und -löschung">
          Benutzerdaten werden in einer Datei auf dem Server gespeichert. Passwörter werden
          ausschließlich als bcrypt-Hashes abgelegt.
          Die Daten werden gelöscht, sobald der Zugang nicht mehr benötigt wird oder auf Anfrage
          des Nutzers. Das Sitzungs-Cookie wird nach 10 Stunden automatisch ungültig.
        </SubSection>
        <SubSection title="Betroffenenrechte">
          Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung
          (Art. 17), Einschränkung der Verarbeitung (Art. 18) sowie Widerspruch (Art. 21).
          Anfragen richten Sie an: maximilian.habs@googlemail.com
        </SubSection>
        <SubSection title="Beschwerderecht">
          Sie haben das Recht, sich bei der zuständigen Aufsichtsbehörde zu beschweren.
          Zuständig ist der Bayerische Landesbeauftragte für den Datenschutz (BayLfD),
          Wagmüllerstraße 18, 80538 München.
        </SubSection>
      </Section>

      {/* ── Stand ── */}
      <p className="text-xs pb-6" style={{ color: 'var(--text-tertiary)' }}>
        Stand: September 2026 · Diese Seite kann jederzeit ohne Vorankündigung aktualisiert werden.
      </p>

    </div>
  )
}

function Section({ title, subtitle, children }: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}
          dangerouslySetInnerHTML={{ __html: title }}/>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{subtitle}</p>
        )}
      </div>
      <div className="border-t pt-4 space-y-4 text-sm leading-relaxed"
        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
        {children}
      </div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
      <span className="font-semibold text-xs uppercase tracking-wide pt-0.5"
        style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      <span style={{ color: 'var(--text-secondary)' }}>{children}</span>
    </div>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <div className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{children}</div>
    </div>
  )
}
