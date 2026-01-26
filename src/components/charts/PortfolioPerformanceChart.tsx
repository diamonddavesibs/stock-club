"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PerformanceDataPoint {
    date: string;
    value: number;
    cost: number;
}

interface PortfolioPerformanceChartProps {
    data: PerformanceDataPoint[];
    height?: number;
}

export default function PortfolioPerformanceChart({ data, height = 300 }: PortfolioPerformanceChartProps) {
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
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-sm) var(--space-md)',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}>
                    <p style={{ margin: 0, marginBottom: 'var(--space-xs)', color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
                        {new Date(payload[0].payload.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    <p style={{ margin: 0, color: 'var(--color-accent-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
                        Value: {formatCurrency(payload[0].value)}
                    </p>
                    {payload[1] && (
                        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                            Cost: {formatCurrency(payload[1].value)}
                        </p>
                    )}
                    <p style={{ margin: 0, marginTop: 'var(--space-xs)', color: payload[0].value >= payload[1]?.value ? 'var(--color-success)' : 'var(--color-danger)', fontSize: '0.875rem' }}>
                        {payload[0].value >= payload[1]?.value ? '+' : ''}{formatCurrency(payload[0].value - payload[1]?.value)} ({((payload[0].value - payload[1]?.value) / payload[1]?.value * 100).toFixed(2)}%)
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="rgb(59, 130, 246)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="rgb(59, 130, 246)" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" />
                <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke="var(--color-text-secondary)"
                    style={{ fontSize: '0.75rem' }}
                />
                <YAxis
                    tickFormatter={formatCurrency}
                    stroke="var(--color-text-secondary)"
                    style={{ fontSize: '0.75rem' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                    wrapperStyle={{ fontSize: '0.875rem', paddingTop: '1rem' }}
                    iconType="line"
                />
                <Line
                    type="monotone"
                    dataKey="value"
                    stroke="rgb(59, 130, 246)"
                    strokeWidth={3}
                    dot={{ fill: 'rgb(59, 130, 246)', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Portfolio Value"
                    fill="url(#colorValue)"
                />
                <Line
                    type="monotone"
                    dataKey="cost"
                    stroke="rgba(156, 163, 175, 0.6)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Cost Basis"
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
