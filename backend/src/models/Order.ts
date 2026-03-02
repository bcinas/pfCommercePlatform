import mongoose, { Document, Schema } from 'mongoose'

export interface IOrderItem {
  product: mongoose.Types.ObjectId
  name: string
  image: string
  price: number
  quantity: number
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId
  items: IOrderItem[]
  shippingAddress: {
    fullName: string
    address: string
    city: string
    postalCode: string
    country: string
  }
  paymentStatus: 'pending' | 'paid'
  orderStatus: 'processing' | 'shipped' | 'delivered' | 'cancelled'
  itemsPrice: number
  shippingPrice: number
  taxPrice: number
  totalPrice: number
}

const orderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        image: String,
        price: Number,
        quantity: Number,
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    orderStatus: {
      type: String,
      enum: ['processing', 'shipped', 'delivered', 'cancelled'],
      default: 'processing',
    },
    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, required: true },
    taxPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
  },
  { timestamps: true }
)

export default mongoose.model<IOrder>('Order', orderSchema)