import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.landing}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          {/* Logo */}
          <div className={styles.logo}>
            <div className={styles.logoIcon}>💵</div>
            <span className={styles.logoText}>DFDII</span>
          </div>

          {/* Hero Text */}
          <h1 className={styles.heroTitle}>
            Dining for Dollars II
          </h1>
          <p className={styles.heroSubtitle}>
            Track our club&apos;s portfolio performance, view holdings,
            and stay informed with real-time market data.
          </p>

          {/* Call to Actions */}
          <div className={styles.heroCtas}>
            <Link href="/login" className="btn btn-primary btn-lg">
              Sign In
            </Link>
            <Link href="/signup" className="btn btn-secondary btn-lg">
              Create Account
            </Link>
          </div>

          {/* Stats Preview */}
          <div className={styles.statsPreview}>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Portfolio Value</div>
              <div className={styles.statValue}>$124,850</div>
              <div className={`${styles.statChange} ${styles.positive}`}>
                +12.4% YTD
              </div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Total Holdings</div>
              <div className={styles.statValue}>18</div>
              <div className={styles.statChange} style={{ color: 'var(--color-text-muted)' }}>
                Diversified
              </div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Today&apos;s Change</div>
              <div className={`${styles.statValue} ${styles.positive}`}>+$1,247</div>
              <div className={`${styles.statChange} ${styles.positive}`}>
                +1.01%
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
