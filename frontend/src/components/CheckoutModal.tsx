"use client";
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { formatINR } from '@/lib/pricing';

declare global { interface Window { Razorpay: any; } }

interface CheckoutModalProps {
  tripId: string;
  bookingType: string;
  itemName: string;
  onClose: () => void;
  onSuccess: () => void;
  initialEmail?: string;
  initialTravelers?: any[];
  basePrice?: number;
}

// ─── Payment method data ──────────────────────────────────────────────────────
const UPI_APPS = [
  { id: 'gpay',    label: 'Google Pay',  color: '#4285F4', emoji: '🔵' },
  { id: 'phonepe', label: 'PhonePe',     color: '#5f259f', emoji: '🟣' },
  { id: 'paytm',   label: 'Paytm',       color: '#00B9F1', emoji: '🔷' },
  { id: 'bhim',    label: 'BHIM',        color: '#0066B3', emoji: '🏦' },
];

const WALLETS = [
  { id: 'paytm',    label: 'Paytm Wallet', color: '#00B9F1', emoji: '👜' },
  { id: 'mobikwik', label: 'MobiKwik',     color: '#E8232A', emoji: '💰' },
  { id: 'amazon',   label: 'Amazon Pay',   color: '#FF9900', emoji: '🛒' },
  { id: 'airtel',   label: 'Airtel Money', color: '#E40000', emoji: '📡' },
];

const BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'Yes Bank', 'Punjab National Bank', 'Bank of Baroda'];

type PayMethod = 'upi' | 'card' | 'netbank' | 'wallet';

export default function CheckoutModal({
  tripId, bookingType, itemName, onClose, onSuccess,
  initialEmail, initialTravelers, basePrice,
}: CheckoutModalProps) {
  const [step, setStep] = useState<'travelers' | 'phone-otp' | 'pay' | 'done'>(initialTravelers?.length ? 'pay' : 'travelers');
  const [travelers, setTravelers] = useState(initialTravelers?.length ? initialTravelers : [{ name: '', age: '', gender: 'Male' }]);
  const [email, setEmail] = useState(initialEmail || '');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false); // Guard against double-clicks / double calls

  // Payment method state
  const [payMethod, setPayMethod] = useState<PayMethod>('upi');
  const [selectedUpi, setSelectedUpi] = useState<string | null>(null);
  const [customUpi, setCustomUpi] = useState('');
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState('');

  // Card state (demo only)
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });

  useEffect(() => { if (initialEmail && !email) setEmail(initialEmail); }, [initialEmail]);
  useEffect(() => { if (initialTravelers?.length && !travelers[0]?.name) setTravelers(initialTravelers); }, [initialTravelers]);
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const pricePerUnit = basePrice ?? (bookingType === 'Hotel' ? 4500 : 3500);
  const totalPrice = pricePerUnit * travelers.length;

  const handleFinalize = async () => {
    // Hard guard: prevent any double submission
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://127.0.0.1:8000/api/bookings/confirm_mock', {
        trip_id: tripId,
        booking_type: bookingType,
        item_name: itemName,
        travelers,
        email,
        total_price: totalPrice,
        razorpay_payment_id: 'pay_demo_' + Math.random().toString(36).substr(2, 9),
      }, { headers: { Authorization: `Bearer ${token}` } });
      // Await parent refresh FIRST so trip state is up to date, then show done
      // Small delay lets the DB commit fully before we read it back
      await new Promise(r => setTimeout(r, 400));
      await onSuccess();
      setStep('done');
    } catch {
      alert('Failed to save booking. Please try again.');
      isSubmittingRef.current = false; // Reset on failure so user can retry
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (v: string) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  // ── Confirmation screen ────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-[#1a1a2e] border border-white/10 rounded-3xl max-w-sm w-full p-10 text-center shadow-2xl shadow-green-500/10">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
            <div className="relative w-24 h-24 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-5xl border border-green-500/30">
              ✓
            </div>
          </div>
          <h3 className="text-3xl font-bold text-white mb-2">Payment Successful!</h3>
          <p className="text-gray-400 text-sm mb-1">{bookingType} booking confirmed</p>
          <p className="text-gray-500 text-xs mb-6">E-ticket sent to <span className="text-blue-400">{email}</span></p>
          <div className="bg-white/5 rounded-2xl p-4 mb-6 text-left space-y-1 border border-white/5">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Amount Paid</p>
            <p className="text-2xl font-bold text-white">{formatINR(totalPrice)}</p>
          </div>
          <button onClick={onClose} className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 py-4 rounded-2xl font-bold text-white transition-all shadow-lg shadow-blue-600/30 active:scale-[0.98]">
            Done
          </button>
        </div>
      </div>
    );
  }

  // ── Email OTP verification screen ──────────────────────────────────────────
  if (step === 'phone-otp') {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-[#1a1a2e] border border-white/10 rounded-3xl max-w-sm w-full p-8 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Email Verification</h2>
            <button onClick={() => setStep('travelers')} className="text-gray-400 hover:text-white text-sm transition-all">Back</button>
          </div>
          
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            To secure your transport booking, we need to verify your email address <strong className="text-white">{email}</strong>.
          </p>

          {otpError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">{otpError}</div>}
          
          {!otpSent ? (
            <button
              onClick={async () => {
                setOtpLoading(true); setOtpError('');
                try {
                  const token = localStorage.getItem('token');
                  await axios.post('http://127.0.0.1:8000/api/bookings/send-email-otp', { email }, { headers: { Authorization: `Bearer ${token}` } });
                  setOtpSent(true);
                } catch (err: any) {
                  console.error(err);
                  setOtpError(err?.response?.data?.detail || 'Failed to send OTP. Try again.');
                } finally {
                  setOtpLoading(false);
                }
              }}
              disabled={otpLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20"
            >
              {otpLoading ? 'Sending...' : 'Send OTP via Email'}
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2 text-center">Enter 6-digit OTP</label>
                <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} maxLength={6}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-[0.3em] font-mono outline-none focus:border-amber-500 transition-colors" placeholder="••••••" />
              </div>
              <button
                onClick={async () => {
                  if (otp.length !== 6) return setOtpError('Enter a 6-digit OTP');
                  setOtpLoading(true); setOtpError('');
                  try {
                    const token = localStorage.getItem('token');
                    await axios.post('http://127.0.0.1:8000/api/bookings/verify-email-otp', { email, otp }, { headers: { Authorization: `Bearer ${token}` } });
                    setStep('pay');
                  } catch (err: any) {
                    console.error(err);
                    setOtpError(err?.response?.data?.detail || 'Invalid OTP. Please check and try again.');
                  } finally {
                    setOtpLoading(false);
                  }
                }}
                disabled={otpLoading}
                className="w-full bg-green-600 hover:bg-green-500 py-3.5 rounded-xl font-bold text-white transition-all shadow-lg shadow-green-600/20 disabled:opacity-50 mt-2"
              >
                {otpLoading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Traveler details screen ────────────────────────────────────────────────
  if (step === 'travelers') {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-white/10 sticky top-0 bg-[#1a1a2e] z-10">
            <div>
              <h2 className="text-xl font-bold text-white">Traveler Details</h2>
              <p className="text-xs text-gray-500 mt-0.5">{bookingType}: {itemName.length > 40 ? itemName.slice(0, 40) + '…' : itemName}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xl transition-all">×</button>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Confirmation Email (for OTP & Tickets)</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all placeholder-gray-600" />
              </div>
            </div>

            {/* Travelers */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Travelers</label>
              <div className="space-y-2">
                {travelers.map((t, i) => (
                  <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-3 flex gap-2 items-center">
                    <span className="text-gray-500 text-xs font-bold w-5">{i + 1}.</span>
                    <input type="text" placeholder="Full Name" value={t.name}
                      onChange={e => { const n = [...travelers]; n[i] = { ...n[i], name: e.target.value }; setTravelers(n); }}
                      className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-600" />
                    <input type="number" placeholder="Age" value={t.age}
                      onChange={e => { const n = [...travelers]; n[i] = { ...n[i], age: e.target.value }; setTravelers(n); }}
                      className="w-14 bg-transparent outline-none text-sm text-white text-right placeholder-gray-600" />
                    <select value={t.gender} onChange={e => { const n = [...travelers]; n[i] = { ...n[i], gender: e.target.value }; setTravelers(n); }}
                      className="bg-transparent outline-none text-xs text-gray-400 ml-1 cursor-pointer">
                      <option className="bg-gray-900">Male</option>
                      <option className="bg-gray-900">Female</option>
                      <option className="bg-gray-900">Other</option>
                    </select>
                    {travelers.length > 1 && (
                      <button onClick={() => setTravelers(travelers.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 ml-1 text-lg">×</button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => setTravelers([...travelers, { name: '', age: '', gender: 'Male' }])}
                className="mt-2 text-blue-400 text-xs font-bold py-2 px-4 bg-blue-400/10 rounded-lg hover:bg-blue-400/20 transition-all">
                + Add Traveler
              </button>
            </div>

            {/* Price summary */}
            <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-2xl p-4 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-400">{travelers.length} traveler{travelers.length > 1 ? 's' : ''} × {formatINR(pricePerUnit)}</p>
                <p className="text-white font-bold text-lg">{formatINR(totalPrice)}</p>
              </div>
              <span className="text-3xl">🎟️</span>
            </div>

            <button
              onClick={() => { 
                if (!email || !travelers[0].name) { alert('Please fill in email and at least one traveler name.'); return; } 
                if (bookingType !== 'Hotel') {
                  setStep('phone-otp');
                } else {
                  setStep('pay'); 
                }
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] text-white"
            >
              Continue to Payment →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Payment screen (Razorpay-like) ────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-[420px] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">

        {/* Top blue bar */}
        <div className="bg-[#1a73e8] px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">AI</div>
            <div>
              <p className="text-white font-bold text-sm">Agentic AI Travel</p>
              <p className="text-white/70 text-xs">{bookingType} · {formatINR(totalPrice)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Demo</span>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white text-base transition-all">×</button>
          </div>
        </div>

        {/* Method tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0">
          {(['upi', 'card', 'netbank', 'wallet'] as PayMethod[]).map((m) => (
            <button key={m} onClick={() => setPayMethod(m)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-all border-b-2 ${payMethod === m ? 'border-[#1a73e8] text-[#1a73e8] bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {m === 'upi' ? 'UPI' : m === 'card' ? 'Card' : m === 'netbank' ? 'Bank' : 'Wallet'}
            </button>
          ))}
        </div>

        {/* Payment body */}
        <div className="flex-1 overflow-y-auto bg-white p-5 space-y-4">

          {/* ── UPI ── */}
          {payMethod === 'upi' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Pay with UPI Apps</p>
              <div className="grid grid-cols-2 gap-3">
                {UPI_APPS.map(app => (
                  <button key={app.id} onClick={() => setSelectedUpi(app.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${selectedUpi === app.id ? 'border-[#1a73e8] bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                    <span className="text-2xl">{app.emoji}</span>
                    <span className="text-sm font-semibold text-gray-700">{app.label}</span>
                    {selectedUpi === app.id && <span className="ml-auto text-[#1a73e8] text-sm">✓</span>}
                  </button>
                ))}
              </div>
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500 font-semibold mb-2">Or enter UPI ID</p>
                <div className="flex gap-2">
                  <input value={customUpi} onChange={e => { setCustomUpi(e.target.value); setSelectedUpi('custom'); }}
                    placeholder="yourname@upi"
                    className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-blue-200 transition-all" />
                  <button onClick={() => setSelectedUpi('custom')}
                    className="bg-[#1a73e8] hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all">
                    Verify
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3">
                <span className="text-green-600">🔒</span>
                <p className="text-xs text-green-700">UPI payments are secured by NPCI. Your bank will send an OTP.</p>
              </div>
            </div>
          )}

          {/* ── CARD ── */}
          {payMethod === 'card' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Credit / Debit Card <span className="text-gray-400 normal-case font-normal">(demo only)</span></p>
              
              {/* Card preview */}
              <div className="relative h-36 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1a73e8] to-[#6c4fe0] p-5 shadow-lg">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-6" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-white/70 text-xs">DEMO CARD</span>
                    <span className="text-white font-bold text-sm">{card.number.startsWith('4') ? 'VISA' : card.number.startsWith('5') ? 'MC' : '●●●●'}</span>
                  </div>
                  <p className="text-white font-mono text-lg tracking-widest mb-3">
                    {card.number || '•••• •••• •••• ••••'}
                  </p>
                  <div className="flex justify-between text-xs text-white/80">
                    <span>{card.name || 'CARD HOLDER'}</span>
                    <span>{card.expiry || 'MM/YY'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Card Number</label>
                  <input value={card.number} onChange={e => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                    placeholder="1234 5678 9012 3456" maxLength={19}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1a73e8] transition-all font-mono tracking-wider" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Cardholder Name</label>
                  <input value={card.name} onChange={e => setCard({ ...card, name: e.target.value.toUpperCase() })}
                    placeholder="AS ON CARD"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1a73e8] transition-all uppercase tracking-wider" />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block mb-1">Expiry</label>
                    <input value={card.expiry} onChange={e => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                      placeholder="MM/YY" maxLength={5}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1a73e8] transition-all font-mono" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block mb-1">CVV</label>
                    <input value={card.cvv} onChange={e => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                      placeholder="•••" type="password" maxLength={4}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1a73e8] transition-all font-mono" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3">
                <span>🔐</span>
                <p className="text-xs text-blue-700">Your card details are not stored. This is a demo only.</p>
              </div>
            </div>
          )}

          {/* ── NETBANKING ── */}
          {payMethod === 'netbank' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Select Your Bank</p>
              <div className="grid grid-cols-2 gap-2">
                {BANKS.map(bank => (
                  <button key={bank} onClick={() => setSelectedBank(bank)}
                    className={`text-left px-4 py-3 rounded-xl border-2 text-sm transition-all ${selectedBank === bank ? 'border-[#1a73e8] bg-blue-50 text-[#1a73e8] font-semibold' : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}>
                    🏦 {bank.split(' ').slice(0, 2).join(' ')}
                    {selectedBank === bank && <span className="float-right text-[#1a73e8]">✓</span>}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <span>⚡</span>
                <p className="text-xs text-yellow-700">You'll be redirected to your bank's secure portal to complete the payment.</p>
              </div>
            </div>
          )}

          {/* ── WALLET ── */}
          {payMethod === 'wallet' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Select Wallet</p>
              {WALLETS.map(w => (
                <button key={w.id} onClick={() => setSelectedWallet(w.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${selectedWallet === w.id ? 'border-[#1a73e8] bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                  <span className="text-3xl">{w.emoji}</span>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-800">{w.label}</p>
                    <p className="text-xs text-gray-400">Instant payment · No extra charges</p>
                  </div>
                  {selectedWallet === w.id && <span className="ml-auto text-[#1a73e8] text-lg">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer — Pay button */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex-shrink-0">
          <button
            onClick={handleFinalize}
            disabled={loading}
            className="w-full bg-[#1a73e8] hover:bg-blue-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
            ) : (
              <>{payMethod === 'upi' ? '📲' : payMethod === 'card' ? '💳' : payMethod === 'netbank' ? '🏦' : '👛'} Pay {formatINR(totalPrice)}</>
            )}
          </button>
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <span className="text-gray-400 text-[10px]">🔒 Secured by</span>
            <span className="text-[#1a73e8] font-bold text-[10px]">Razorpay</span>
            <span className="text-gray-300 text-[10px]">·</span>
            <span className="text-gray-400 text-[10px]">256-bit SSL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
