export function projectFields<T, K extends keyof T>(obj : T, fields : K[]) : Pick<T, K> {
    const resultObj : Pick<T, K> = {} as any;
    for(const field of fields) {
        resultObj[field] = obj[field];
    }
    return resultObj;
}

export function isTupleInArray(arr : [number, number][], value : [number, number]) {
    return arr.filter((item) => item[0] === value[0] && item[1] === value[1]).length !== 0;
}

export function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}