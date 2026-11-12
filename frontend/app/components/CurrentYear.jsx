"use client";

import { useState } from "react";

export default function CurrentYear() {
  const [year] = useState(() => new Date().getFullYear());

  return year;
}
