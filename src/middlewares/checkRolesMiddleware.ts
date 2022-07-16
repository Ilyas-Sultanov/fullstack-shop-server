import { NextFunction, Request, Response } from "express";
import ApiError from "../exceptions/ApiError";

// Внимание! Перед использованием этого middleware, пользователь должен быть авторизован, а именно объект req.user должен быть

function checkRoleMiddleware(role: string) {
    return function(req: Request, res: Response, next: NextFunction) {
        const isIncludes = req.user.roles.includes(role);
        if (isIncludes) return next();
        else return next(ApiError.forbidden("You don't have access"));
    }
}

export default checkRoleMiddleware;