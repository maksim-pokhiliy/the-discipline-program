"use client";

import { useRouter } from "next/navigation";

export const useNavigate = () => useRouter().push;
