import type {
  UserModel,
  ProjectModel,
  ProjectToolModel,
  TaskModel,
  PhaseModel,
  PhaseToolingModel,
  TicketModel,
  TicketToolingModel,
} from "./generated/prisma/models";

export type Status = "active" | "done";
export type ToolType = "agent" | "skill" | "mcp";
export type Priority = "high" | "medium" | "low";

export type User = UserModel;
export type Project = ProjectModel;
export type ProjectTool = ProjectToolModel;
export type Task = TaskModel;
export type Phase = PhaseModel;
export type PhaseTooling = PhaseToolingModel;
export type Ticket = Omit<TicketModel, "instructions" | "acceptanceCriteria"> & {
  instructions: string[];
  acceptanceCriteria: string[];
};
export type TicketTooling = TicketToolingModel;
