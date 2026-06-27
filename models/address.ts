import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface AddressDocument extends Document {
  customerId: string; // shopifyCustomerId this address belongs to
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  zip: string;
  country: string;
  phone: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<AddressDocument>(
  {
    customerId: { type: String, required: true, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    address1: { type: String, required: true },
    address2: { type: String, default: "" },
    city: { type: String, required: true },
    province: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, required: true, default: "Philippines" },
    phone: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Address: Model<AddressDocument> =
  mongoose.models.Address ||
  mongoose.model<AddressDocument>("Address", AddressSchema);