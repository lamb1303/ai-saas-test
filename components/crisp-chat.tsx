import React, { useEffect } from "react";
import { Crisp } from "crisp-sdk-web";
export const CrispChat = () => {
  useEffect(() => {
    Crisp.configure("f3c86583-f7a3-4447-b792-cb477741dcf4");
  }, []);

  return null;
};
