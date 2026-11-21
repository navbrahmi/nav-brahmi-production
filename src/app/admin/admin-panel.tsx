'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type TabType = 'earnings' | 'products' | 'orders' | 'refunds' | 'licenses';

export function AdminPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('earnings');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Common notification helper
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.refresh();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F8FAFC', color: '#0F172A' }}>
      {/* Top Admin Header */}
      <header
        style={{
          borderBottom: '1px solid #E2E8F0',
          background: '#FFFFFF',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '0.85rem 1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#E51055',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 8px rgba(229, 16, 85, 0.25)',
            }}
          >
            <Image
              src="/logos/NavBrahmi-Logo.svg"
              alt="Nav Brahmi Logo"
              width={22}
              height={26}
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0F172A', letterSpacing: '-0.015em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Nav Brahmi</span>
              <span
                style={{
                  color: '#E51055',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  background: 'rgba(229, 16, 85, 0.08)',
                  padding: '0.15rem 0.55rem',
                  borderRadius: '999px',
                  border: '1px solid rgba(229, 16, 85, 0.2)',
                }}
              >
                Control Center
              </span>
            </div>
          </div>
        </div>

        {/* Global Toast */}
        {message && (
          <div
            style={{
              padding: '0.45rem 1.1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 500,
              background: message.type === 'success' ? '#ECFDF5' : '#FEF2F2',
              border: `1px solid ${message.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
              color: message.type === 'success' ? '#065F46' : '#991B1B',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)',
            }}
          >
            <span>{message.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{message.text}</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
            Live Database
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: '#F8FAFC',
              border: '1px solid #CBD5E1',
              color: '#334155',
              padding: '0.45rem 0.9rem',
              borderRadius: '6px',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#F1F5F9';
              e.currentTarget.style.color = '#0F172A';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#F8FAFC';
              e.currentTarget.style.color = '#334155';
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Navigation Sub-header */}
      <nav
        style={{
          borderBottom: '1px solid #E2E8F0',
          background: '#FFFFFF',
          padding: '0 1.75rem',
          display: 'flex',
          gap: '2rem',
          overflowX: 'auto',
        }}
      >
        {[
          { id: 'earnings', label: '📊 Earnings & Analytics' },
          { id: 'products', label: '🏷️ Products & Pricing' },
          { id: 'orders', label: '📦 Orders & Payments' },
          { id: 'refunds', label: '💸 Refund Requests' },
          { id: 'licenses', label: '🔑 Licenses & Machine Resets' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.9rem 0',
                fontSize: '0.875rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#E51055' : '#64748B',
                borderBottom: isActive ? '2px solid #E51055' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Main Tab Content */}
      <main style={{ flex: 1, padding: '2rem 1.75rem', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
        {activeTab === 'earnings' && <EarningsTab showToast={showToast} />}
        {activeTab === 'products' && <ProductsTab showToast={showToast} />}
        {activeTab === 'orders' && <OrdersTab showToast={showToast} />}
        {activeTab === 'refunds' && <RefundsTab showToast={showToast} />}
        {activeTab === 'licenses' && <LicensesTab showToast={showToast} />}
      </main>
    </div>
  );
}

// ============================================================================
// TAB 1: EARNINGS & ANALYTICS
// ============================================================================
function EarningsTab({ showToast }: { showToast: (txt: string, type?: 'success' | 'error') => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('all');

  const fetchEarnings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/earnings?range=${range}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch {
      showToast('Failed to load earnings analytics', 'error');
    } finally {
      setLoading(false);
    }
  }, [range, showToast]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: '#0F172A', letterSpacing: '-0.02em' }}>
            Revenue & Performance Dashboard
          </h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748B' }}>
            Comprehensive sales, revenue breakdown, and order metrics across all products.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            style={{
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#0F172A',
              padding: '0.5rem 0.85rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="year">This Year</option>
          </select>

          <a
            href="/api/admin/export"
            download
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#0F172A',
              padding: '0.5rem 0.95rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            📥 Export CSV
          </a>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#64748B' }}>Loading real metrics from Supabase database…</div>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.25rem',
              marginBottom: '2rem',
            }}
          >
            <MetricCard
              label="Gross Revenue"
              value={`₹${(data?.totalEarningsINR || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              subtitle={`${data?.totalProductsSold || 0} units sold`}
              accent="#10B981"
            />
            <MetricCard
              label="Net Earnings"
              value={`₹${(data?.netEarningsINR || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              subtitle="After processed refunds"
              accent="#3B82F6"
            />
            <MetricCard
              label="Total Units Sold"
              value={data?.totalProductsSold || 0}
              subtitle="Confirmed customer licenses"
              accent="#E51055"
            />
            <MetricCard
              label="Refunded Amount"
              value={`₹${(data?.refundedAmountINR || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              subtitle={`${data?.refundedCount || 0} orders refunded`}
              accent="#EF4444"
            />
          </div>

          {/* Orders by Status Badge Row */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '1.1rem 1.5rem',
              marginBottom: '2rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1.25rem',
              alignItems: 'center',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B' }}>Orders Summary:</div>
            {Object.entries(data?.ordersByStatus || {}).map(([st, count]: any) => (
              <div key={st} style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span
                  style={{
                    padding: '0.2rem 0.55rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background:
                      st === 'PAID' || st === 'DELIVERED'
                        ? '#ECFDF5'
                        : st === 'REFUNDED'
                        ? '#FEF2F2'
                        : '#F1F5F9',
                    color:
                      st === 'PAID' || st === 'DELIVERED'
                        ? '#065F46'
                        : st === 'REFUNDED'
                        ? '#991B1B'
                        : '#475569',
                    border:
                      st === 'PAID' || st === 'DELIVERED'
                        ? '1px solid #A7F3D0'
                        : st === 'REFUNDED'
                        ? '1px solid #FECACA'
                        : '1px solid #E2E8F0',
                  }}
                >
                  {st}
                </span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>{count}</span>
              </div>
            ))}
          </div>

          {/* 14 Languages Product Breakdown Table */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', background: '#FAFAFB' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
                Product-by-Product Revenue Breakdown (All Languages)
              </h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569', fontWeight: 600 }}>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Product Name</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Code</th>
                    <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Units Sold</th>
                    <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Gross Revenue</th>
                    <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Refunds</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.productBreakdown || []).map((p: any, idx: number) => (
                    <tr
                      key={p.productId}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFB',
                      }}
                    >
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#0F172A' }}>
                        {p.name}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#64748B', fontFamily: 'monospace', fontSize: '0.825rem' }}>
                        {p.code}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right', fontWeight: 600, color: '#0F172A' }}>
                        {p.unitsSold}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                        ₹{(p.revenueMinor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right', color: p.refundsCount > 0 ? '#DC2626' : '#94A3B8', fontWeight: p.refundsCount > 0 ? 700 : 400 }}>
                        {p.refundsCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// TAB 2: PRODUCTS & PRICING MANAGEMENT
// ============================================================================
function ProductsTab({ showToast }: { showToast: (txt: string, type?: 'success' | 'error') => void }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [editName, setEditName] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      const json = await res.json();
      if (json.success) {
        setProducts(json.products);
      }
    } catch {
      showToast('Failed to load products list', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleToggleActive = async (prod: any) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: prod.id, isActive: !prod.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`${prod.name} status updated to ${!prod.isActive ? 'Active' : 'Inactive'}`);
        fetchProducts();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast(err.message || 'Update failed', 'error');
    }
  };

  const handleSavePrice = async (prodId: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: prodId,
          priceINR: parseFloat(editPrice),
          name: editName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Product pricing updated successfully! Changes applied to live checkout & Razorpay.');
        setEditingId(null);
        fetchProducts();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast(err.message || 'Price update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: '#0F172A', letterSpacing: '-0.02em' }}>
          Product Catalog & Pricing Management
        </h2>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748B' }}>
          Configure live retail prices (₹) and product availability. Updates reflect instantly in Supabase and the Razorpay gateway.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#64748B' }}>Loading product catalog…</div>
      ) : (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Product</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Code / Slug</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Current Price (INR)</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Tax Settings</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, idx) => {
                  const isEditing = editingId === p.id;
                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFB',
                      }}
                    >
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid #E51055',
                              color: '#0F172A',
                              padding: '0.4rem 0.65rem',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              width: '100%',
                              outline: 'none',
                            }}
                          />
                        ) : (
                          <div style={{ fontWeight: 600, color: '#0F172A' }}>{p.name}</div>
                        )}
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.15rem' }}>
                          {p.ordersCount} orders • {p.licensesCount} active licenses
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem', fontFamily: 'monospace', color: '#64748B' }}>
                        <div style={{ fontWeight: 600, color: '#334155' }}>{p.code}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>/{p.slug}</div>
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ color: '#64748B', fontWeight: 600 }}>₹</span>
                            <input
                              type="number"
                              step="0.01"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid #E51055',
                                color: '#0F172A',
                                padding: '0.4rem 0.65rem',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                width: '100px',
                                outline: 'none',
                              }}
                            />
                          </div>
                        ) : (
                          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#059669' }}>
                            ₹{p.priceINR?.toFixed(2)}
                            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 400, marginLeft: '0.35rem' }}>
                              ({p.priceMinor} paise)
                            </span>
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem', color: '#475569', fontSize: '0.8rem' }}>
                        {p.taxInclusive ? 'Inclusive (No extra tax)' : 'Exclusive'}
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <button
                          onClick={() => handleToggleActive(p)}
                          style={{
                            padding: '0.25rem 0.65rem',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            border: p.isActive ? '1px solid #A7F3D0' : '1px solid #FECACA',
                            cursor: 'pointer',
                            background: p.isActive ? '#ECFDF5' : '#FEF2F2',
                            color: p.isActive ? '#065F46' : '#991B1B',
                          }}
                        >
                          {p.isActive ? '● Active' : '○ Inactive'}
                        </button>
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            <button
                              disabled={saving}
                              onClick={() => handleSavePrice(p.id)}
                              style={{
                                background: '#10B981',
                                border: 'none',
                                color: '#fff',
                                padding: '0.4rem 0.85rem',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              {saving ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              disabled={saving}
                              onClick={() => setEditingId(null)}
                              style={{
                                background: '#F1F5F9',
                                border: '1px solid #CBD5E1',
                                color: '#475569',
                                padding: '0.4rem 0.75rem',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(p.id);
                              setEditPrice(p.priceINR?.toString() || '480');
                              setEditName(p.name || '');
                            }}
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid #CBD5E1',
                              color: '#334155',
                              padding: '0.4rem 0.85rem',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.borderColor = '#E51055';
                              e.currentTarget.style.color = '#E51055';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.borderColor = '#CBD5E1';
                              e.currentTarget.style.color = '#334155';
                            }}
                          >
                            Edit Price
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TAB 3: ORDERS & PAYMENTS MANAGEMENT
// ============================================================================
function OrdersTab({ showToast }: { showToast: (txt: string, type?: 'success' | 'error') => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?q=${encodeURIComponent(search)}&status=${status}`);
      const json = await res.json();
      if (json.success) {
        setOrders(json.orders);
      }
    } catch {
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, status, showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleResendEmail = async (orderId: string) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resend_email', orderId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Email sent immediately');
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to resend email', 'error');
    }
  };

  const handleReconcileOrder = async (orderId: string) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reconcile_order', orderId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Order reconciled and license issued successfully.');
        fetchOrders();
        if (selectedOrder) setSelectedOrder(null);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast(err.message || 'Reconciliation failed', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: '#0F172A', letterSpacing: '-0.02em' }}>
            Customer Orders & Transactions
          </h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748B' }}>
            Audit transactions, review payment gateway events, and resend license fulfillment emails.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search email, name, order ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#0F172A',
              padding: '0.5rem 0.85rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              outline: 'none',
              width: '260px',
            }}
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#0F172A',
              padding: '0.5rem 0.85rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">PAID</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="REFUNDED">REFUNDED</option>
            <option value="NEEDS_ATTENTION">NEEDS_ATTENTION</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#64748B' }}>Loading orders from Supabase…</div>
      ) : (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Date</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Customer</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Product</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Amount</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                      No orders found in database matching search criteria.
                    </td>
                  </tr>
                ) : (
                  orders.map((o, idx) => (
                    <tr
                      key={o.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFB',
                      }}
                    >
                      <td style={{ padding: '0.85rem 1.25rem', color: '#64748B', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {new Date(o.createdAt).toLocaleString()}
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{o.customerEmail}</div>
                        {o.customerName && <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{o.customerName}</div>}
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem', color: '#334155' }}>
                        {o.product?.name || 'Unknown Product'}
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#059669' }}>
                        ₹{o.amountINR?.toFixed(2)}
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background:
                              o.status === 'PAID' || o.status === 'DELIVERED'
                                ? '#ECFDF5'
                                : o.status === 'REFUNDED'
                                ? '#FEF2F2'
                                : '#FFFBEB',
                            color:
                              o.status === 'PAID' || o.status === 'DELIVERED'
                                ? '#065F46'
                                : o.status === 'REFUNDED'
                                ? '#991B1B'
                                : '#92400E',
                            border:
                              o.status === 'PAID' || o.status === 'DELIVERED'
                                ? '1px solid #A7F3D0'
                                : o.status === 'REFUNDED'
                                ? '1px solid #FECACA'
                                : '1px solid #FDE68A',
                          }}
                        >
                          {o.status}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setSelectedOrder(o)}
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid #CBD5E1',
                              color: '#334155',
                              padding: '0.35rem 0.65rem',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: 500,
                              cursor: 'pointer',
                            }}
                          >
                            Details
                          </button>
                          {(o.status === 'PAID' || o.status === 'DELIVERED') && (
                            <button
                              onClick={() => handleResendEmail(o.id)}
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid #CBD5E1',
                                color: '#0F172A',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                              }}
                            >
                              📧 Resend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal title={`Order Inspection: ${selectedOrder.id}`} onClose={() => setSelectedOrder(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.75rem' }}>Customer:</span>
                <div style={{ fontWeight: 600, color: '#0F172A' }}>{selectedOrder.customerEmail}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{selectedOrder.customerName || 'N/A'}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.75rem' }}>Product & Amount:</span>
                <div style={{ fontWeight: 600, color: '#0F172A' }}>{selectedOrder.product?.name}</div>
                <div style={{ fontWeight: 700, color: '#059669' }}>₹{selectedOrder.amountINR?.toFixed(2)}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.75rem' }}>Public Token:</span>
                <div style={{ fontFamily: 'monospace', color: '#0F172A', fontSize: '0.8rem' }}>{selectedOrder.publicToken}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.75rem' }}>Order Status:</span>
                <div style={{ fontWeight: 700, color: '#0F172A' }}>{selectedOrder.status}</div>
              </div>
            </div>

            {/* Payments List */}
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 600, color: '#0F172A' }}>Gateway Payments ({selectedOrder.payments?.length || 0})</h4>
              {selectedOrder.payments?.length === 0 ? (
                <div style={{ color: '#64748B', fontSize: '0.8rem' }}>No payment records linked yet.</div>
              ) : (
                selectedOrder.payments.map((pm: any) => (
                  <div key={pm.id} style={{ padding: '0.5rem 0.75rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', marginBottom: '0.4rem', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{pm.provider} Payment</span>
                      <span style={{ fontWeight: 700, color: pm.status === 'CAPTURED' ? '#059669' : '#DC2626' }}>{pm.status}</span>
                    </div>
                    <div style={{ color: '#64748B', fontFamily: 'monospace', marginTop: '0.2rem' }}>ID: {pm.providerPaymentId || 'N/A'}</div>
                  </div>
                ))
              )}
            </div>

            {/* Issued License */}
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 600, color: '#0F172A' }}>Issued Cryptographic License</h4>
              {(() => {
                const orderLicense = selectedOrder.license || selectedOrder.licenses?.[0];
                return orderLicense ? (
                  <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0066CC', fontSize: '0.95rem' }}>
                      {orderLicense.licenseKey || '[Encrypted Key Generated]'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                      Status: <strong>{orderLicense.status}</strong> • Resets: {orderLicense.resetCount ?? 0} • Activations: {orderLicense.activations?.length || orderLicense.activationsCount || 0}/1
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#64748B', fontSize: '0.8rem' }}>No license issued for this order yet.</div>
                );
              })()}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
              {selectedOrder.status !== 'PAID' && selectedOrder.status !== 'DELIVERED' && (
                <button
                  onClick={() => handleReconcileOrder(selectedOrder.id)}
                  style={{
                    background: '#059669',
                    border: 'none',
                    color: '#fff',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ⚡ Mark Paid & Issue License
                </button>
              )}
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  color: '#334155',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================================
// TAB 4: REFUND REQUESTS MANAGEMENT
// ============================================================================
function RefundsTab({ showToast }: { showToast: (txt: string, type?: 'success' | 'error') => void }) {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/refunds');
      const json = await res.json();
      if (json.success) {
        setRefunds(json.refunds);
      }
    } catch {
      showToast('Failed to load refund requests', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const handleProcessRefund = async () => {
    if (!actingId || !modalAction) return;

    try {
      const res = await fetch('/api/admin/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: modalAction,
          refundRequestId: actingId,
          reviewNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Refund request ${modalAction === 'approve' ? 'approved & processed' : 'rejected'}`);
        setModalAction(null);
        setActingId(null);
        setReviewNotes('');
        fetchRefunds();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: '#0F172A', letterSpacing: '-0.02em' }}>
          Customer Refund Requests (7-Day Policy)
        </h2>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748B' }}>
          Review customer refund submissions, record operational review notes, and revoke software license keys.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#64748B' }}>Loading refund requests…</div>
      ) : (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Requested Date</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Customer Email</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Product / Order</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Reason & Details</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {refunds.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                      No refund requests logged in database.
                    </td>
                  </tr>
                ) : (
                  refunds.map((r, idx) => (
                    <tr
                      key={r.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFB',
                      }}
                    >
                      <td style={{ padding: '0.85rem 1.25rem', color: '#64748B', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {new Date(r.requestedAt).toLocaleString()}
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#0F172A' }}>
                        {r.customerEmail}
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ color: '#0F172A', fontWeight: 600 }}>{r.order.product?.name}</div>
                        <div style={{ color: '#059669', fontSize: '0.8rem', fontWeight: 700 }}>₹{r.order.amountINR?.toFixed(2)}</div>
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem', maxWidth: '300px' }}>
                        <div style={{ color: '#0F172A', fontWeight: 500 }}>{r.reason}</div>
                        {r.supportingInfo && (
                          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem', lineHeight: '1.4' }}>
                            {r.supportingInfo}
                          </div>
                        )}
                        {r.reviewNotes && (
                          <div style={{ fontSize: '0.75rem', color: '#92400E', marginTop: '0.35rem', fontWeight: 500 }}>
                            Note: {r.reviewNotes}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background:
                              r.status === 'APPROVED'
                                ? '#ECFDF5'
                                : r.status === 'REJECTED'
                                ? '#FEF2F2'
                                : '#FFFBEB',
                            color:
                              r.status === 'APPROVED'
                                ? '#065F46'
                                : r.status === 'REJECTED'
                                ? '#991B1B'
                                : '#92400E',
                            border:
                              r.status === 'APPROVED'
                                ? '1px solid #A7F3D0'
                                : r.status === 'REJECTED'
                                ? '1px solid #FECACA'
                                : '1px solid #FDE68A',
                          }}
                        >
                          {r.status}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                        {r.status === 'PENDING_REVIEW' ? (
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => {
                                setActingId(r.id);
                                setModalAction('approve');
                              }}
                              style={{
                                background: '#10B981',
                                border: 'none',
                                color: '#fff',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setActingId(r.id);
                                setModalAction('reject');
                              }}
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid #FECACA',
                                color: '#DC2626',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Processed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approve/Reject Confirmation Modal */}
      {modalAction && (
        <Modal
          title={modalAction === 'approve' ? 'Approve Customer Refund' : 'Reject Refund Request'}
          onClose={() => {
            setModalAction(null);
            setActingId(null);
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ margin: 0, color: '#334155', fontSize: '0.875rem', lineHeight: '1.5' }}>
              {modalAction === 'approve'
                ? 'Approving this refund will mark the order as REFUNDED and permanently revoke the issued license key.'
                : 'Rejecting this refund request will leave the order and license active.'}
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>
                Operational Notes / Justification:
              </label>
              <textarea
                rows={3}
                placeholder="Enter review notes..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                style={{
                  width: '100%',
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  color: '#0F172A',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                onClick={() => {
                  setModalAction(null);
                  setActingId(null);
                }}
                style={{
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  color: '#475569',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleProcessRefund}
                style={{
                  background: modalAction === 'approve' ? '#10B981' : '#EF4444',
                  border: 'none',
                  color: '#fff',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Confirm {modalAction === 'approve' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================================
// TAB 5: LICENSES & MACHINE RESETS MANAGEMENT
// ============================================================================
function LicensesTab({ showToast }: { showToast: (txt: string, type?: 'success' | 'error') => void }) {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newProductId, setNewProductId] = useState('');
  const [sendIssueEmail, setSendIssueEmail] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [productsList, setProductsList] = useState<any[]>([]);

  const fetchLicenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/licenses?q=${encodeURIComponent(search)}&status=${status}`);
      const json = await res.json();
      if (json.success) {
        setLicenses(json.licenses);
      }
    } catch {
      showToast('Failed to load licenses', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, status, showToast]);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  useEffect(() => {
    fetch('/api/admin/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.products) setProductsList(data.products);
      })
      .catch(() => {});
  }, []);

  const handleMachineReset = async (licenseId: string) => {
    if (!confirm('Are you sure you want to reset this machine binding? The customer will be able to activate on a new machine.')) {
      return;
    }

    try {
      const res = await fetch('/api/admin/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_machine',
          licenseId,
          reason: 'Support-assisted reset from admin panel',
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchLicenses();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast(err.message || 'Machine reset failed', 'error');
    }
  };

  const handleUpdateStatus = async (licenseId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', licenseId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`License status set to ${newStatus}`);
        fetchLicenses();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast(err.message || 'Status update failed', 'error');
    }
  };

  const handleIssueManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssuing(true);
    try {
      const res = await fetch('/api/admin/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'issue_manual',
          productId: newProductId,
          email: newEmail,
          sendEmail: sendIssueEmail,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`License issued: ${data.licenseKey}`);
        setShowIssueModal(false);
        setNewEmail('');
        fetchLicenses();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to issue license', 'error');
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: '#0F172A', letterSpacing: '-0.02em' }}>
            Software License Management & Machine Resets
          </h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748B' }}>
            Inspect hardware activations, execute machine resets (C-07), and issue replacement or test licenses.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search email, key, product…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#0F172A',
              padding: '0.5rem 0.85rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              outline: 'none',
              width: '240px',
            }}
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#0F172A',
              padding: '0.5rem 0.85rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="REVOKED">REVOKED</option>
          </select>

          <button
            onClick={() => setShowIssueModal(true)}
            style={{
              background: '#E51055',
              border: 'none',
              color: '#fff',
              padding: '0.5rem 0.95rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(229, 16, 85, 0.25)',
            }}
          >
            + Issue New License
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#64748B' }}>Loading licenses…</div>
      ) : (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>License Key</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Customer Email</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Product</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Machine Binding</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {licenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                      No licenses found matching query.
                    </td>
                  </tr>
                ) : (
                  licenses.map((lic, idx) => (
                    <tr
                      key={lic.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFB',
                      }}
                    >
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0066CC', fontSize: '0.95rem' }}>
                          {lic.licenseKey || '[Encrypted]'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                          Issued: {new Date(lic.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#0F172A' }}>
                        {lic.email}
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem', color: '#334155' }}>
                        {lic.product?.name}
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: lic.activationsCount > 0 ? '#10B981' : '#94A3B8',
                            }}
                          ></span>
                          <span style={{ fontWeight: 700, color: '#0F172A' }}>{lic.activationsCount}/1</span>
                          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>(Resets: {lic.resetCount})</span>
                        </div>
                        {lic.activations[0] && (
                          <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                            Hash: {lic.activations[0].machineIdHash.slice(0, 10)}…
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <select
                          value={lic.status}
                          onChange={(e) => handleUpdateStatus(lic.id, e.target.value)}
                          style={{
                            padding: '0.25rem 0.55rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            outline: 'none',
                            background:
                              lic.status === 'ACTIVE'
                                ? '#ECFDF5'
                                : lic.status === 'REVOKED'
                                ? '#FEF2F2'
                                : '#FFFBEB',
                            color:
                              lic.status === 'ACTIVE'
                                ? '#065F46'
                                : lic.status === 'REVOKED'
                                ? '#991B1B'
                                : '#92400E',
                            border:
                              lic.status === 'ACTIVE'
                                ? '1px solid #A7F3D0'
                                : lic.status === 'REVOKED'
                                ? '1px solid #FECACA'
                                : '1px solid #FDE68A',
                          }}
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="SUSPENDED">SUSPENDED</option>
                          <option value="REVOKED">REVOKED</option>
                        </select>
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleMachineReset(lic.id)}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                            color: '#334155',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = '#E51055';
                            e.currentTarget.style.color = '#E51055';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = '#CBD5E1';
                            e.currentTarget.style.color = '#334155';
                          }}
                        >
                          🔄 Reset Machine
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Issue Manual License Modal */}
      {showIssueModal && (
        <Modal title="Issue New Cryptographic License" onClose={() => setShowIssueModal(false)}>
          <form onSubmit={handleIssueManual} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>
                Target Product:
              </label>
              <select
                required
                value={newProductId}
                onChange={(e) => setNewProductId(e.target.value)}
                style={{
                  width: '100%',
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  color: '#0F172A',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">Select a product…</option>
                {productsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code}) — ₹{p.priceINR?.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>
                Customer Email:
              </label>
              <input
                type="email"
                required
                placeholder="customer@domain.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                style={{
                  width: '100%',
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  color: '#0F172A',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="send-email"
                checked={sendIssueEmail}
                onChange={(e) => setSendIssueEmail(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="send-email" style={{ fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>
                Queue immediate license delivery email to customer
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                disabled={issuing}
                onClick={() => setShowIssueModal(false)}
                style={{
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  color: '#475569',
                  padding: '0.55rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={issuing}
                style={{
                  background: '#E51055',
                  border: 'none',
                  color: '#fff',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(229, 16, 85, 0.25)',
                }}
              >
                {issuing ? 'Generating Key…' : 'Issue License Key'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ============================================================================
// SHARED UTILITY COMPONENTS
// ============================================================================
function MetricCard({ label, value, subtitle, accent }: { label: string; value: string | number; subtitle: string; accent: string }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '1.35rem 1.5rem',
        borderLeft: `4px solid ${accent}`,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      }}
    >
      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', margin: '0.35rem 0', letterSpacing: '-0.02em' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>{subtitle}</div>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '14px',
          padding: '1.75rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B',
              fontSize: '1.25rem',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
