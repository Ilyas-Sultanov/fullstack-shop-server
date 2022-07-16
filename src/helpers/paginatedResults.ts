import { Model, FilterQuery, QueryOptions } from 'mongoose';

interface Results<T> {
    totalNumberOfMatches: number,
    currentPage: number,
    limit: number, 
    link: string,
    data: T[],
}

async function paginatedResults<T>(
        model: Model<T>, 
        filter: FilterQuery<T>, 
        originalUrl: string,
        projection: string, 
        options: QueryOptions, 
        page: number | null
    ) {
    const currentPage = page ? page : 1;
    
    const results: Results<T> = {
        totalNumberOfMatches: 0,
        currentPage, 
        limit: options.limit!,
        link: originalUrl,
        data: [], 
    };

    const count = await model.countDocuments(filter);
    results.totalNumberOfMatches = count;
   
    results.data = await model.find(
        filter,
        projection,
        options
    )   
    
    return results;
}

export default paginatedResults;

















// import { Model, FilterQuery, QueryOptions } from 'mongoose';

// interface Results<T> {
//     next?: {
//         page: number,
//         limit: number
//     },
//     previous?: {
//         page: number,
//         limit: number
//     },
//     data: T[],
//     totalNumberOfMatches: number,
// }

// async function paginatedResults<T>(
//         model: Model<T>, 
//         filter: FilterQuery<T>, 
//         projection: string, 
//         options: QueryOptions, 
//         page: number | null
//     ) {
//     const currentPage = page ? page : 1;
//     const startIndex = options.skip ? options.skip : 0;
//     const endIndex = currentPage * options.limit!;

//     // console.log(filter);
//     // console.log(options);
    
//     const results: Results<T> = {data: [], totalNumberOfMatches: 0};
//     const count = await model.countDocuments(filter);
//     results.totalNumberOfMatches = count;

//     if (endIndex < count) {
//         results.next = {
//             page: currentPage + 1,
//             limit: options.limit!
//         }
//     }
    
//     if (startIndex > 0) {
//         results.previous = {
//             page: currentPage - 1,
//             limit: options.limit!
//         }
//     }
   
//     results.data = await model.find(
//         filter,
//         projection,
//         options
//     )   
    
//     return results;
// }

// export default paginatedResults;