import LinkModel from "../models/Link";

interface ILinkObj {
    value: string
    userId: string
    newPassword?: string
}

class LinkService {
    async createLink(link: string, userId: string) {
        await LinkModel.create({
            value: link,
            userId: userId,
        });
    }

    async deleteLink(link: string) {
        await LinkModel.deleteOne({value: link});
    }
}

export default new LinkService();