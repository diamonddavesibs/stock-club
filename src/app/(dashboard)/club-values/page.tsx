"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import dashStyles from "../dashboard.module.css";
import styles from "./club-values.module.css";

interface ClubValuesResponse {
    table: {
        headers: string[];
        rows: string[][];
    };
    csv: string;
    canEdit: boolean;
    updatedAt: string | null;
    updatedBy: string | null;
}

export default function ClubValuesPage() {
    const { data: session } = useSession();
    const user = session?.user;

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [headers, setHeaders] = useState<string[]>([]);
    const [rows, setRows] = useState<string[][]>([]);
    const [csv, setCsv] = useState("");
    const [originalCsv, setOriginalCsv] = useState("");

    const [canEdit, setCanEdit] = useState(false);
    const [updatedAt, setUpdatedAt] = useState<string | null>(null);
    const [updatedBy, setUpdatedBy] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/club-values", { cache: "no-store" });
            const data: ClubValuesResponse | { error?: string } = await response.json();

            if (!response.ok) {
                throw new Error((data as { error?: string }).error || "Failed to load club values");
            }

            const parsed = data as ClubValuesResponse;
            setHeaders(parsed.table.headers);
            setRows(parsed.table.rows);
            setCsv(parsed.csv);
            setOriginalCsv(parsed.csv);
            setCanEdit(parsed.canEdit);
            setUpdatedAt(parsed.updatedAt);
            setUpdatedBy(parsed.updatedBy);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load club values");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch("/api/club-values", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ csv }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to save club values");
            }

            setHeaders(data.table.headers);
            setRows(data.table.rows);
            setOriginalCsv(data.csv);
            setUpdatedAt(data.updatedAt);
            setUpdatedBy(data.updatedBy);
            setSuccess("Club values updated.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save club values");
        } finally {
            setSaving(false);
        }
    };

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/" });
    };

    const getInitials = (name: string) =>
        name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

    const updatedLabel = useMemo(() => {
        if (!updatedAt) return "Using default dataset";
        const date = new Date(updatedAt).toLocaleString();
        return updatedBy ? `Last updated by ${updatedBy} on ${date}` : `Last updated on ${date}`;
    }, [updatedAt, updatedBy]);

    return (
        <div className={dashStyles.dashboardLayout}>
            <div
                className={`${dashStyles.sidebarOverlay} ${sidebarOpen ? dashStyles.sidebarOverlayVisible : ""}`}
                onClick={() => setSidebarOpen(false)}
            />

            <aside className={`${dashStyles.sidebar} ${sidebarOpen ? dashStyles.sidebarOpen : ""}`}>
                <div className={dashStyles.sidebarHeader}>
                    <Link href="/dashboard" className={dashStyles.sidebarLogo}>
                        <div className={dashStyles.sidebarLogoIcon}>$</div>
                        <span className={dashStyles.sidebarLogoText}>DFDII</span>
                    </Link>
                </div>

                <nav className={dashStyles.sidebarNav} onClick={() => setSidebarOpen(false)}>
                    <Link href="/dashboard" className={dashStyles.navItem}>
                        <span className={dashStyles.navIcon}>D</span>
                        Dashboard
                    </Link>
                    <Link href="/member-equity" className={dashStyles.navItem}>
                        <span className={dashStyles.navIcon}>E</span>
                        Member Equity
                    </Link>
                    <Link href="/club-values" className={`${dashStyles.navItem} ${dashStyles.navItemActive}`}>
                        <span className={dashStyles.navIcon}>C</span>
                        Club Values
                    </Link>
                    {user?.role === "ADMIN" && (
                        <Link href="/members" className={dashStyles.navItem}>
                            <span className={dashStyles.navIcon}>M</span>
                            Members
                        </Link>
                    )}
                    <Link href="/settings" className={dashStyles.navItem}>
                        <span className={dashStyles.navIcon}>S</span>
                        Settings
                    </Link>
                    {user?.role === "ADMIN" && (
                        <Link href="/admin/users" className={dashStyles.navItem}>
                            <span className={dashStyles.navIcon}>A</span>
                            Admin Panel
                        </Link>
                    )}
                </nav>

                <div className={dashStyles.sidebarFooter}>
                    <div className={dashStyles.userInfo} onClick={handleSignOut} title="Click to sign out">
                        <div className={dashStyles.userAvatar}>{user?.name ? getInitials(user.name) : "U"}</div>
                        <div className={dashStyles.userDetails}>
                            <div className={dashStyles.userName}>{user?.name || "User"}</div>
                            <div className={dashStyles.userRole}>{user?.role || "Member"}</div>
                        </div>
                    </div>
                </div>
            </aside>

            <main className={dashStyles.mainContent}>
                <div className={dashStyles.mobileHeader}>
                    <button
                        className={dashStyles.mobileMenuButton}
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open menu"
                    >
                        Menu
                    </button>
                    <div className={dashStyles.mobileHeaderLogo}>
                        <div className={dashStyles.sidebarLogoIcon}>$</div>
                        <span className={dashStyles.sidebarLogoText}>DFDII</span>
                    </div>
                </div>

                <header className={dashStyles.header}>
                    <div className={dashStyles.headerContent}>
                        <div>
                            <h1 className={dashStyles.pageTitle}>Club Values</h1>
                            <p className={styles.meta}>{updatedLabel}</p>
                        </div>
                    </div>
                </header>

                <div className={styles.page}>
                    {error && <div className={styles.error}>{error}</div>}
                    {success && <div className={styles.success}>{success}</div>}

                    {loading ? (
                        <div className={styles.loading}>Loading club values...</div>
                    ) : (
                        <>
                            <div className={styles.tableContainer}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            {headers.map((header, index) => (
                                                <th
                                                    key={header}
                                                    className={index === 0 ? styles.stickyColumn : undefined}
                                                >
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row, rowIndex) => {
                                            const isTotal = row[0]?.trim().toUpperCase() === "TOTAL";
                                            return (
                                                <tr key={`${row[0]}-${rowIndex}`} className={isTotal ? styles.totalRow : undefined}>
                                                    {row.map((cell, cellIndex) => (
                                                        <td
                                                            key={`${rowIndex}-${cellIndex}`}
                                                            className={`${cellIndex === 0 ? styles.stickyColumn : ""} ${cellIndex > 0 ? styles.numeric : ""}`.trim()}
                                                        >
                                                            {cell || "-"}
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {canEdit && (
                                <section className={styles.editor}>
                                    <h2 className={styles.editorTitle}>Monthly Data Update</h2>
                                    <p className={styles.editorHelp}>
                                        Paste the full CSV (including the header row), then save.
                                    </p>
                                    <textarea
                                        value={csv}
                                        onChange={(e) => setCsv(e.target.value)}
                                        className={styles.textarea}
                                        rows={14}
                                        spellCheck={false}
                                    />
                                    <div className={styles.editorActions}>
                                        <button
                                            type="button"
                                            onClick={() => setCsv(originalCsv)}
                                            className={styles.secondaryButton}
                                            disabled={saving}
                                        >
                                            Reset
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSave}
                                            className={styles.primaryButton}
                                            disabled={saving}
                                        >
                                            {saving ? "Saving..." : "Save Club Values"}
                                        </button>
                                    </div>
                                </section>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
