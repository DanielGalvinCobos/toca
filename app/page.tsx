import Image from "next/image";

function NfcWaves({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 280 280"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M48 232 A184 184 0 0 1 232 48"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />

      <path
        d="M78 232 A154 154 0 0 1 232 78"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />

      <path
        d="M108 232 A124 124 0 0 1 232 108"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PhoneNfcIllustration() {
  return (
    <div className="home-benefits-illustration" aria-hidden="true">
      <div className="home-phone">
        <div className="home-phone-screen">
          <div className="home-phone-top">
            <Image
              src="/logo/toca.svg"
              alt=""
              width={42}
              height={18}
              className="home-phone-logo"
            />
            <span className="home-phone-status">●</span>
          </div>

          <div className="home-phone-business">
            <div className="home-phone-avatar">B</div>

            <div>
              <strong>Tu negocio</strong>
              <span>en TOCA</span>
            </div>
          </div>

          <div className="home-phone-review">
            <div className="home-review-stars">★★★★★</div>
            <strong>Deja tu reseña</strong>
            <span>Comparte tu experiencia</span>
          </div>

          <div className="home-phone-button">
            <span>Google</span>
            <span>→</span>
          </div>
        </div>
      </div>

      <div className="home-nfc-connection">
        <span />
        <span />
        <span />
      </div>

      <div className="home-nfc-stand">
        <div className="home-nfc-stand-logo">
          <Image
            src="/logo/toca.svg"
            alt=""
            width={58}
            height={24}
          />
        </div>

        <div className="home-nfc-symbol">
          <span />
          <span />
          <span />
        </div>

        <div className="home-nfc-stand-base" />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="home">
      <div className="home-intro">
        <div className="home-intro-decorations" aria-hidden="true">
          <NfcWaves className="home-nfc-waves home-nfc-waves-top-right" />

          <NfcWaves className="home-nfc-waves home-nfc-waves-bottom-left" />
        </div>

        <header className="home-header">
          <Image
            src="/logo/toca.svg"
            alt="TOCA"
            width={220}
            height={80}
            priority
            className="home-logo"
          />
        </header>

        <section className="home-hero">
          <span className="home-eyebrow">
            SOLUCIONES DIGITALES PARA NEGOCIOS
          </span>

          <h1>
            Todo tu negocio.
            <br className="home-desktop-break" />
            En un toque.
          </h1>

          <p className="home-hero-description">
            Conecta tu negocio con tus clientes de una forma más sencilla.
            Tecnología NFC para acercar tus servicios digitales a las personas.
          </p>

          <div className="home-hero-highlight">
            <span className="home-highlight-dot" />
            <span>Sin aplicaciones. Sin complicaciones.</span>
          </div>
        </section>
      </div>

      <section className="home-product">
        <div className="home-section-heading">
          <span className="home-eyebrow">TOCA BÁSICO</span>

          <h2>Convierte un toque en una reseña.</h2>

          <p>
            Facilita que tus clientes lleguen a tus reseñas de Google
            directamente desde tu establecimiento.
          </p>
        </div>

        <div className="home-steps">
          <article className="home-step">
            <div className="home-step-number">01</div>

            <div className="home-step-icon" aria-hidden="true">
              <svg viewBox="0 0 48 48" fill="none">
                <rect
                  x="7"
                  y="7"
                  width="34"
                  height="34"
                  rx="10"
                  stroke="currentColor"
                  strokeWidth="2.5"
                />

                <path
                  d="M17 19C19.8 21.8 19.8 26.2 17 29"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                <path
                  d="M23 16C27.4 20.4 27.4 27.6 23 32"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                <circle
                  cx="31"
                  cy="24"
                  r="2.5"
                  fill="currentColor"
                />
              </svg>
            </div>

            <h3>Acerca</h3>

            <p>
              Tu cliente acerca su móvil al soporte NFC.
            </p>
          </article>

          <article className="home-step">
            <div className="home-step-number">02</div>

            <div className="home-step-icon" aria-hidden="true">
              <svg viewBox="0 0 48 48" fill="none">
                <rect
                  x="5"
                  y="8"
                  width="38"
                  height="32"
                  rx="5"
                  stroke="currentColor"
                  strokeWidth="2.5"
                />

                <path
                  d="M5 17H43M12 13H13M18 13H19M15 25H21V31H15V25ZM27 25H33V31H27V25Z"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h3>Accede</h3>

            <p>
              Se abre la página de tu negocio en TOCA.
            </p>
          </article>

          <article className="home-step">
            <div className="home-step-number">03</div>

            <div className="home-step-icon" aria-hidden="true">
              <svg viewBox="0 0 48 48" fill="none">
                <path
                  d="M24 5L29.8 17L43 18.9L33.5 28.2L35.7 41.5L24 35.2L12.3 41.5L14.5 28.2L5 18.9L18.2 17L24 5Z"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h3>Valora</h3>

            <p>
              Tu cliente puede acceder a Google para dejar su reseña.
            </p>
          </article>
        </div>
      </section>

      <section className="home-benefits">
        <div className="home-benefits-content">
          <span className="home-eyebrow">
            SENCILLO PARA TODOS
          </span>

          <h2>
            Menos pasos para llegar a lo importante.
          </h2>

          <p>
            Una experiencia pensada para que tus clientes puedan acceder
            fácilmente a sus reseñas, sin instalar nada ni buscar tu negocio.
          </p>

          <ul className="home-benefit-list">
            <li>
              <span className="home-check">✓</span>
              No necesitan descargar una aplicación.
            </li>

            <li>
              <span className="home-check">✓</span>
              Configurado para tu negocio.
            </li>

            <li>
              <span className="home-check">✓</span>
              Sin cuotas mensuales en el Plan Básico.
            </li>
          </ul>
        </div>

        <PhoneNfcIllustration />
      </section>

      <section className="home-future">
        <span className="home-eyebrow">
          ESTO ES SOLO EL PRINCIPIO
        </span>

        <h2>
          Tu negocio, cada vez más conectado.
        </h2>

        <p>
          TOCA comienza facilitando el acceso a las reseñas de Google.
          Seguimos trabajando para desarrollar nuevas formas de conectar
          los negocios con sus clientes.
        </p>
      </section>

      <footer className="home-footer">
        <Image
          src="/logo/toca.svg"
          alt="TOCA"
          width={100}
          height={36}
          className="home-footer-logo"
        />

        <p>
          Todo tu negocio. En un toque.
        </p>

        <span>
          © {new Date().getFullYear()} TOCA
        </span>
      </footer>
    </main>
  );
}