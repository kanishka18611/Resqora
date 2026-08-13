export type EmergencyChecklist = {
  title: string;
  steps: string[];
};

const CHECKLISTS: Record<string, EmergencyChecklist> = {
  accident: {
    title: "Road accident",
    steps: [
      "Move to a safe place away from traffic if you can walk.",
      "Do not move seriously injured victims — you can worsen spinal injuries.",
      "Switch on hazard lights and keep the scene visible to other drivers.",
      "Apply firm pressure to any heavy bleeding with a clean cloth.",
      "Stay on the line with responders and wait for them to arrive.",
    ],
  },
  medical: {
    title: "Medical emergency",
    steps: [
      "Stay seated or lying down — avoid any exertion.",
      "Loosen tight clothing and keep the airway clear.",
      "If chest pain is present and you are not allergic, chew one aspirin.",
      "Unlock the door so responders can reach you.",
      "If the person stops breathing, start chest compressions at 100–120/min.",
    ],
  },
  fire: {
    title: "Fire",
    steps: [
      "Evacuate immediately — do not collect belongings.",
      "Avoid elevators; use the stairs.",
      "Stay low to breathe under the smoke layer.",
      "Close doors behind you to slow the fire down.",
      "Move to fresh air and stay well clear of the building.",
    ],
  },
  crime: {
    title: "Crime or assault",
    steps: [
      "Get to a public, well-lit place with other people.",
      "Do not confront or chase the attacker.",
      "Keep your phone with you and stay on the line.",
      "Preserve the scene — avoid touching anything nearby.",
      "Note descriptions and vehicle details when it is safe to do so.",
    ],
  },
  natural: {
    title: "Natural disaster",
    steps: [
      "Move to higher ground or the designated safe area.",
      "Avoid bridges, power lines and flooded roads.",
      "Keep your phone battery for emergency calls only.",
      "Take drinking water and any essential medication with you.",
      "Follow local authority instructions and shelter guidance.",
    ],
  },
  sos: {
    title: "General emergency",
    steps: [
      "Get to the safest place you can reach right now.",
      "Keep your phone unlocked and location sharing on.",
      "Describe what happened in the analysis box so responders are prepared.",
      "Stay visible and audible for arriving responders.",
      "Press \u201cI'm safe\u201d as soon as the danger has passed.",
    ],
  },
};

export function checklistFor(type: string | null | undefined): EmergencyChecklist {
  return CHECKLISTS[type ?? "sos"] ?? CHECKLISTS.sos;
}
