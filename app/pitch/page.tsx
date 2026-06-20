import type { Metadata } from "next"

import { PitchDeck } from "@/components/pitch/pitch-deck"

export const metadata: Metadata = {
  title: "MentyTarget — Pitch Deck",
  description:
    "An interactive pitch for MentyTarget: infrastructure, AI ranking models, and live 3D structural validation for psychiatric drug-target discovery.",
}

export default function PitchPage() {
  return <PitchDeck />
}
