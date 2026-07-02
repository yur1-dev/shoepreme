import mongoose, { Schema, models, model } from "mongoose";

export type CrewEventType = "RUN" | "LAUNCH" | "MEETUP" | "RACE";

export interface ICrewEvent {
  _id: string;
  title: string;
  isoDate: string; // "YYYY-MM-DD"
  location: string;
  type: CrewEventType;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const CrewEventSchema = new Schema<ICrewEvent>(
  {
    title: { type: String, required: true },
    isoDate: { type: String, required: true },
    location: { type: String, required: true },
    type: {
      type: String,
      enum: ["RUN", "LAUNCH", "MEETUP", "RACE"],
      default: "RUN",
    },
    description: { type: String, default: "" },
  },
  { timestamps: true },
);

export default models.CrewEvent ||
  model<ICrewEvent>("CrewEvent", CrewEventSchema);
