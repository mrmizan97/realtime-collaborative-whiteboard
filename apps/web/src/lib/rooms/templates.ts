import type { Shape } from "@canvasly/shared";

export type Template = {
  id: string;
  name: string;
  description: string;
  shapes: Partial<Shape>[];
};

const stickyDefaults = {
  strokeColor: "#111",
  fillColor: "transparent",
  opacity: 1,
  rotation: 0,
  strokeWidth: 0,
  zIndex: 0,
};
const shapeDefaults = {
  opacity: 1,
  rotation: 0,
  zIndex: 0,
};

export const TEMPLATES: Template[] = [
  {
    id: "blank",
    name: "Blank",
    description: "An empty canvas.",
    shapes: [],
  },
  {
    id: "retro",
    name: "Team Retro",
    description: "3 columns: went well, didn't, actions.",
    shapes: [
      { type: "text", x: 80, y: 40, width: 400, height: 32, text: "**Sprint Retrospective**", fontSize: 24, fontFamily: "Inter, sans-serif", strokeColor: "#111", fillColor: "transparent", opacity: 1, rotation: 0, strokeWidth: 1, zIndex: 0 },
      { type: "sticky", x: 80, y: 100, width: 200, height: 180, text: "**What went well**", color: "#A7F3D0", ...stickyDefaults },
      { type: "sticky", x: 320, y: 100, width: 200, height: 180, text: "**What didn't**", color: "#FECACA", ...stickyDefaults },
      { type: "sticky", x: 560, y: 100, width: 200, height: 180, text: "**Action items**", color: "#FDE68A", ...stickyDefaults },
    ],
  },
  {
    id: "mindmap",
    name: "Mind map",
    description: "Central idea with branches.",
    shapes: [
      { type: "ellipse", x: 320, y: 200, width: 200, height: 80, strokeColor: "#3B82F6", fillColor: "#DBEAFE", strokeWidth: 2, ...shapeDefaults },
      { type: "text", x: 380, y: 228, width: 100, height: 24, text: "**Main idea**", fontSize: 16, fontFamily: "Inter, sans-serif", strokeColor: "#1E3A8A", fillColor: "transparent", opacity: 1, rotation: 0, strokeWidth: 1, zIndex: 0 },
      { type: "ellipse", x: 80, y: 80, width: 120, height: 60, strokeColor: "#10B981", fillColor: "#D1FAE5", strokeWidth: 2, ...shapeDefaults },
      { type: "ellipse", x: 640, y: 80, width: 120, height: 60, strokeColor: "#F59E0B", fillColor: "#FEF3C7", strokeWidth: 2, ...shapeDefaults },
      { type: "ellipse", x: 80, y: 340, width: 120, height: 60, strokeColor: "#EC4899", fillColor: "#FCE7F3", strokeWidth: 2, ...shapeDefaults },
      { type: "ellipse", x: 640, y: 340, width: 120, height: 60, strokeColor: "#8B5CF6", fillColor: "#EDE9FE", strokeWidth: 2, ...shapeDefaults },
    ],
  },
  {
    id: "flowchart",
    name: "Flowchart",
    description: "Start → process → end blocks.",
    shapes: [
      { type: "ellipse", x: 80, y: 80, width: 140, height: 60, strokeColor: "#111", fillColor: "#E0E7FF", strokeWidth: 2, ...shapeDefaults },
      { type: "rectangle", x: 80, y: 200, width: 140, height: 60, strokeColor: "#111", fillColor: "#FEF3C7", strokeWidth: 2, ...shapeDefaults },
      { type: "rectangle", x: 80, y: 320, width: 140, height: 60, strokeColor: "#111", fillColor: "#D1FAE5", strokeWidth: 2, ...shapeDefaults },
    ],
  },
  {
    id: "kanban",
    name: "Kanban",
    description: "To do / In progress / Done columns.",
    shapes: [
      { type: "frame", x: 40, y: 40, width: 280, height: 400, label: "To do", fillColor: "transparent", strokeColor: "#9CA3AF", strokeWidth: 1, ...shapeDefaults },
      { type: "frame", x: 340, y: 40, width: 280, height: 400, label: "In progress", fillColor: "transparent", strokeColor: "#9CA3AF", strokeWidth: 1, ...shapeDefaults },
      { type: "frame", x: 640, y: 40, width: 280, height: 400, label: "Done", fillColor: "transparent", strokeColor: "#9CA3AF", strokeWidth: 1, ...shapeDefaults },
    ],
  },
  {
    id: "user-journey",
    name: "User journey",
    description: "5 stages from awareness to advocacy.",
    shapes: [
      { type: "text", x: 40, y: 30, width: 300, height: 32, text: "**Customer journey map**", fontSize: 20, fontFamily: "Inter, sans-serif", strokeColor: "#111", fillColor: "transparent", opacity: 1, rotation: 0, strokeWidth: 1, zIndex: 0 },
      ...["Awareness", "Consideration", "Decision", "Retention", "Advocacy"].map((stage, i) => ({
        type: "rectangle" as const,
        x: 40 + i * 180,
        y: 80,
        width: 160,
        height: 60,
        strokeColor: "#3B82F6",
        fillColor: "#DBEAFE",
        strokeWidth: 2,
        ...shapeDefaults,
      })),
      ...["Awareness", "Consideration", "Decision", "Retention", "Advocacy"].map((stage, i) => ({
        type: "text" as const,
        x: 60 + i * 180,
        y: 100,
        width: 120,
        height: 24,
        text: `*${stage}*`,
        fontSize: 14,
        fontFamily: "Inter, sans-serif",
        strokeColor: "#1E3A8A",
        fillColor: "transparent",
        opacity: 1,
        rotation: 0,
        strokeWidth: 1,
        zIndex: 0,
      })),
    ],
  },
  {
    id: "swot",
    name: "SWOT",
    description: "Strengths / Weaknesses / Opportunities / Threats.",
    shapes: [
      { type: "sticky", x: 40, y: 40, width: 280, height: 180, text: "**Strengths**", color: "#A7F3D0", ...stickyDefaults },
      { type: "sticky", x: 340, y: 40, width: 280, height: 180, text: "**Weaknesses**", color: "#FECACA", ...stickyDefaults },
      { type: "sticky", x: 40, y: 240, width: 280, height: 180, text: "**Opportunities**", color: "#BFDBFE", ...stickyDefaults },
      { type: "sticky", x: 340, y: 240, width: 280, height: 180, text: "**Threats**", color: "#FDE68A", ...stickyDefaults },
    ],
  },
  {
    id: "empathy-map",
    name: "Empathy map",
    description: "Says / Thinks / Does / Feels quadrants.",
    shapes: [
      { type: "ellipse", x: 280, y: 200, width: 160, height: 80, strokeColor: "#111", fillColor: "#F3F4F6", strokeWidth: 2, ...shapeDefaults },
      { type: "text", x: 330, y: 230, width: 60, height: 24, text: "**User**", fontSize: 16, fontFamily: "Inter, sans-serif", strokeColor: "#111", fillColor: "transparent", opacity: 1, rotation: 0, strokeWidth: 1, zIndex: 0 },
      { type: "sticky", x: 20, y: 40, width: 240, height: 140, text: "**Says**", color: "#A7F3D0", ...stickyDefaults },
      { type: "sticky", x: 460, y: 40, width: 240, height: 140, text: "**Thinks**", color: "#BFDBFE", ...stickyDefaults },
      { type: "sticky", x: 20, y: 300, width: 240, height: 140, text: "**Does**", color: "#FDE68A", ...stickyDefaults },
      { type: "sticky", x: 460, y: 300, width: 240, height: 140, text: "**Feels**", color: "#FECACA", ...stickyDefaults },
    ],
  },
];

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
