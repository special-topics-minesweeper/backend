export function projectFields<T, K extends keyof T>(obj : T, fields : K[]) : Pick<T, K> {
    const resultObj : Pick<T, K> = {} as any;
    for(const field of fields) {
        resultObj[field] = obj[field];
    }
    return resultObj;
}