import React from "react";
import Image from "next/image";

export const Loader = () => {
  return (
    <div className="h-full flex flex-col gap-y-4 items-center justify-center">
      <div className="w-10 h-10 relative">
        <Image alt="logo" fill src={"/spin.png"} className="animate-spin" />
      </div>
      <div className="text-sm text-muted-foreground">Genius is thinking...</div>
    </div>
  );
};
