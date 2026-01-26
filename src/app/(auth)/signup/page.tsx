import Link from "next/link";
import styles from "../auth.module.css";

export default function SignupPage() {
    return (
        <div className={styles.authPage}>
            <div className={styles.authContainer}>
                <div className={styles.authCard}>
                    {/* Header */}
                    <div className={styles.authHeader}>
                        <Link href="/" className={styles.authLogo}>
                            <div className={styles.authLogoIcon}>💵</div>
                            <span className={styles.authLogoText}>DFDII</span>
                        </Link>
                        <h1 className={styles.authTitle}>Invitation Only</h1>
                        <p className={styles.authSubtitle}>
                            Contact an administrator to request access
                        </p>
                    </div>

                    {/* Info Message */}
                    <div style={{
                        padding: 'var(--space-md)',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--space-lg)',
                        textAlign: 'center'
                    }}>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0, lineHeight: 1.6 }}>
                            <strong>DFDII Stock Club</strong> is a private investment club.<br />
                            New member accounts must be created by a club administrator.<br /><br />
                            If you would like to join, please contact an existing member.
                        </p>
                    </div>

                    {/* Footer */}
                    <div className={styles.authFooter}>
                        <p>
                            Already have an account?{" "}
                            <Link href="/login">Sign in</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
