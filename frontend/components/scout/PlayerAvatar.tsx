"use client";

import { DEFAULT_AVATAR } from "@/lib/utils";

interface Props {
  image: string;
}

export default function PlayerAvatar({
  image,
}: Props) {
  return (
    <div className="h-16 w-16 overflow-hidden rounded-full border">
      <img
        src={image || DEFAULT_AVATAR}
        alt=""
        referrerPolicy="no-referrer"
        className="h-full w-full object-cover"
        onError={(e) => {
          e.currentTarget.src = DEFAULT_AVATAR;
        }}
      />
    </div>
  );
}