import React, { useState } from 'react';
import axios from 'axios';

interface CheckoutModalProps {
  tripId: string;
  bookingType: string; // 'Flight', 'Train', 'Hotel'
  itemName: string; // 'LHR to JFK', 'Taj Mahal Palace'
  onClose: () => void;
  onSuccess: () => void;
  initialEmail?: string;
  initialTravelers?: any[];
}

export default function CheckoutModal({ tripId, bookingType, itemName, onClose, onSuccess, initialEmail, initialTravelers }: CheckoutModalProps) {
  const [step, setStep] = useState(1);
  const [travelers, setTravelers] = useState(initialTravelers && initialTravelers.length > 0 ? initialTravelers : [{ name: '', age: '', gender: 'Male' }]);
  const [email, setEmail] = useState(initialEmail || '');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('checkout_email');
      const savedTravelers = localStorage.getItem('checkout_travelers');
      
      let finalEmail = email;
      let finalTravelers = travelers;
      
      if (savedEmail && savedTravelers) {
        finalEmail = savedEmail;
        finalTravelers = JSON.parse(savedTravelers);
        setEmail(finalEmail);
        setTravelers(finalTravelers);
      }
      
      if (finalEmail && finalTravelers[0]?.name) {
        setStep(2); // Auto-skip to Bill Summary
      }
    } catch (e) {}
  }, []);

  const estimatedPrice = bookingType === 'Hotel' ? 4500 : 2500;
  const totalPrice = estimatedPrice * travelers.length;

  const handleAddTraveler = () => {
    setTravelers([...travelers, { name: '', age: '', gender: 'Male' }]);
  };

  const handlePayment = async () => {
    setLoading(true);
    // Fake Razorpay delay
    setTimeout(async () => {
      try {
        const token = localStorage.getItem("token");
        await axios.post(`http://127.0.0.1:8000/api/bookings/confirm_mock`, {
          trip_id: tripId,
          booking_type: bookingType,
          item_name: itemName,
          travelers: travelers,
          email: email,
          total_price: totalPrice
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLoading(false);
        setStep(3); // Success
      } catch (err) {
        setLoading(false);
        alert("Failed to confirm booking.");
      }
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-xl max-w-lg w-full p-6 text-white overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Booking Checkout</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-blue-400">{bookingType}: {itemName}</h3>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Contact Email for Ticket</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" 
                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white"
              />
            </div>

            <div className="pt-4 border-t border-white/10">
              <h4 className="font-bold mb-3">Traveler Details</h4>
              {travelers.map((t, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    value={t.name}
                    onChange={e => {
                      const newT = [...travelers];
                      newT[idx].name = e.target.value;
                      setTravelers(newT);
                    }}
                    className="flex-1 bg-black/50 border border-white/10 rounded-lg p-2"
                  />
                  <input 
                    type="number" 
                    placeholder="Age" 
                    value={t.age}
                    onChange={e => {
                      const newT = [...travelers];
                      newT[idx].age = e.target.value;
                      setTravelers(newT);
                    }}
                    className="w-20 bg-black/50 border border-white/10 rounded-lg p-2"
                  />
                  <select 
                    value={t.gender}
                    onChange={e => {
                      const newT = [...travelers];
                      newT[idx].gender = e.target.value;
                      setTravelers(newT);
                    }}
                    className="bg-black/50 border border-white/10 rounded-lg p-2"
                  >
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
              ))}
              <button onClick={handleAddTraveler} className="text-blue-400 text-sm font-medium mt-2">+ Add Traveler</button>
            </div>

            <button 
              onClick={() => {
                if (!email || travelers.some(t => !t.name || !t.age)) {
                  alert("Please fill all details.");
                  return;
                }
                try {
                  localStorage.setItem('checkout_email', email);
                  localStorage.setItem('checkout_travelers', JSON.stringify(travelers));
                } catch (e) {}
                setStep(2);
              }} 
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg mt-6"
            >
              Continue to Bill
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold">Bill Summary</h3>
            <div className="bg-black/50 border border-white/10 rounded-lg p-4 space-y-2 text-sm text-gray-300">
              <div className="flex justify-between">
                <span>{bookingType} Ticket x {travelers.length}</span>
                <span>₹{totalPrice}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes & Fees</span>
                <span>₹0 (Promo)</span>
              </div>
              <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-white text-lg">
                <span>Total Amount</span>
                <span>₹{totalPrice}</span>
              </div>
            </div>

            <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 text-center">
              <p className="text-blue-400 font-medium mb-4">Secure Payment via Razorpay</p>
              <button 
                onClick={handlePayment} 
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-500/30"
              >
                {loading ? "Processing..." : `Pay ₹0 (Test Mode)`}
              </button>
            </div>
            
            <button onClick={() => setStep(1)} className="text-gray-400 text-sm hover:text-white w-full text-center">
              &larr; Back to Details
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-green-400 mb-2">Booking Confirmed!</h3>
            <p className="text-gray-400 mb-6">
              Your {bookingType.toLowerCase()} ticket has been generated successfully. 
              We have sent the ticket to <strong className="text-white">{email}</strong>.
            </p>
            <button 
              onClick={() => {
                onClose();
                onSuccess();
              }} 
              className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
