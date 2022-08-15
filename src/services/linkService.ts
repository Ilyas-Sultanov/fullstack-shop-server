import LinkModel from "../models/Link";

class LinkService {
    async createLink(userId: string, link: string) {
        await LinkModel.create({
            userId: userId,
            value: link,
        });
    }

    async deleteLink(link: string) {
        await LinkModel.deleteOne({value: link});
    }
}

export default new LinkService();