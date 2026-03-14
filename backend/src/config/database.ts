export type UserRole = "user" | "admin" | "driver";

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  hashedPassword: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invite {
  id: string;
  emailOrPhone: string;
  inviteToken: string;
  role: UserRole;
  status: "pending" | "accepted" | "expired";
  createdByAdminId: string;
  expiresAt: Date | null;
  createdAt: Date;
}

export type PickupStatus =
  | "requested"
  | "accepted"
  | "driver_assigned"
  | "on_the_way"
  | "picked_up"
  | "cancelled";

export interface Pickup {
  id: string;
  userId: string;
  scheduledAt: Date | null;
  pickupStatus: PickupStatus;
  addressText: string;
  latitude: number | null;
  longitude: number | null;
  driverId: string | null;
  totalWeightKg: number;
  estimatedAmount: number;
  finalAmountPaid: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScrapItem {
  id: string;
  pickupId: string;
  category: string;
  weightKg: number;
  ratePerKg: number;
  amount: number;
}

export interface Payment {
  id: string;
  pickupId: string;
  userId: string;
  amount: number;
  method: string;
  paidAt: Date;
}

export interface PickupImage {
  id: string;
  pickupId: string;
  imageUrl: string;
  uploadedAt: Date;
}

export interface Message {
  id: string;
  pickupId: string | null;
  senderId: string;
  receiverRole: UserRole;
  content: string;
  createdAt: Date;
}

export interface ScrapRate {
  id: string;
  category: string;
  ratePerKg: number;
  effectiveFrom: Date;
  createdByAdminId: string;
}

