"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dashStyles from "../dashboard.module.css";
import styles from "./upload.module.css";
import { Holding, PortfolioData } from "@/lib/types";
import { parseSchwabPositionsCSV, parseSchwabTransactionsCSV, calculatePortfolioTotals } from "@/lib/schwab-parser";

export default function UploadPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const user = session?.user;

    const [positionsFile, setPositionsFile] = useState<File | null>(null);
    const [transactionsFile, setTransactionsFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<PortfolioData | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [dragActive, setDragActive] = useState<"positions" | "transactions" | null>(null);

    // Password change state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);

    const positionsInputRef = useRef<HTMLInputElement>(null);
    const transactionsInputRef = useRef<HTMLInputElement>(null);

    const getInitials = (name: string) => {
        return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    };

    const handleDrag = useCallback((e: React.DragEvent, type: "positions" | "transactions", entering: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(entering ? type : null);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent, type: "positions" | "transactions") => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(null);
        setError("");

        const files = e.dataTransfer.files;
        if (files?.[0]) {
            const file = files[0];
            if (!file.name.endsWith(".csv")) {
                setError("Please upload a CSV file");
                return;
            }
            if (type === "positions") {
                setPositionsFile(file);
                await processFiles(file, transactionsFile);
            } else {
                setTransactionsFile(file);
                await processFiles(positionsFile, file);
            }
        }
    }, [positionsFile, transactionsFile]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: "positions" | "transactions") => {
        setError("");
        const file = e.target.files?.[0];
        if (file) {
            if (!file.name.endsWith(".csv")) {
                setError("Please upload a CSV file");
                return;
            }
            if (type === "positions") {
                setPositionsFile(file);
                await processFiles(file, transactionsFile);
            } else {
                setTransactionsFile(file);
                await processFiles(positionsFile, file);
            }
        }
    };

    const processFiles = async (positions: File | null, transactions: File | null) => {
        if (!positions) {
            setParsedData(null);
            return;
        }

        try {
            const positionsContent = await positions.text();
            const holdings = parseSchwabPositionsCSV(positionsContent);

            let transactionsList: ReturnType<typeof parseSchwabTransactionsCSV> = [];
            if (transactions) {
                const transactionsContent = await transactions.text();
                transactionsList = parseSchwabTransactionsCSV(transactionsContent);
            }

            const portfolioData = calculatePortfolioTotals(holdings, transactionsList);
            setParsedData(portfolioData);
        } catch (err) {
            setError("Error parsing CSV file. Please make sure it's a valid Schwab export.");
            console.error(err);
        }
    };

    const removeFile = (type: "positions" | "transactions") => {
        if (type === "positions") {
            setPositionsFile(null);
            setParsedData(null);
            if (positionsInputRef.current) positionsInputRef.current.value = "";
        } else {
            setTransactionsFile(null);
            if (transactionsInputRef.current) transactionsInputRef.current.value = "";
            if (positionsFile) {
                processFiles(positionsFile, null);
            }
        }
    };

    const handleSave = async () => {
        if (!parsedData || !user?.id) return;

        try {
            const response = await fetch("/api/portfolio/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(parsedData),
            });

            if (response.ok) {
                setSuccess("Portfolio data saved successfully! Redirecting to dashboard...");

                setTimeout(() => {
                    router.push("/dashboard");
                }, 1500);
            } else {
                setError("Failed to save portfolio data. Please try again.");
            }
        } catch (err) {
            setError("Failed to save portfolio data. Please try again.");
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError("");
        setPasswordSuccess("");

        // Validation
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError("New passwords do not match");
            return;
        }

        if (passwordForm.newPassword.length < 8) {
            setPasswordError("New password must be at least 8 characters");
            return;
        }

        setPasswordLoading(true);

        try {
            const response = await fetch("/api/user/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setPasswordSuccess("Password changed successfully!");
                setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                setPasswordError(data.error || "Failed to change password");
            }
        } catch (error) {
            setPasswordError("Failed to change password. Please try again.");
        } finally {
            setPasswordLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(value);
    };

    const formatPercent = (value: number) => {
        return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
    };

    return (
        <div className={dashStyles.dashboardLayout}>
            {/* Sidebar */}
            <aside className={dashStyles.sidebar}>
                <div className={dashStyles.sidebarHeader}>
                    <Link href="/dashboard" className={dashStyles.sidebarLogo}>
                        <div className={dashStyles.sidebarLogoIcon}>💵</div>
                        <span className={dashStyles.sidebarLogoText}>DFDII</span>
                    </Link>
                </div>

                <nav className={dashStyles.sidebarNav}>
                    <Link href="/dashboard" className={dashStyles.navItem}>
                        <span className={dashStyles.navIcon}>📊</span>
                        Dashboard
                    </Link>
                    <Link href="/portfolio" className={dashStyles.navItem}>
                        <span className={dashStyles.navIcon}>💼</span>
                        Portfolio
                    </Link>
                    <Link href="/transactions" className={dashStyles.navItem}>
                        <span className={dashStyles.navIcon}>📋</span>
                        Transactions
                    </Link>
                    {user?.role === "ADMIN" && (
                        <Link href="/members" className={dashStyles.navItem}>
                            <span className={dashStyles.navIcon}>👥</span>
                            Members
                        </Link>
                    )}
                    <Link href="/settings" className={`${dashStyles.navItem} ${dashStyles.navItemActive}`}>
                        <span className={dashStyles.navIcon}>⚙️</span>
                        Settings
                    </Link>
                    {user?.role === "ADMIN" && (
                        <Link href="/admin/users" className={dashStyles.navItem}>
                            <span className={dashStyles.navIcon}>🔐</span>
                            Admin Panel
                        </Link>
                    )}
                </nav>

                <div className={dashStyles.sidebarFooter}>
                    <div className={dashStyles.userInfo}>
                        <div className={dashStyles.userAvatar}>
                            {user?.name ? getInitials(user.name) : "U"}
                        </div>
                        <div className={dashStyles.userDetails}>
                            <div className={dashStyles.userName}>{user?.name || "User"}</div>
                            <div className={dashStyles.userRole}>{user?.role || "Member"}</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={dashStyles.mainContent}>
                <header className={dashStyles.header}>
                    <div className={dashStyles.headerContent}>
                        <h1 className={dashStyles.pageTitle}>Settings</h1>
                    </div>
                </header>

                <div className={styles.uploadPage}>
                    {/* Password Change Section */}
                    <div className={styles.uploadCard} style={{ marginBottom: 'var(--space-xl)' }}>
                        <h2 className={styles.uploadCardTitle}>🔐 Change Password</h2>
                        <p className={styles.uploadCardDesc}>
                            Update your account password
                        </p>

                        {/* Password Success/Error Messages */}
                        {passwordSuccess && <div className={styles.successMessage}>✓ {passwordSuccess}</div>}
                        {passwordError && <div className={styles.errorMessage}>⚠ {passwordError}</div>}

                        <form onSubmit={handlePasswordChange} style={{ marginTop: 'var(--space-md)' }}>
                            <div style={{ marginBottom: 'var(--space-md)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 500 }}>
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: 'var(--space-sm)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: '0.875rem'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: 'var(--space-md)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 500 }}>
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    required
                                    minLength={8}
                                    style={{
                                        width: '100%',
                                        padding: 'var(--space-sm)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: '0.875rem'
                                    }}
                                />
                                <small style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                                    Minimum 8 characters
                                </small>
                            </div>

                            <div style={{ marginBottom: 'var(--space-md)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 500 }}>
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: 'var(--space-sm)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: '0.875rem'
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={passwordLoading}
                                style={{
                                    padding: 'var(--space-sm) var(--space-lg)',
                                    background: 'var(--color-accent-primary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    cursor: passwordLoading ? 'not-allowed' : 'pointer',
                                    opacity: passwordLoading ? 0.6 : 1
                                }}
                            >
                                {passwordLoading ? 'Changing Password...' : 'Change Password'}
                            </button>
                        </form>
                    </div>

                    {/* Portfolio Upload Section */}
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
                        Import Schwab Data
                    </h2>

                    {/* Success/Error Messages */}
                    {success && <div className={styles.successMessage}>✓ {success}</div>}
                    {error && <div className={styles.errorMessage}>⚠ {error}</div>}

                    {/* Upload Cards */}
                    <div className={styles.uploadGrid}>
                        {/* Positions Upload */}
                        <div className={styles.uploadCard}>
                            <h2 className={styles.uploadCardTitle}>
                                📊 Portfolio Positions
                            </h2>
                            <p className={styles.uploadCardDesc}>
                                Upload your Schwab positions export to see current holdings
                            </p>

                            <div
                                className={`${styles.dropZone} ${dragActive === "positions" ? styles.dropZoneActive : ""}`}
                                onDragEnter={(e) => handleDrag(e, "positions", true)}
                                onDragLeave={(e) => handleDrag(e, "positions", false)}
                                onDragOver={(e) => handleDrag(e, "positions", true)}
                                onDrop={(e) => handleDrop(e, "positions")}
                                onClick={() => positionsInputRef.current?.click()}
                            >
                                <div className={styles.dropZoneIcon}>📁</div>
                                <div className={styles.dropZoneText}>
                                    Drag & drop your positions CSV here
                                </div>
                                <div className={styles.dropZoneHint}>
                                    or click to browse files
                                </div>
                                <input
                                    ref={positionsInputRef}
                                    type="file"
                                    accept=".csv"
                                    className={styles.fileInput}
                                    onChange={(e) => handleFileSelect(e, "positions")}
                                />
                            </div>

                            {positionsFile && (
                                <div className={styles.uploadedFile}>
                                    <span className={styles.uploadedFileIcon}>✓</span>
                                    <div className={styles.uploadedFileInfo}>
                                        <div className={styles.uploadedFileName}>{positionsFile.name}</div>
                                        <div className={styles.uploadedFileSize}>
                                            {(positionsFile.size / 1024).toFixed(1)} KB
                                        </div>
                                    </div>
                                    <button
                                        className={styles.removeFile}
                                        onClick={() => removeFile("positions")}
                                        title="Remove file"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Transactions Upload */}
                        <div className={styles.uploadCard}>
                            <h2 className={styles.uploadCardTitle}>
                                📋 Transaction History
                            </h2>
                            <p className={styles.uploadCardDesc}>
                                Optional: Upload transaction history for more insights
                            </p>

                            <div
                                className={`${styles.dropZone} ${dragActive === "transactions" ? styles.dropZoneActive : ""}`}
                                onDragEnter={(e) => handleDrag(e, "transactions", true)}
                                onDragLeave={(e) => handleDrag(e, "transactions", false)}
                                onDragOver={(e) => handleDrag(e, "transactions", true)}
                                onDrop={(e) => handleDrop(e, "transactions")}
                                onClick={() => transactionsInputRef.current?.click()}
                            >
                                <div className={styles.dropZoneIcon}>📁</div>
                                <div className={styles.dropZoneText}>
                                    Drag & drop your transactions CSV here
                                </div>
                                <div className={styles.dropZoneHint}>
                                    or click to browse files
                                </div>
                                <input
                                    ref={transactionsInputRef}
                                    type="file"
                                    accept=".csv"
                                    className={styles.fileInput}
                                    onChange={(e) => handleFileSelect(e, "transactions")}
                                />
                            </div>

                            {transactionsFile && (
                                <div className={styles.uploadedFile}>
                                    <span className={styles.uploadedFileIcon}>✓</span>
                                    <div className={styles.uploadedFileInfo}>
                                        <div className={styles.uploadedFileName}>{transactionsFile.name}</div>
                                        <div className={styles.uploadedFileSize}>
                                            {(transactionsFile.size / 1024).toFixed(1)} KB
                                        </div>
                                    </div>
                                    <button
                                        className={styles.removeFile}
                                        onClick={() => removeFile("transactions")}
                                        title="Remove file"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Parsed Results Preview */}
                    {parsedData && parsedData.holdings.length > 0 && (
                        <div className={styles.resultsSection}>
                            <div className={styles.resultsHeader}>
                                <h2 className={styles.resultsTitle}>📈 Preview</h2>
                                <div className={styles.resultsStats}>
                                    <div className={styles.resultsStat}>
                                        <div className={styles.resultsStatValue}>{parsedData.holdings.length}</div>
                                        <div className={styles.resultsStatLabel}>Holdings</div>
                                    </div>
                                    <div className={styles.resultsStat}>
                                        <div className={styles.resultsStatValue}>{formatCurrency(parsedData.totalValue)}</div>
                                        <div className={styles.resultsStatLabel}>Total Value</div>
                                    </div>
                                    <div className={styles.resultsStat}>
                                        <div className={styles.resultsStatValue} style={{ color: parsedData.totalGainLoss >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                            {formatCurrency(parsedData.totalGainLoss)}
                                        </div>
                                        <div className={styles.resultsStatLabel}>Gain/Loss</div>
                                    </div>
                                </div>
                            </div>

                            <table className={styles.previewTable}>
                                <thead>
                                    <tr>
                                        <th>Symbol</th>
                                        <th>Name</th>
                                        <th>Shares</th>
                                        <th>Price</th>
                                        <th>Value</th>
                                        <th>Gain/Loss</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedData.holdings.slice(0, 10).map((holding, index) => (
                                        <tr key={index}>
                                            <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{holding.symbol}</td>
                                            <td style={{ color: 'var(--color-text-secondary)' }}>{holding.name}</td>
                                            <td>{holding.quantity.toFixed(2)}</td>
                                            <td>{formatCurrency(holding.currentPrice)}</td>
                                            <td>{formatCurrency(holding.marketValue)}</td>
                                            <td style={{ color: holding.gainLoss >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                                {formatCurrency(holding.gainLoss)} ({formatPercent(holding.gainLossPercent)})
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {parsedData.holdings.length > 10 && (
                                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: 'var(--space-md)', fontSize: '0.875rem' }}>
                                    ... and {parsedData.holdings.length - 10} more holdings
                                </p>
                            )}

                            <div className={styles.actionButtons}>
                                <button className={styles.btnClear} onClick={() => {
                                    setPositionsFile(null);
                                    setTransactionsFile(null);
                                    setParsedData(null);
                                    setSuccess("");
                                }}>
                                    Clear All
                                </button>
                                <button className={styles.btnSave} onClick={handleSave}>
                                    Save & Apply to Dashboard
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className={styles.instructions}>
                        <h3 className={styles.instructionsTitle}>📘 How to Export from Schwab</h3>
                        <ol className={styles.instructionsList}>
                            <li>Log in to your Schwab account at schwab.com</li>
                            <li>Go to <strong>Accounts</strong> → <strong>Positions</strong></li>
                            <li>Click the <strong>Export</strong> button (usually top-right)</li>
                            <li>Select <strong>CSV</strong> format and download</li>
                            <li>Upload the downloaded file above</li>
                        </ol>
                    </div>
                </div>
            </main>
        </div>
    );
}
