import { Schema } from "./interface";


export const TimestampSchema: Schema = {
  createdAt: { type: 'string', default: () => new Date().toISOString() },
  updatedAt: { type: 'string', default: () => new Date().toISOString(), onChange: () => new Date().toISOString() }
}

export const PrimarySchema = {
  id: { type: 'string', pk: true }
}

export const merge = (schema: Schema): Schema => {
  return { ...PrimarySchema, ...TimestampSchema, ...schema }
}