import mongoose, { Schema, models, model } from "mongoose";

export type CrewEventType = "RUN" | "LAUNCH" | "MEETUP" | "RACE";

export interface ICrewRegistration {
  name: string;
  email: string;
  phone?: string;
  registeredAt: Date;
}

export interface ICrewEvent {
  _id: string;
  title: string;
  isoDate: string;
  time: string;
  location: string;
  lat?: number;
  lng?: number;
  type: CrewEventType;
  description: string;
  registrationUrl?: string;
  registrations: ICrewRegistration[];
  createdAt: Date;
  updatedAt: Date;
}

const CrewRegistrationSchema = new Schema<ICrewRegistration>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: "" },
    registeredAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const CrewEventSchema = new Schema<ICrewEvent>(
  {
    title: { type: String, required: true },
    isoDate: { type: String, required: true },
    time: { type: String, default: "" },
    location: { type: String, required: true },
    lat: { type: Number },
    lng: { type: Number },
    type: {
      type: String,
      enum: ["RUN", "LAUNCH", "MEETUP", "RACE"],
      default: "RUN",
    },
    description: { type: String, default: "" },
    registrationUrl: { type: String, default: "" },
    registrations: { type: [CrewRegistrationSchema], default: [] },
  },
  { timestamps: true },
);

export default models.CrewEvent ||
  model<ICrewEvent>("CrewEvent", CrewEventSchema);
