import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { concertsApi } from "../services/api";

interface PendingBooking {
  booking: any;
  clientSecret: string;
  concert: any;
  seat: any;
}

export const CheckoutPage: React.FC = () => {
  const [pendingBooking, setPendingBooking] = useState<PendingBooking | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("pendingBooking");
    if (stored) {
      setPendingBooking(JSON.parse(stored));
    } else {
      navigate("/");
    }
  }, [navigate]);

  const handlePayment = async () => {
    if (!pendingBooking) return;

    setIsProcessing(true);
    try {
      // In a real implementation, you would integrate with Stripe Elements here
      // For now, we'll simulate a successful payment
      await concertsApi.confirmBooking(
        pendingBooking.booking.stripePaymentIntentId
      );

      // Clear pending booking
      localStorage.removeItem("pendingBooking");

      // Redirect to account page
      navigate("/account");
    } catch (error: any) {
      alert(error.response?.data?.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!pendingBooking) return;

    try {
      await concertsApi.cancelBooking(pendingBooking.booking.id);
      localStorage.removeItem("pendingBooking");
      navigate("/");
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to cancel booking");
    }
  };

  if (!pendingBooking) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          No Pending Booking
        </h2>
        <p className="text-gray-600">You don't have any pending bookings.</p>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Complete Your Purchase
        </h1>

        {/* Booking Summary */}
        <div className="border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Booking Summary
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Concert:</span>
              <span className="font-medium">
                {pendingBooking.concert.title}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Artist:</span>
              <span className="font-medium">
                {pendingBooking.concert.artist}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">
                {new Date(pendingBooking.concert.date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Venue:</span>
              <span className="font-medium">
                {pendingBooking.concert.venue}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Seat:</span>
              <span className="font-medium">
                {pendingBooking.seat.section} - {pendingBooking.seat.row} -{" "}
                {pendingBooking.seat.seatNumber}
              </span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>{formatPrice(pendingBooking.seat.price)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form Placeholder */}
        <div className="border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Payment Information
          </h2>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-gray-600 text-center">
              In a real implementation, Stripe Elements would be integrated here
              for secure payment processing.
            </p>
            <p className="text-gray-500 text-sm text-center mt-2">
              For demo purposes, clicking "Complete Purchase" will simulate a
              successful payment.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={handleCancel}
            className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 transition-colors"
          >
            Cancel Booking
          </button>
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing..." : "Complete Purchase"}
          </button>
        </div>
      </div>
    </div>
  );
};
