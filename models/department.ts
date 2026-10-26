import mongoose from 'mongoose'
import type { Model } from 'mongoose'

const { Schema, model, models } = mongoose

export interface IDepartment {
  _id: string
  organizationId: string
  name: string
  createdAt: Date
}

const DepartmentSchema = new Schema({
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  createdAt: { type: Date, default: Date.now },
})

// Department names are unique per organization.
DepartmentSchema.index({ organizationId: 1, name: 1 }, { unique: true })

export const Department: Model<IDepartment> =
  (models.Department as Model<IDepartment>) ||
  model<IDepartment>('Department', DepartmentSchema)
