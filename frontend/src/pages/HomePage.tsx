import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { concertsApi } from "../services/api";
import type { Concert } from "../services/api";

export const HomePage: React.FC = () => {
  const {
    data: concerts,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["concerts"],
    queryFn: concertsApi.getAll,
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
          Error Loading Concerts
        </h2>
        <p className="text-gray-600">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Upcoming Concerts
        </h1>
        <p className="text-xl text-gray-600">
          Book your tickets for the hottest shows in town
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {concerts?.map((concert: Concert) => (
          <ConcertCard key={concert.id} concert={concert} />
        ))}
      </div>

      {concerts?.length === 0 && (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No Concerts Available
          </h2>
          <p className="text-gray-600">Check back later for new events!</p>
        </div>
      )}
    </div>
  );
};

const ConcertCard: React.FC<{ concert: Concert }> = ({ concert }) => {
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {concert.imageUrl && (
        <img
          src={concert.imageUrl}
          alt={concert.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {concert.title}
        </h3>
        <p className="text-gray-600 mb-2">{concert.artist}</p>
        <p className="text-sm text-gray-500 mb-4">{concert.description}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <svg
              className="w-4 h-4 mr-2"
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
          <div className="flex items-center text-sm text-gray-600">
            <svg
              className="w-4 h-4 mr-2"
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
        </div>

        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-bold text-blue-600">
            From {formatPrice(concert.basePrice)}
          </span>
          <span className="text-sm text-gray-500">
            {concert.availableSeats} seats left
          </span>
        </div>

        <Link
          to={`/concerts/${concert.id}`}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-center block"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};
