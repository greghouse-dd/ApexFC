"use client";

interface Props {
  rating: number;
}

export default function PlayerRating({
  rating,
}: Props) {
  let color = "bg-red-500";

  if (rating >= 90) {
    color = "bg-emerald-500";
  } else if (rating >= 80) {
    color = "bg-lime-500";
  } else if (rating >= 70) {
    color = "bg-yellow-500";
  }

  return (
    <div
      className={`${color} flex h-12 w-12 items-center justify-center rounded-full font-bold text-white`}
    >
      {rating}
    </div>
  );
}