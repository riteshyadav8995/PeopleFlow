import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../core/errors/validation.error';

/**
 * Validation middleware factory — validates req.body, req.query,
 * or req.params against a Zod schema.
 *
 * Usage:
 *   router.post('/employees', validate(createEmployeeSchema), controller.create);
 *   router.get('/employees', validate(querySchema, 'query'), controller.list);
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return next(new ValidationError(result.error));
    }

    // Replace with parsed & coerced values
    req[source] = result.data;
    next();
  };
}
