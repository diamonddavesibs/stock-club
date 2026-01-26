"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import dashStyles from "../dashboard.module.css";
import styles from "./members.module.css";

interface Member {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
}

type SortKey = "name" | "role" | "createdAt";
type SortOrder = "asc" | "desc";

export default function MembersPage() {
    const { data: session } = useSession();
    const user = session?.user;
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterRole, setFilterRole] = useState<string>("ALL");
    const [sortKey, setSortKey] = useState<SortKey>("name");
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

    // Fetch real users from the database
    useEffect(() => {
        const fetchUsers = async () => {
            if (!user?.id) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch("/api/admin/users");
                if (response.ok) {
                    const { users } = await response.json();
                    setMembers(users);
                }
            } catch (error) {
                console.error("Failed to load members:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [user?.id]);

    const getInitials = (name: string) => {
        return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    };

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/" });
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    };

    // Filter and sort members
    const filteredAndSortedMembers = useMemo(() => {
        let filtered = members;

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = members.filter(
                (m) =>
                    m.name.toLowerCase().includes(query) ||
                    m.email.toLowerCase().includes(query)
            );
        }

        // Apply role filter
        if (filterRole !== "ALL") {
            filtered = filtered.filter((m) => m.role.toUpperCase() === filterRole);
        }

        // Apply sorting
        return [...filtered].sort((a, b) => {
            let aVal: string;
            let bVal: string;

            if (sortKey === "name" || sortKey === "role" || sortKey === "createdAt") {
                aVal = a[sortKey];
                bVal = b[sortKey];
                return sortOrder === "asc"
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }

            return 0;
        });
    }, [members, searchQuery, filterRole, sortKey, sortOrder]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortOrder(key === "name" ? "asc" : "desc");
        }
    };

    const SortIcon = ({ column }: { column: SortKey }) => {
        const isActive = sortKey === column;
        return (
            <span className={`${styles.sortIndicator} ${isActive ? styles.sortActive : ""}`}>
                {isActive ? (sortOrder === "asc" ? "↑" : "↓") : "↕"}
            </span>
        );
    };

    // Calculate summary stats
    const totalMembers = members.length;
    const adminCount = members.filter(m => m.role === "ADMIN").length;
    const memberCount = members.filter(m => m.role === "MEMBER").length;

    if (isLoading) {
        return (
            <div className={dashStyles.dashboardLayout}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100%' }}>
                    <p style={{ color: 'var(--color-text-muted)' }}>Loading members...</p>
                </div>
            </div>
        );
    }

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
                    <Link href="/members" className={`${dashStyles.navItem} ${dashStyles.navItemActive}`}>
                        <span className={dashStyles.navIcon}>👥</span>
                        Members
                    </Link>
                    <Link href="/settings" className={dashStyles.navItem}>
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
                    <div className={dashStyles.userInfo} onClick={handleSignOut} title="Click to sign out">
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
                        <h1 className={dashStyles.pageTitle}>Club Members</h1>
                        <div className={dashStyles.headerActions}>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                {members.length} total members
                            </span>
                        </div>
                    </div>
                </header>

                <div className={styles.membersPage}>
                    {/* Header */}
                    <div className={styles.membersHeader}>
                        <h2 className={styles.membersTitle}>
                            {filteredAndSortedMembers.length} Member{filteredAndSortedMembers.length !== 1 ? 's' : ''}
                        </h2>
                        <div className={styles.membersActions}>
                            <select
                                className={styles.filterSelect}
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                            >
                                <option value="ALL">All Roles</option>
                                <option value="ADMIN">Admin</option>
                                <option value="MEMBER">Member</option>
                            </select>
                            <input
                                type="text"
                                placeholder="Search members..."
                                className={styles.searchInput}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className={styles.summaryGrid}>
                        <div className={styles.summaryCard}>
                            <div className={styles.summaryLabel}>Total Members</div>
                            <div className={styles.summaryValue}>{totalMembers}</div>
                        </div>
                        <div className={styles.summaryCard}>
                            <div className={styles.summaryLabel}>Administrators</div>
                            <div className={styles.summaryValue} style={{ color: 'var(--color-accent-primary)' }}>
                                {adminCount}
                            </div>
                        </div>
                        <div className={styles.summaryCard}>
                            <div className={styles.summaryLabel}>Club Members</div>
                            <div className={styles.summaryValue} style={{ color: 'var(--color-success)' }}>
                                {memberCount}
                            </div>
                        </div>
                    </div>

                    {/* Members Table */}
                    <div className={styles.membersCard}>
                        {filteredAndSortedMembers.length > 0 ? (
                            <div className={styles.tableContainer}>
                                <table className={styles.membersTable}>
                                    <thead>
                                        <tr>
                                            <th onClick={() => handleSort("name")}>
                                                Member <SortIcon column="name" />
                                            </th>
                                            <th onClick={() => handleSort("role")}>
                                                Role <SortIcon column="role" />
                                            </th>
                                            <th onClick={() => handleSort("createdAt")}>
                                                Join Date <SortIcon column="createdAt" />
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAndSortedMembers.map((member) => (
                                            <tr key={member.id}>
                                                <td>
                                                    <div className={styles.memberCell}>
                                                        <div className={styles.memberAvatar}>
                                                            {getInitials(member.name)}
                                                        </div>
                                                        <div className={styles.memberInfo}>
                                                            <div className={styles.memberName}>{member.name}</div>
                                                            <div className={styles.memberEmail}>{member.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`${styles.roleBadge} ${member.role === "ADMIN" ? styles.roleAdmin : styles.roleMember}`}>
                                                        {member.role}
                                                    </span>
                                                </td>
                                                <td className={styles.dateCell}>{formatDate(member.createdAt)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>🔍</div>
                                <h3 className={styles.emptyTitle}>No members found</h3>
                                <p className={styles.emptyText}>
                                    No members match your search or filter criteria.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
