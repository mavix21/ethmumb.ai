"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";

const Eruda = dynamic(() => import("./eruda-provider").then((c) => c.Eruda), {
  ssr: false,
});

export const ErudaProvider = (props: { children: ReactNode }) => {
  // if (env.NODE_ENV === "production") {
  //   return props.children;
  // }
  return <Eruda>{props.children}</Eruda>;
};
