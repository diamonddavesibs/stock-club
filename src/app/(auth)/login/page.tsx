"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import styles from "../auth.module.css";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid email or password");
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

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
                        <h1 className={styles.authTitle}>Welcome back</h1>
                        <p className={styles.authSubtitle}>
                            Sign in to access your club dashboard
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && <div className={styles.errorMessage}>{error}</div>}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className={styles.authForm}>
                        <div className={styles.formGroup}>
                            <label htmlFor="email" className={styles.formLabel}>
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                className={styles.formInput}
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="password" className={styles.formLabel}>
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                className={styles.formInput}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div style={{ textAlign: "right", marginTop: "-0.5rem", marginBottom: "1rem" }}>
                            <Link href="/forgot-password" style={{ fontSize: "0.875rem", color: "var(--color-accent-primary)", textDecoration: "none" }}>
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={loading}
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className={styles.authFooter}>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                            Need an account? Contact a club administrator.
                        </p>
                        <p style={{ marginTop: '0.5rem' }}>
                            <Link href="/forgot-password">Forgot password?</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
