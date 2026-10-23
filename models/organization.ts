import mongoose from 'mongoose'
import type { Model } from 'mongoose'

// Destructure from the default export so these modules work both under
// Next.js (webpack/turbopack) and Node's native ESM loader (used by
// scripts/seed-dev-users.ts), which can't take named imports from CJS.
const { Schema, model, models } = mongoose

export interface IOrganization {
  _id: string
  name: string
  createdAt: Date
}

const OrganizationSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    maxlength: 100,
  },
  createdAt: { type: Date, default: Date.now },
})

export const Organization: Model<IOrganization> =
  (models.Organization as Model<IOrganization>) ||
  model<IOrganization>('Organization', OrganizationSchema)
