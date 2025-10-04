import React from "react";
import { useQuery } from "@tanstack/react-query";
import { concertsApi } from "../services/api";
import type { Booking } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

export const AccountPage: React.FC = () => {
  const { user } = useAuth();
  const {
    data: bookings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["userBookings"],
    queryFn: concertsApi.getUserBookings,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Error Loading Bookings
        </h2>
        <p className="text-gray-600">Please try again later.</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Account</h1>
        <p className="text-gray-600">
          Welcome back, {user?.firstName}! Here are your ticket bookings.
        </p>
      </div>

      {bookings && bookings.length > 0 ? (
        <div className="space-y-6">
          {bookings.map((booking: Booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {booking.seat.concert?.title || "Concert"}
                  </h3>
                  <p className="text-gray-600">
                    {booking.seat.concert?.artist || "Artist"}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    booking.status
                  )}`}
                >
                  {booking.status.charAt(0).toUpperCase() +
                    booking.status.slice(1)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Event Details
                  </h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Date:</span>{" "}
                      {booking.seat.concert?.date
                        ? formatDate(booking.seat.concert.date)
                        : "TBD"}
                    </p>
                    <p>
                      <span className="font-medium">Venue:</span>{" "}
                      {booking.seat.concert?.venue || "TBD"}
                    </p>
                    <p>
                      <span className="font-medium">Location:</span>{" "}
                      {booking.seat.concert?.location || "TBD"}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Seat Details
                  </h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Section:</span>{" "}
                      {booking.seat.section}
                    </p>
                    <p>
                      <span className="font-medium">Row:</span>{" "}
                      {booking.seat.row}
                    </p>
                    <p>
                      <span className="font-medium">Seat:</span>{" "}
                      {booking.seat.seatNumber}
                    </p>
                    <p>
                      <span className="font-medium">Price:</span>{" "}
                      <span className="font-semibold text-green-600">
                        {formatPrice(booking.amount)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Booking ID: {booking.id.slice(0, 8)}...</span>
                  <span>Booked on: {formatDate(booking.createdAt)}</span>
                </div>
                {booking.confirmedAt && (
                  <div className="text-sm text-gray-500 mt-1">
                    Confirmed on: {formatDate(booking.confirmedAt)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No Bookings Yet
          </h2>
          <p className="text-gray-600 mb-6">
            You haven't booked any tickets yet. Browse our concerts and find
            your perfect show!
          </p>
          <a
            href="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Browse Concerts
          </a>
        </div>
      )}
    </div>
  );
};
