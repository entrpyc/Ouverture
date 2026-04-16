import type {
  User as PrismaUser,
  Project as PrismaProject,
  ProjectTool as PrismaProjectTool,
  Task as PrismaTask,
  Phase as PrismaPhase,
  PhaseTooling as PrismaPhaseTooling,
  Ticket as PrismaTicket,
  TicketTooling as PrismaTicketTooling,
} from "./generated/prisma/models";

export type Status = "active" | "done";
export type ToolType = "agent" | "skill" | "mcp";
export type Priority = "high" | "medium" | "low";

export type User = PrismaUser;
export type Project = PrismaProject;
export type ProjectTool = PrismaProjectTool;
export type Task = PrismaTask;
export type Phase = PrismaPhase;
export type PhaseTooling = PrismaPhaseTooling;
export type Ticket = PrismaTicket;
export type TicketTooling = PrismaTicketTooling;
