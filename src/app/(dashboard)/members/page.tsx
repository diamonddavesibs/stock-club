"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import dashStyles from "../dashboard.module.css";
import styles from "./members.module.css";

interface Member {
    id: string;
    name: string;
    email: string;
    role: "admin" | "member";
    joinDate: string;
    contribution: number;
    portfolioShare: number;
    status: "active" | "inactive";
    avatar?: string;
}

// Sample members data
const sampleMembers: Member[] = [
    { id: "1", name: "Alice Johnson", email: "alice@dfdii.com", role: "admin", joinDate: "2022-01-15", contribution: 15000, portfolioShare: 18.5, status: "active" },
    { id: "2", name: "Bob Smith", email: "bob@dfdii.com", role: "member", joinDate: "2022-02-20", contribution: 12000, portfolioShare: 14.8, status: "active" },
    { id: "3", name: "Carol Davis", email: "carol@dfdii.com", role: "member", joinDate: "2022-03-10", contribution: 10000, portfolioShare: 12.3, status: "active" },
    { id: "4", name: "David Wilson", email: "david@dfdii.com", role: "member", joinDate: "2022-04-05", contribution: 13500, portfolioShare: 16.6, status: "active" },
    { id: "5", name: "Emma Brown", email: "emma@dfdii.com", role: "member", joinDate: "2022-05-12", contribution: 11000, portfolioShare: 13.5, status: "active" },
    { id: "6", name: "Frank Martinez", email: "frank@dfdii.com", role: "member", joinDate: "2022-06-18", contribution: 9500, portfolioShare: 11.7, status: "active" },
    { id: "7", name: "Grace Lee", email: "grace@dfdii.com", role: "member", joinDate: "2022-07-22", contribution: 10500, portfolioShare: 12.9, status: "active" },
    { id: "8", name: "Henry Chen", email: "henry@dfdii.com", role: "member", joinDate: "2023-01-08", contribution: 8000, portfolioShare: 9.9, status: "inactive" },
];

type SortKey = "name" | "role" | "joinDate" | "contribution" | "portfolioShare";
type SortOrder = "asc" | "desc";

export default function MembersPage() {
    const { data: session } = useSession();
    const user = session?.user;
    const [members] = useState<Member[]>(sampleMembers);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterRole, setFilterRole] = useState<string>("ALL");
    const [filterStatus, setFilterStatus] = useState<string>("ALL");
    const [sortKey, setSortKey] = useState<SortKey>("name");
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

    const getInitials = (name: string) => {
        return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    };

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/" });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
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
            filtered = filtered.filter((m) => m.role === filterRole);
        }

        // Apply status filter
        if (filterStatus !== "ALL") {
            filtered = filtered.filter((m) => m.status === filterStatus);
        }

        // Apply sorting
        return [...filtered].sort((a, b) => {
            let aVal: string | number;
            let bVal: string | number;

            if (sortKey === "name" || sortKey === "role" || sortKey === "joinDate") {
                aVal = a[sortKey];
                bVal = b[sortKey];
                if (typeof aVal === "string" && typeof bVal === "string") {
                    return sortOrder === "asc"
                        ? aVal.localeCompare(bVal)
                        : bVal.localeCompare(aVal);
                }
            } else {
                aVal = a[sortKey];
                bVal = b[sortKey];
            }

            return sortOrder === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
        });
    }, [members, searchQuery, filterRole, filterStatus, sortKey, sortOrder]);

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
    const activeMembers = members.filter(m => m.status === "active").length;
    const totalContributions = members.reduce((sum, m) => sum + m.contribution, 0);
    const avgContribution = totalContributions / members.length;

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
                                <option value="admin">Admin</option>
                                <option value="member">Member</option>
                            </select>
                            <select
                                className={styles.filterSelect}
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="ALL">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
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
                            <div className={styles.summaryValue}>{members.length}</div>
                        </div>
                        <div className={styles.summaryCard}>
                            <div className={styles.summaryLabel}>Active Members</div>
                            <div className={styles.summaryValue} style={{ color: 'var(--color-success)' }}>
                                {activeMembers}
                            </div>
                        </div>
                        <div className={styles.summaryCard}>
                            <div className={styles.summaryLabel}>Total Contributions</div>
                            <div className={styles.summaryValue}>{formatCurrency(totalContributions)}</div>
                        </div>
                        <div className={styles.summaryCard}>
                            <div className={styles.summaryLabel}>Avg Contribution</div>
                            <div className={styles.summaryValue}>{formatCurrency(avgContribution)}</div>
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
                                            <th onClick={() => handleSort("joinDate")}>
                                                Join Date <SortIcon column="joinDate" />
                                            </th>
                                            <th onClick={() => handleSort("contribution")}>
                                                Contribution <SortIcon column="contribution" />
                                            </th>
                                            <th onClick={() => handleSort("portfolioShare")}>
                                                Portfolio Share <SortIcon column="portfolioShare" />
                                            </th>
                                            <th>Status</th>
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
                                                    <span className={`${styles.roleBadge} ${member.role === "admin" ? styles.roleAdmin : styles.roleMember}`}>
                                                        {member.role}
                                                    </span>
                                                </td>
                                                <td className={styles.dateCell}>{formatDate(member.joinDate)}</td>
                                                <td className={styles.numericCell}>{formatCurrency(member.contribution)}</td>
                                                <td>
                                                    <div className={styles.shareCell}>
                                                        <div className={styles.shareBar}>
                                                            <div
                                                                className={styles.shareFill}
                                                                style={{ width: `${member.portfolioShare}%` }}
                                                            />
                                                        </div>
                                                        <span className={styles.sharePercent}>{member.portfolioShare.toFixed(1)}%</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`${styles.statusBadge} ${member.status === "active" ? styles.statusActive : styles.statusInactive}`}>
                                                        {member.status}
                                                    </span>
                                                </td>
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
