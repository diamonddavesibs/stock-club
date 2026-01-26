"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../../dashboard.module.css";
import adminStyles from "./admin.module.css";

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
}

export default function AdminUsersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "MEMBER",
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Redirect non-admin users
    useEffect(() => {
        if (status === "authenticated" && session?.user?.role !== "ADMIN") {
            router.push("/dashboard");
        }
    }, [session, status, router]);

    // Load users
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const response = await fetch("/api/admin/users");
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users);
            }
        } catch (err) {
            setError("Failed to load users");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            const response = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(`User created! Temporary password: ${data.temporaryPassword}`);
                setFormData({ name: "", email: "", role: "MEMBER" });
                setShowCreateForm(false);
                loadUsers();
            } else {
                setError(data.error || "Failed to create user");
            }
        } catch (err) {
            setError("Failed to create user");
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setSuccess("User deleted successfully");
                loadUsers();
            } else {
                const data = await response.json();
                setError(data.error || "Failed to delete user");
            }
        } catch (err) {
            setError("Failed to delete user");
        }
    };

    const handleResetPassword = async (userId: string, userEmail: string) => {
        if (!confirm(`Send password reset email to ${userEmail}?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
                method: "POST",
            });

            if (response.ok) {
                setSuccess("Password reset email sent successfully");
            } else {
                const data = await response.json();
                setError(data.error || "Failed to send reset email");
            }
        } catch (err) {
            setError("Failed to send reset email");
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/" });
    };

    if (status === "loading" || isLoading) {
        return <div>Loading...</div>;
    }

    if (session?.user?.role !== "ADMIN") {
        return null;
    }

    return (
        <div className={styles.dashboardLayout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <Link href="/dashboard" className={styles.sidebarLogo}>
                        <div className={styles.sidebarLogoIcon}>💵</div>
                        <span className={styles.sidebarLogoText}>DFDII</span>
                    </Link>
                </div>

                <nav className={styles.sidebarNav}>
                    <Link href="/dashboard" className={styles.navItem}>
                        <span className={styles.navIcon}>📊</span>
                        Dashboard
                    </Link>
                    <Link href="/portfolio" className={styles.navItem}>
                        <span className={styles.navIcon}>💼</span>
                        Portfolio
                    </Link>
                    <Link href="/transactions" className={styles.navItem}>
                        <span className={styles.navIcon}>📋</span>
                        Transactions
                    </Link>
                    <Link href="/members" className={styles.navItem}>
                        <span className={styles.navIcon}>👥</span>
                        Members
                    </Link>
                    <Link href="/admin/users" className={`${styles.navItem} ${styles.navItemActive}`}>
                        <span className={styles.navIcon}>🛡️</span>
                        Admin Panel
                    </Link>
                    <Link href="/settings" className={styles.navItem}>
                        <span className={styles.navIcon}>⚙️</span>
                        Settings
                    </Link>
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.userInfo} onClick={handleSignOut} title="Click to sign out">
                        <div className={styles.userAvatar}>
                            {session.user?.name ? getInitials(session.user.name) : "U"}
                        </div>
                        <div className={styles.userDetails}>
                            <div className={styles.userName}>{session.user?.name || "User"}</div>
                            <div className={styles.userRole}>{session.user?.role || "Member"}</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.mainContent}>
                <header className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1 className={styles.pageTitle}>User Management</h1>
                        <button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            className={styles.primaryButton}
                        >
                            + Create User
                        </button>
                    </div>
                </header>

                <div className={styles.pageContent}>
                    {/* Alerts */}
                    {error && (
                        <div className={adminStyles.alert} style={{ background: "rgba(239, 68, 68, 0.1)", borderColor: "#ef4444", color: "#ef4444" }}>
                            {error}
                            <button onClick={() => setError("")} className={adminStyles.alertClose}>×</button>
                        </div>
                    )}
                    {success && (
                        <div className={adminStyles.alert} style={{ background: "rgba(16, 185, 129, 0.1)", borderColor: "#10b981", color: "#10b981" }}>
                            {success}
                            <button onClick={() => setSuccess("")} className={adminStyles.alertClose}>×</button>
                        </div>
                    )}

                    {/* Create User Form */}
                    {showCreateForm && (
                        <div className={adminStyles.formCard}>
                            <h2>Create New User</h2>
                            <form onSubmit={handleCreateUser}>
                                <div className={adminStyles.formGroup}>
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        placeholder="John Doe"
                                        className={adminStyles.formInput}
                                    />
                                </div>
                                <div className={adminStyles.formGroup}>
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        placeholder="john@example.com"
                                        className={adminStyles.formInput}
                                    />
                                </div>
                                <div className={adminStyles.formGroup}>
                                    <label>Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className={adminStyles.formInput}
                                    >
                                        <option value="MEMBER">Member</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>
                                <div className={adminStyles.formActions}>
                                    <button type="button" onClick={() => setShowCreateForm(false)} className={adminStyles.secondaryButton}>
                                        Cancel
                                    </button>
                                    <button type="submit" className={adminStyles.primaryButton}>
                                        Create User
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Users Table */}
                    <div className={adminStyles.tableCard}>
                        <h2>All Users ({users.length})</h2>
                        <table className={adminStyles.usersTable}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className={`${adminStyles.badge} ${user.role === 'ADMIN' ? adminStyles.badgeAdmin : adminStyles.badgeMember}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <div className={adminStyles.actions}>
                                                <button
                                                    onClick={() => handleResetPassword(user.id, user.email)}
                                                    className={adminStyles.actionButton}
                                                    title="Send password reset email"
                                                >
                                                    🔑 Reset
                                                </button>
                                                {session.user?.id !== user.id && (
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className={`${adminStyles.actionButton} ${adminStyles.actionButtonDanger}`}
                                                        title="Delete user"
                                                    >
                                                        🗑️ Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
