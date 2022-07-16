import { NextFunction, Request, Response } from "express";
import rolesService from "../services/rolesService";

class RolesController {
    async getRoles(req: Request, res: Response, next: NextFunction) {
        try {
            const roles = await rolesService.getRoles();
            if (roles.length < 1) {
              return res.json({message: 'Roles not found'});
            }
            return res.status(200).json(roles);
        }
        catch (err) {
            next(err);
        }
    }
}

export default new RolesController();