"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "../auth.module.css";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [validToken, setValidToken] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        if (!token) {
            setError("Invalid reset link");
            setIsChecking(false);
            return;
        }

        // Verify token is valid
        fetch(`/api/auth/reset-password/verify?token=${token}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.valid) {
                    setValidToken(true);
                } else {
                    setError(data.error || "Invalid or expired reset link");
                }
            })
            .catch(() => {
                setError("Failed to verify reset link");
            })
            .finally(() => {
                setIsChecking(false);
            });
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                setTimeout(() => {
                    router.push("/login");
                }, 3000);
            } else {
                setError(data.error || "Failed to reset password");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isChecking) {
        return (
            <div className={styles.authPage}>
                <div className={styles.authContainer}>
                    <div className={styles.authCard}>
                        <p style={{ padding: "2rem", textAlign: "center" }}>Verifying reset link...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className={styles.authPage}>
                <div className={styles.authContainer}>
                    <div className={styles.authCard}>
                        <div className={styles.authHeader}>
                            <div className={styles.authLogoIcon} style={{ fontSize: "3rem" }}>✓</div>
                            <h1 className={styles.authTitle}>Password Reset Successful</h1>
                            <p className={styles.authSubtitle}>
                                Your password has been updated
                            </p>
                        </div>
                        <div style={{ padding: "var(--space-lg)" }}>
                            <p style={{ marginBottom: "1.5rem", color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
                                Redirecting to login...
                            </p>
                            <Link href="/login" className={styles.submitBtn} style={{ textAlign: "center", display: "block" }}>
                                Go to Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!validToken) {
        return (
            <div className={styles.authPage}>
                <div className={styles.authContainer}>
                    <div className={styles.authCard}>
                        <div className={styles.authHeader}>
                            <div className={styles.authLogoIcon} style={{ fontSize: "3rem" }}>⚠️</div>
                            <h1 className={styles.authTitle}>Invalid Reset Link</h1>
                            <p className={styles.authSubtitle}>
                                {error || "This reset link is invalid or has expired"}
                            </p>
                        </div>
                        <div style={{ padding: "var(--space-lg)" }}>
                            <Link href="/forgot-password" className={styles.submitBtn} style={{ textAlign: "center", display: "block" }}>
                                Request New Reset Link
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
                        <h1 className={styles.authTitle}>Reset Password</h1>
                        <p className={styles.authSubtitle}>
                            Enter your new password
                        </p>
                    </div>

                    {error && <div className={styles.errorMessage}>{error}</div>}

                    <form onSubmit={handleSubmit} className={styles.authForm}>
                        <div className={styles.formGroup}>
                            <label htmlFor="password" className={styles.formLabel}>
                                New Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="At least 8 characters"
                                required
                                disabled={isSubmitting}
                                minLength={8}
                                className={styles.formInput}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="confirmPassword" className={styles.formLabel}>
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter your password"
                                required
                                disabled={isSubmitting}
                                minLength={8}
                                className={styles.formInput}
                            />
                        </div>
                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Resetting..." : "Reset Password"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className={styles.authPage}>
                <div className={styles.authContainer}>
                    <div className={styles.authCard}>
                        <p style={{ padding: "2rem", textAlign: "center" }}>Loading...</p>
                    </div>
                </div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
