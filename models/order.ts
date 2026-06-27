import mongoose, { Schema, type Document, type Model } from "mongoose";

// ─── Sub-shapes (kept as plain interfaces — these are embedded, not separate collections) ───
interface MoneyV2 {
  amount: string;
  currencyCode: string;
}

interface SelectedOption {
  name: string;
  value: string;
}

interface VariantImage {
  url: string;
}

interface LineItemVariant {
  image?: VariantImage;
  selectedOptions?: SelectedOption[];
  price?: MoneyV2;
}

interface LineItemNode {
  title: string;
  quantity: number;
  variant?: LineItemVariant;
}

interface LineItemEdge {
  node: LineItemNode;
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string | null;
  city: string;
  province: string;
  zip: string;
  country: string;
  phone: string;
}

export interface OrderDocument extends Document {
  customerId: string; // shopifyCustomerId this order belongs to
  orderNumber: number;
  processedAt: Date;
  financialStatus: string;
  fulfillmentStatus: string;
  currentTotalPrice: MoneyV2;
  subtotalPrice: MoneyV2;
  totalShippingPrice: MoneyV2;
  shippingAddress?: ShippingAddress;
  lineItems: { edges: LineItemEdge[] };
  createdAt: Date;
  updatedAt: Date;
}

const MoneySchema = new Schema<MoneyV2>(
  { amount: { type: String, required: true }, currencyCode: { type: String, required: true } },
  { _id: false },
);

const SelectedOptionSchema = new Schema<SelectedOption>(
  { name: String, value: String },
  { _id: false },
);

const LineItemNodeSchema = new Schema<LineItemNode>(
  {
    title: { type: String, required: true },
    quantity: { type: Number, required: true },
    variant: {
      image: { url: String },
      selectedOptions: [SelectedOptionSchema],
      price: MoneySchema,
    },
  },
  { _id: false },
);

const LineItemEdgeSchema = new Schema<LineItemEdge>(
  { node: LineItemNodeSchema },
  { _id: false },
);

const ShippingAddressSchema = new Schema<ShippingAddress>(
  {
    firstName: String,
    lastName: String,
    address1: String,
    address2: String,
    city: String,
    province: String,
    zip: String,
    country: String,
    phone: String,
  },
  { _id: false },
);

const OrderSchema = new Schema<OrderDocument>(
  {
    customerId: { type: String, required: true, index: true },
    orderNumber: { type: Number, required: true },
    processedAt: { type: Date, required: true },
    financialStatus: { type: String, required: true }, // PAID | PENDING | REFUNDED ...
    fulfillmentStatus: { type: String, required: true }, // FULFILLED | UNFULFILLED ...
    currentTotalPrice: { type: MoneySchema, required: true },
    subtotalPrice: { type: MoneySchema, required: true },
    totalShippingPrice: { type: MoneySchema, required: true },
    shippingAddress: ShippingAddressSchema,
    lineItems: { edges: { type: [LineItemEdgeSchema], default: [] } },
  },
  { timestamps: true },
);

export const Order: Model<OrderDocument> =
  mongoose.models.Order || mongoose.model<OrderDocument>("Order", OrderSchema);