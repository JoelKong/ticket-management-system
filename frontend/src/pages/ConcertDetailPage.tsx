import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { concertsApi } from "../services/api";
import type { Seat } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

export const ConcertDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);

  const { data: concert, isLoading: concertLoading } = useQuery({
    queryKey: ["concert", id],
    queryFn: () => concertsApi.getById(id!),
    enabled: !!id,
  });

  const { data: seats, isLoading: seatsLoading } = useQuery({
    queryKey: ["seats", id],
    queryFn: () => concertsApi.getSeatAvailability(id!),
    enabled: !!id,
  });

  const handleSeatSelect = (seat: Seat) => {
    if (seat.status === "available" && seat.redisStatus !== "reserved") {
      setSelectedSeat(seat);
    }
  };

  const handleReserveSeat = async () => {
    if (!selectedSeat || !user) {
      navigate("/login");
      return;
    }

    try {
      const response = await concertsApi.reserveSeat(
        concert!.id,
        selectedSeat.id
      );
      // Store booking info for checkout
      localStorage.setItem(
        "pendingBooking",
        JSON.stringify({
          booking: response.booking,
          clientSecret: response.clientSecret,
          concert: concert,
          seat: selectedSeat,
        })
      );
      navigate("/checkout");
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to reserve seat");
    }
  };

  if (concertLoading || seatsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!concert) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Concert Not Found
        </h2>
        <p className="text-gray-600">
          The concert you're looking for doesn't exist.
        </p>
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Concert Info */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            {concert.imageUrl && (
              <img
                src={concert.imageUrl}
                alt={concert.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {concert.title}
            </h1>
            <p className="text-xl text-gray-600 mb-4">{concert.artist}</p>
            <p className="text-gray-700 mb-6">{concert.description}</p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center text-gray-600">
                <svg
                  className="w-5 h-5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {formatDate(concert.date)}
              </div>
              <div className="flex items-center text-gray-600">
                <svg
                  className="w-5 h-5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {concert.venue}, {concert.location}
              </div>
              <div className="flex items-center text-gray-600">
                <svg
                  className="w-5 h-5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
                From {formatPrice(concert.basePrice)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seat Selection */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Select Your Seat
        </h2>

        {selectedSeat && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900">Selected Seat</h3>
            <p className="text-blue-700">
              {selectedSeat.section} - {selectedSeat.row} - Seat{" "}
              {selectedSeat.seatNumber}
            </p>
            <p className="text-blue-700 font-semibold">
              Price: {formatPrice(selectedSeat.price)}
            </p>
          </div>
        )}

        <div className="grid grid-cols-10 gap-2 mb-6">
          {seats?.map((seat) => (
            <button
              key={seat.id}
              onClick={() => handleSeatSelect(seat)}
              disabled={
                seat.status !== "available" || seat.redisStatus === "reserved"
              }
              className={`p-2 text-xs rounded ${
                selectedSeat?.id === seat.id
                  ? "bg-blue-600 text-white"
                  : seat.status === "available" &&
                    seat.redisStatus !== "reserved"
                  ? "bg-green-200 text-green-800 hover:bg-green-300"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {seat.seatNumber}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-200 rounded mr-2"></div>
              Available
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-300 rounded mr-2"></div>
              Reserved/Sold
            </div>
          </div>

          {selectedSeat && (
            <button
              onClick={handleReserveSeat}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Reserve Seat
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
