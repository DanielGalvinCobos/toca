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



function ContactIcon({ type }: { type: "email" | "instagram" | "tiktok" }) {

  if (type === "email") {

    return (

      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">

        <rect

          x="3"

          y="5"

          width="18"

          height="14"

          rx="3"

          stroke="currentColor"

          strokeWidth="1.8"

        />

        <path

          d="M4 7L12 13L20 7"

          stroke="currentColor"

          strokeWidth="1.8"

          strokeLinecap="round"

          strokeLinejoin="round"

        />

      </svg>

    );

  }



  if (type === "instagram") {

    return (

      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">

        <rect

          x="3"

          y="3"

          width="18"

          height="18"

          rx="5"

          stroke="currentColor"

          strokeWidth="1.8"

        />

        <circle

          cx="12"

          cy="12"

          r="4"

          stroke="currentColor"

          strokeWidth="1.8"

        />

        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />

      </svg>

    );

  }



  return (

    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">

      <path

        d="M14.5 4C14.8 6.5 16.2 8 18.5 8.2V11.5C16.9 11.4 15.4 10.9 14.2 10V15.2C14.2 18.3 12.2 20 9.5 20C6.7 20 4.5 18.2 4.5 15.5C4.5 12.9 6.5 11 9.3 11C9.7 11 10.1 11.1 10.5 11.2V14.5C10.1 14.3 9.7 14.2 9.3 14.2C8.4 14.2 7.7 14.7 7.7 15.5C7.7 16.3 8.4 16.8 9.3 16.8C10.3 16.8 11 16.2 11 15V4H14.5Z"

        fill="currentColor"

      />

    </svg>

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



      <section className="home-about">

        <div className="home-section-heading">

          <span className="home-eyebrow">¿QUÉ ES TOCA?</span>



          <h2>Tu negocio digital, más cerca de tus clientes.</h2>



          <p>

            TOCA utiliza tecnología NFC para facilitar el acceso a los

            servicios digitales de tu negocio con un simple toque.

          </p>

        </div>



        <div className="home-about-card">

          <div>

            <h3>Una forma más sencilla de conectar</h3>



            <p>

              Acerca tu móvil, accede y encuentra lo que necesitas. Sin

              aplicaciones y sin tener que buscar el negocio en Internet.

            </p>

          </div>

        </div>

      </section>



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



            <div className="home-step-icon home-step-icon-approach" aria-hidden="true">
              <svg viewBox="0 0 48 48" fill="none">
                <rect x="24" y="8" width="18" height="27" rx="3" stroke="currentColor" strokeWidth="2.2" />
                <path d="M28 13H38M28 30H38" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <rect x="5" y="14" width="13" height="23" rx="2.5" stroke="currentColor" strokeWidth="2.2" />
                <path d="M9 18H14M9 33H14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M18 22C20.5 19.5 23 19.5 25.5 22M18 27C20.5 24.5 23 24.5 25.5 27" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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



      <section className="home-future-features">

        <div className="home-section-heading">

          <span className="home-eyebrow">MÁS ALLÁ DE LAS RESEÑAS</span>



          <h2>Todo lo que podrá hacer TOCA.</h2>



          <p>

            TOCA empieza con algo sencillo y seguirá creciendo para reunir

            los servicios digitales más importantes de cada negocio.

          </p>

        </div>



        <div className="home-feature-grid">

          <article className="home-feature-card">

            <span className="home-feature-icon"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M25.8 20.2c0-.8-.1-1.6-.2-2.4H20v4.5h3.3a2.9 2.9 0 0 1-1.3 1.9v1.5h2.2c1.3-1.3 1.6-3.2 1.6-5.5Z" fill="currentColor"/><path d="M20 26.2c1.8 0 3.3-.6 4.4-1.6l-2.2-1.8c-.6.4-1.3.7-2.2.7-1.7 0-3.1-1.1-3.6-2.7h-2.3v1.6a6.6 6.6 0 0 0 5.9 3.8Z" fill="currentColor"/><path d="M16.4 20.8a4 4 0 0 1 0-2.5v-1.6h-2.3a6.6 6.6 0 0 0 0 5.7l2.3-1.6Z" fill="currentColor"/><path d="M20 15.7c1 0 1.9.3 2.6 1l1.9-1.9a6.3 6.3 0 0 0-4.5-1.8 6.6 6.6 0 0 0-5.9 3.7l2.3 1.6c.5-1.5 1.9-2.6 3.6-2.6Z" fill="currentColor"/><path d="m31 25 1.4 2.8 3.1.4-2.2 2.2.5 3.1-2.8-1.5-2.8 1.5.5-3.1-2.2-2.2 3.1-.4L31 25Z" fill="currentColor"/></svg></span>

            <h3>Reseñas</h3>

            <p>Facilita el acceso a tus reseñas de Google.</p>

          </article>



          <article className="home-feature-card">

            <span className="home-feature-icon"><svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><rect x="8" y="8" width="24" height="24" rx="7" stroke="currentColor" strokeWidth="2.5"/><circle cx="20" cy="20" r="5.5" stroke="currentColor" strokeWidth="2.5"/><circle cx="27.5" cy="12.8" r="1.7" fill="currentColor"/></svg></span>

            <h3>Redes sociales</h3>

            <p>Conecta a tus clientes con tus perfiles sociales.</p>

          </article>



          <article className="home-feature-card">

            <span className="home-feature-icon"><svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 5.5a14 14 0 0 0-12 21.2L6 34l7.6-2A14 14 0 1 0 20 5.5Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round"/><path d="M15 13.5c.5-.8 1.1-.8 1.6-.1l1.6 2.5c.3.5.2.9-.3 1.4l-1 1c1.1 2.1 2.7 3.7 4.9 4.8l1-1c.4-.4.9-.5 1.4-.2l2.4 1.5c.7.4.7 1 .1 1.6-.8 1-1.9 1.5-3.1 1.2-5.5-1.3-9.8-5.6-11.1-11.1-.3-.7.7-1.2 2.5-1.6Z" fill="currentColor"/></svg></span>

            <h3>WhatsApp</h3>

            <p>Facilita que tus clientes puedan contactar contigo.</p>

          </article>



          <article className="home-feature-card">

            <span className="home-feature-icon"><svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><rect x="9" y="6" width="22" height="28" rx="3" stroke="currentColor" strokeWidth="2.3"/><path d="M14 13h12M14 18h12M14 23h8M14 28h12" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round"/></svg></span>

            <h3>Menú digital</h3>

            <p>Muestra tus productos o servicios desde cualquier móvil.</p>

          </article>



          <article className="home-feature-card">

            <span className="home-feature-icon"><svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><rect x="6" y="9" width="28" height="25" rx="3" stroke="currentColor" strokeWidth="2.3"/><path d="M6 16h28M13 5v8M27 5v8M12 22h4M20 22h4M12 27h4" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"/></svg></span>

            <h3>Reservas</h3>

            <p>Acerca tus sistemas de reserva a tus clientes.</p>

          </article>



          <article className="home-feature-card">

            <span className="home-feature-icon"><svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M5 15.5a22 22 0 0 1 30 0M10 21a14.5 14.5 0 0 1 20 0M15.5 26.5a6.5 6.5 0 0 1 9 0M20 32h.01" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"/></svg></span>

            <h3>WiFi</h3>

            <p>Facilita el acceso a la red WiFi de tu negocio.</p>

          </article>



          <article className="home-feature-card">

            <span className="home-feature-icon"><svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><rect x="5" y="7" width="30" height="26" rx="3" stroke="currentColor" strokeWidth="2.3"/><path d="M5 14h30M10 10.5h.01M14 10.5h.01M18 10.5h.01" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"/><path d="M12 20h16M12 25h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></span>

            <h3>Página web</h3>

            <p>Reúne la información de tu negocio en un solo lugar.</p>

          </article>



          <article className="home-feature-card">

            <span className="home-feature-icon"><svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M32 17c0 8.5-12 18-12 18S8 25.5 8 17a12 12 0 1 1 24 0Z" stroke="currentColor" strokeWidth="2.5"/><circle cx="20" cy="17" r="4" stroke="currentColor" strokeWidth="2.5"/></svg></span>

            <h3>Ubicación</h3>

            <p>Ayuda a tus clientes a encontrar fácilmente tu negocio.</p>

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



      <section className="home-faq">

        <div className="home-section-heading">

          <span className="home-eyebrow">PREGUNTAS FRECUENTES</span>



          <h2>Todo claro desde el principio.</h2>

        </div>



        <div className="home-faq-list">

          <details>

            <summary>¿Qué es TOCA?</summary>

            <p>

              TOCA es una solución digital para negocios que utiliza

              tecnología NFC para facilitar el acceso de sus clientes a

              diferentes servicios digitales.

            </p>

          </details>



          <details>

            <summary>¿Necesito instalar una aplicación?</summary>

            <p>

              No. El cliente acerca su móvil al soporte TOCA y puede acceder

              directamente desde el navegador.

            </p>

          </details>



          <details>

            <summary>¿Qué móviles funcionan con TOCA?</summary>

            <p>

              La mayoría de los smartphones actuales son compatibles con

              NFC. Además, TOCA podrá incorporar QR para facilitar todavía

              más el acceso.

            </p>

          </details>



          <details>

            <summary>¿Qué incluye TOCA Básico?</summary>

            <p>

              TOCA Básico está pensado inicialmente para facilitar el acceso

              de tus clientes a las reseñas de Google mediante NFC.

            </p>

          </details>



          <details>

            <summary>¿Tiene cuota mensual?</summary>

            <p>

              El Plan Básico está planteado sin cuotas mensuales.

            </p>

          </details>



          <details>

            <summary>¿Puedo personalizar mi TOCA?</summary>

            <p>

              La personalización del producto físico está prevista para

              futuras versiones.

            </p>

          </details>



          <details>

            <summary>¿Qué otras funciones tendrá TOCA?</summary>

            <p>

              Estamos trabajando para incorporar nuevas funciones como

              contacto por WhatsApp, redes sociales, menús digitales,

              reservas, WiFi, páginas web y ubicación.

            </p>

          </details>

        </div>

      </section>



      <section className="home-contact">

        <span className="home-eyebrow">CONTACTO</span>



        <h2>¿Hablamos?</h2>



        <p>

          Si quieres conocer TOCA, tienes alguna pregunta o quieres hablar

          sobre cómo llevarlo a tu negocio, puedes contactar con nosotros.

        </p>



        <div className="home-contact-links">

          <a

            href="mailto:somostoca.oficial@gmail.com"

            className="home-contact-card"

          >

            <span className="home-contact-icon">

              <ContactIcon type="email" />

            </span>



            <span>

              <strong>Email</strong>

              <small>somostoca.oficial@gmail.com</small>

            </span>

          </a>



          <a

            href="https://www.instagram.com/somos_toca/"

            target="_blank"

            rel="noreferrer"

            className="home-contact-card"

          >

            <span className="home-contact-icon">

              <ContactIcon type="instagram" />

            </span>



            <span>

              <strong>Instagram</strong>

              <small>@somos_toca</small>

            </span>

          </a>



          <a

            href="https://www.tiktok.com/@somos_toca"

            target="_blank"

            rel="noreferrer"

            className="home-contact-card"

          >

            <span className="home-contact-icon">

              <ContactIcon type="tiktok" />

            </span>



            <span>

              <strong>TikTok</strong>

              <small>@somos_toca</small>

            </span>

          </a>

        </div>

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



        <div className="home-footer-socials">

          <a

            href="mailto:somostoca.oficial@gmail.com"

            aria-label="Email de TOCA"

          >

            <ContactIcon type="email" />

          </a>



          <a

            href="https://www.instagram.com/somos_toca/"

            target="_blank"

            rel="noreferrer"

            aria-label="Instagram de TOCA"

          >

            <ContactIcon type="instagram" />

          </a>



          <a

            href="https://www.tiktok.com/@somos_toca"

            target="_blank"

            rel="noreferrer"

            aria-label="TikTok de TOCA"

          >

            <ContactIcon type="tiktok" />

          </a>

        </div>



        <span>

          © {new Date().getFullYear()} TOCA

        </span>

      </footer>

    </main>

  );

}