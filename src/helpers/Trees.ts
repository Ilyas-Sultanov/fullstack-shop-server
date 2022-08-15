interface ITreeDataEl {
    _id: string
    name: string
    parentId?: string
}

export interface ITree<T> {
    _id: string
    name: string
    children: Array<ITree<T>>
}

class Trees {
    public static createTrees<T extends ITreeDataEl>(data: Array<T> , parentId?: string) {
        let d: Array<T> = []; 
        const trees: Array<ITree<T>> = [];
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
    
    private static __findTree<T>(_id: string, tree: ITree<T>): ITree<T> | null {
        if (tree._id.toString() === _id) { // toString() обязательно т.к. _id имеет тип ObjectId
            return tree;
        }
        else if (tree.children && tree.children.length > 0) {
            let result: ITree<T> | null = null;
            for (let i=0; i < tree.children.length; i+=1) {
                result = Trees.findTree(_id, tree.children);
            }
            return result;
        }
        return null;
    }

    public static findTree<T>(_id: string, trees: Array<ITree<T>>): ITree<T> | null {
        let tree: ITree<T> | null = null;
        for (let i=0; i<trees.length; i+=1) {
            tree = Trees.__findTree(_id, trees[i]);
            if (tree) {
                break;
            }
        }
        return tree;
    }

    public static getFieldValues<T extends ITree<T>>(tree: ITree<T>, fieldName: '_id' | 'name'): string[] {
        let values: string[] = [];
        
        if (fieldName === '_id' || fieldName === 'name') {
            getValues(tree, fieldName);
        }
 
        function getValues<T extends ITree<T>>(tree: T, fieldName: '_id' | 'name') {
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