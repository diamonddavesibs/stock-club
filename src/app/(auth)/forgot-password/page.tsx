"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "../auth.module.css";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
            } else {
                setError(data.error || "Failed to send reset email");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className={styles.authPage}>
                <div className={styles.authContainer}>
                    <div className={styles.authCard}>
                        <div className={styles.authHeader}>
                            <div className={styles.authLogoIcon} style={{ fontSize: "3rem" }}>✓</div>
                            <h1 className={styles.authTitle}>Check Your Email</h1>
                            <p className={styles.authSubtitle}>
                                We&apos;ve sent a password reset link to {email}
                            </p>
                        </div>
                        <div style={{ padding: "var(--space-lg)" }}>
                            <p style={{ marginBottom: "1.5rem", color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
                                The link will expire in 24 hours. If you don&apos;t see the email, check your spam folder.
                            </p>
                            <Link href="/login" className={styles.submitBtn} style={{ textAlign: "center", display: "block" }}>
                                Back to Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.authPage}>
            <div className={styles.authContainer}>
                <div className={styles.authCard}>
                    <div className={styles.authHeader}>
                        <Link href="/" className={styles.authLogo}>
                            <div className={styles.authLogoIcon}>💵</div>
                            <span className={styles.authLogoText}>DFDII</span>
                        </Link>
                        <h1 className={styles.authTitle}>Forgot Password?</h1>
                        <p className={styles.authSubtitle}>
                            Enter your email to receive a reset link
                        </p>
                    </div>

                    {error && <div className={styles.errorMessage}>{error}</div>}

                    <form onSubmit={handleSubmit} className={styles.authForm}>
                        <div className={styles.formGroup}>
                            <label htmlFor="email" className={styles.formLabel}>
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="member@dfdii.com"
                                required
                                disabled={isSubmitting}
                                className={styles.formInput}
                            />
                        </div>
                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Sending..." : "Send Reset Link"}
                        </button>
                    </form>

                    <div className={styles.authFooter}>
                        <p>
                            Remember your password?{" "}
                            <Link href="/login">Sign in</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
