"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import styles from "../auth.module.css";

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Check if user just registered
    const justRegistered = searchParams.get("registered") === "true";

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

                    {/* Success Message */}
                    {justRegistered && (
                        <div className={styles.successMessage}>
                            Account created successfully! Please sign in.
                        </div>
                    )}

                    {/* Error Message */}
                    {error && <div className={styles.errorMessage}>{error}</div>}

                    {/* Demo Credentials Info */}
                    <div style={{
                        padding: 'var(--space-md)',
                        background: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--space-lg)',
                        fontSize: '0.8125rem',
                        color: 'var(--color-text-secondary)'
                    }}>
                        <strong>Demo Credentials:</strong><br />
                        Email: member@dfdii.com<br />
                        Password: password123
                    </div>

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
                            <div className={styles.forgotPassword}>
                                <Link href="/forgot-password">Forgot password?</Link>
                            </div>
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
                        <p>
                            Don&apos;t have an account?{" "}
                            <Link href="/signup">Create one</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
