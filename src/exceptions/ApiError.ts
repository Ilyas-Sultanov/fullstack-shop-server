class ApiError extends Error {
  status: number;
  message: string;

  constructor(status: number, message: string) {
    super();
    this.status = status;
    this.message = message;
  }

  static badRequest(message: string) {
    return new ApiError(400, message);
  }

  static unauthorizedError(message: string = 'Пользователь не авторизован') {
    return new ApiError(401, message);
  }

  static forbidden(message: string) {
    return new ApiError(403, message);
  }

  static internal(message: string) {
    return new ApiError(500, message);
  }

  static unprocessableEntity(message: string) { // валидация не пройдена
    return new ApiError(422, message);
  }

}

export default ApiError;