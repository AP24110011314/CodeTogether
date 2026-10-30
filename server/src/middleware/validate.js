export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: firstIssue ? `${firstIssue.path.join('.')}: ${firstIssue.message}` : 'Validation error',
          details: result.error.issues,
        },
      });
    }
    req[source] = result.data;
    next();
  };
}

