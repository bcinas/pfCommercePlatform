import mongoose, { Document, Schema } from 'mongoose'

export interface IProduct extends Document {
  name: string
  description: string
  price: number
  images: string[]
  category: mongoose.Types.ObjectId
  stock: number
  isActive: boolean
  rating: number
  numReviews: number
  specifications: { key: string; value: string }[]
  orderCount: number
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    images: [{ type: String }],
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    stock: { type: Number, required: true, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    specifications: [{ key: String, value: String }],
    orderCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export default mongoose.model<IProduct>('Product', productSchema)