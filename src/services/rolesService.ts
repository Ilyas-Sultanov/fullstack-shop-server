import RoleModel from '../models/Role';

class RolesService {
    async getRoles() {
        const roles = await RoleModel.find().lean();
        return roles;
    }
}

export default new RolesService();