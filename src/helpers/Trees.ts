interface ITreeDataEl {
    _id: string
    name: string
    parentId?: string
}

export interface ITree {
    _id: string
    name: string
    children: Array<ITree>
}

class Trees {
    public static createTrees<T extends ITreeDataEl>(data: T[] , parentId?: string) {
        let d: T[] = []; 
        const trees: ITree[] = [];
        if(!parentId) {
            d = data.filter((item) => {
                return item.parentId === undefined;
            });
        }
        else {
            d = data.filter((item) => {
                return item.parentId?.toString() === parentId.toString(); 
            });
        }
        for(let i=0; i<d.length; i+=1) {
            const tree = {...d[i], children: Trees.createTrees(data, d[i]._id)};
            delete tree.parentId;
            trees.push(tree)
        }
        return trees;
    }
    
    private static __findTree<T extends ITree>(_id: string, tree: T): T | null {
        if (tree._id.toString() === _id) { // toString() обязательно т.к. _id имеет тип ObjectId
            return tree;
        }
        else if (tree.children && tree.children.length > 0) {
            let result: T | null = null;
            for (let i=0; i < tree.children.length; i+=1) {
                result = Trees.findTree(_id, tree.children) as T | null;
            }
            return result;
        }
        return null;
    }

    public static findTree<T extends ITree>(_id: string, trees: T[]): T | null {
        let tree: T | null = null;
        for (let i=0; i<trees.length; i+=1) {
            tree = Trees.__findTree(_id, trees[i]);
            if (tree) {
                break;
            }
        }
        return tree;
    }

    public static getFieldValues<T extends ITree>(tree: T, fieldName: '_id' | 'name'): string[] {
        let values: string[] = [];
        
        if (fieldName === '_id' || fieldName === 'name') {
            getValues(tree, fieldName);
        }
 
        function getValues<T extends ITree>(tree: T, fieldName: '_id' | 'name') {
            values.push(tree[fieldName]);
            if (tree.children && tree.children.length > 0) {
                for (let i=0; i < tree.children.length; i+=1) {
                    getValues(tree.children[i], fieldName);
                }
            }
        }
        return values;
    }
}

export default Trees;