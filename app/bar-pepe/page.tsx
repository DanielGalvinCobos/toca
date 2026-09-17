import styles from "./page.module.css";

const googleReviewUrl = "https://www.google.com/";

export default function BarPepe() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1>TOCA</h1>

        <h2>Bar Pepe</h2>

        <a
          className={styles.reviewButton}
          href={googleReviewUrl}
        >
          ⭐ Dejar reseña en Google
        </a>
      </div>
    </main>
  );
}