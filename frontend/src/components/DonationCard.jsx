import React from "react";
import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";

const DonationCard = ({ donation, children }) => {
  return (
    <div className="card-premium overflow-hidden flex flex-col">
      {donation.photoUrl ? (
        <img src={donation.photoUrl} alt={donation.foodType} className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40 w-full bg-brand-50 flex items-center justify-center text-4xl">🍛</div>
      )}
      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900">{donation.foodType}</h3>
          <StatusBadge status={donation.status} />
        </div>
        <p className="text-sm text-gray-500">{donation.quantity}</p>
        {donation.description && <p className="text-sm text-gray-600 line-clamp-2">{donation.description}</p>}
        {donation.location?.address && (
          <p className="text-xs text-gray-400">📍 {donation.location.address}</p>
        )}
        <div className="mt-auto pt-2 flex items-center justify-between">
          <Link to={`/track/${donation._id}`} className="text-sm text-brand-700 hover:underline">
            View details →
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
};

export default DonationCard;
