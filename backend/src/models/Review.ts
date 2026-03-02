import mongoose, { Document, Schema } from 'mongoose'

export interface IReview extends Document {
  user: mongoose.Types.ObjectId
  product: mongoose.Types.ObjectId
  rating: number
  comment: string
}

const reviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
)

// One review per user per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true })

export default mongoose.model<IReview>('Review', reviewSchema)