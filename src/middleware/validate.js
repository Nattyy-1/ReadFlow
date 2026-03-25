export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    return next(result.error);
  }

  req.body = result.data.body;
  req.validData = result.data;
  next();
};
