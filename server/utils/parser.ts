import type { H3Event, HTTPHeaderName } from 'h3'
import { z } from 'zod'

type UnknownKeysParam = 'passthrough' | 'strict' | 'strip'

type Schema<U extends UnknownKeysParam = any> =
  | z.ZodObject<any, U>
  | z.ZodUnion<[Schema<U>, ...Schema<U>[]]>
  | z.ZodIntersection<Schema<U>, Schema<U>>
  | z.ZodDiscriminatedUnion<string, z.ZodObject<any, U>[]>
  | z.ZodEffects<z.ZodTypeAny>

type ParsedData<T extends Schema | z.ZodRawShape> = T extends Schema
  ? z.output<T>
  : T extends z.ZodRawShape
    ? z.output<z.ZodObject<T>>
    : never

export type ParseOptions = Partial<z.ParseParams>

function createBadRequest(
  error: any,
  statusCode: number = 422,
  statusMesaage: string = 'Bad Request',
) {
  return createError({
    statusCode,
    statusText: statusMesaage,
    data: error,
  })
}

/**
 * Parse and validate request query from event handler. Throws an error if validation fails.
 * @param event - A H3 event object.
 * @param schema - A Zod object shape or object schema to validate.
 */
export async function useValidatedQuery<T extends Schema | z.ZodRawShape>(
  event: H3Event,
  schema: T,
  parseOptions?: ParseOptions,
): Promise<ParsedData<T>> {
  try {
    const query = getQuery(event)
    const finalSchema = schema instanceof z.ZodType ? schema : z.object(schema)
    const parsed = await finalSchema.parseAsync(query, parseOptions)
    return parsed
  }
  catch (error) {
    throw createBadRequest(error)
  }
}

/**
 * Parse and validate request body from event handler. Throws an error if validation fails.
 * @param event - A H3 event object.
 * @param schema - A Zod object shape or object schema to validate.
 */
export async function useValidatedBody<T extends Schema | z.ZodRawShape>(
  event: H3Event,
  schema: T,
  parseOptions?: ParseOptions,
): Promise<ParsedData<T>> {
  try {
    const body = await readBody(event)
    const finalSchema = schema instanceof z.ZodType ? schema : z.object(schema)
    const parsed = await finalSchema.parseAsync(body, parseOptions)
    return parsed
  }
  catch (error) {
    throw createBadRequest(error)
  }
}

/**
 * Parse and validate params from event handler. Throws an error if validation fails.
 * @param event - A H3 event object.
 * @param schema - A Zod object shape or object schema to validate.
 */
export async function useValidatedParams<T extends Schema | z.ZodRawShape>(
  event: H3Event,
  schema: T,
  parseOptions?: ParseOptions,
): Promise<ParsedData<T>> {
  try {
    const params = getRouterParams(event)
    const finalSchema = schema instanceof z.ZodType ? schema : z.object(schema)
    const parsed = await finalSchema.parseAsync(params, parseOptions)
    return parsed
  }
  catch (error) {
    throw createBadRequest(error)
  }
}

/**
 * Parse and validate a header from event handler. Throws an error if validation fails.
 * @param event - A H3 event object.
 * @param name - A header name.
 * @param schema - A Zod object shape or object schema to validate.
 */
export async function useValidatedHeader<T extends Schema | z.ZodRawShape>(
  event: H3Event,
  name: HTTPHeaderName,
  schema: T,
  parseOptions?: ParseOptions,
): Promise<ParsedData<T>> {
  try {
    const headers = getHeader(event, name)
    const finalSchema = schema instanceof z.ZodType ? schema : z.object(schema)
    const parsed = await finalSchema.parseAsync(headers, parseOptions)
    return parsed
  }
  catch (error) {
    throw createBadRequest(error, 422, 'Header parsing failed')
  }
}

/**
 * Parse and validate api/data/anything with a schema. Throws an error is validation fails
 * @param data - A data with of any type
 * @param schema - A Zod object shape or object schema to validate.
 * @param statusCode - An error status code
 * @param statusMessage - An error status message
 */
function validateApiWithSchema<T extends z.ZodTypeAny>(
  data: any,
  schema: T,
  statusCode: number,
  statusMessage: string,
): z.infer<T> {
  try {
    return schema.parse(data)
  }
  catch (error) {
    throw createBadRequest(error, statusCode, statusMessage)
  }
}

/**
 * Parse data OR promise with a schema. Throws an error is validation fails
 * @param dataOrPromise - A data or Promise with any type
 * @param schema - A Zod object shape or object schema to validate.
 * @param errorCode - An error status code
 * @param errorMessage - An error status message
 */
export async function parseDataAs<T extends z.ZodTypeAny>(
  dataOrPromise: any | Promise<any>,
  schema: T,
  errorCode = 422,
  errorMessage = 'Data parsing failed',
) {
  const data = await dataOrPromise
  return validateApiWithSchema(data, schema, errorCode, errorMessage)
}

export { z }
