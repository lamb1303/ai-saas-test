import React from "react";
import Image from "next/image";

interface EmptyProps {
  label: string;
}

export const Empty = ({ label }: EmptyProps) => {
  return (
    <div className="h-full p-20 flex flex-col items-center justify-center">
      <div className="relative h-72 w-72">
        <Image alt="empty" sizes="xl" fill src={"/empty.png"}></Image>
      </div>
      <p className="text-mutted-foreground text-sm text-center">{label}</p>
    </div>
  );
};
