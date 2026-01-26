"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface AllocationData {
    symbol: string;
    name: string;
    value: number;
    percentage: number;
}

interface PortfolioAllocationChartProps {
    data: AllocationData[];
    height?: number;
}

const COLORS = [
    'rgb(59, 130, 246)',   // Blue
    'rgb(168, 85, 247)',   // Purple
    'rgb(236, 72, 153)',   // Pink
    'rgb(251, 146, 60)',   // Orange
    'rgb(34, 197, 94)',    // Green
    'rgb(234, 179, 8)',    // Yellow
    'rgb(239, 68, 68)',    // Red
    'rgb(20, 184, 166)',   // Teal
    'rgb(99, 102, 241)',   // Indigo
    'rgb(244, 63, 94)',    // Rose
];

export default function PortfolioAllocationChart({ data, height = 300 }: PortfolioAllocationChartProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-sm) var(--space-md)',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}>
                    <p style={{ margin: 0, marginBottom: 'var(--space-xs)', color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
                        {data.symbol}
                    </p>
                    <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.8125rem', marginBottom: 'var(--space-xs)' }}>
                        {data.name}
                    </p>
                    <p style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '0.875rem', fontWeight: 600 }}>
                        {formatCurrency(data.value)}
                    </p>
                    <p style={{ margin: 0, color: 'var(--color-accent-primary)', fontSize: '0.875rem' }}>
                        {data.percentage.toFixed(1)}% of portfolio
                    </p>
                </div>
            );
        }
        return null;
    };

    const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
        if (percentage < 5) return null; // Don't show labels for small slices

        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                style={{ fontSize: '0.875rem', fontWeight: 600 }}
            >
                {`${percentage.toFixed(0)}%`}
            </text>
        );
    };

    const CustomLegend = ({ payload }: any) => {
        return (
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 'var(--space-sm)',
                marginTop: 'var(--space-md)',
                fontSize: '0.8125rem',
            }}>
                {payload.map((entry: any, index: number) => (
                    <div key={`legend-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                        <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '2px',
                            background: entry.color,
                            flexShrink: 0,
                        }} />
                        <span style={{
                            color: 'var(--color-text-primary)',
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {entry.payload.symbol}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <ResponsiveContainer width="100%" height={height}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={CustomLabel}
                    outerRadius={100}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
            </PieChart>
        </ResponsiveContainer>
    );
}
