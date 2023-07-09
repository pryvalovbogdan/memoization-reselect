# memoization-reselect

![Redux](https://img.shields.io/badge/-Redux-764ABC?logo=redux&logoColor=white&style=flat)
![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white&style=flat)
![Reselect](https://img.shields.io/badge/-Reselect-764ABC?logo=redux&logoColor=white&style=flat)

## Installation:

```bash
npm install
```

## Usage:
```bash
npm run dev
```

## Behavior:

### How we can implement Memoization with VanillaJs and es5:

```javascript
export const memoizationExample = function (param: any) {
    // Checking is result already calculated for same entry
    if (!memoizationExample.cache[param]) {
        console.log('not cached');
        const res = { data: param + 5 }; // Some heavy operations

        // Adding calculated result to cache
        memoizationExample.cache[param] = res;
    }

    console.log('outside');

    return memoizationExample.cache[param];
};

memoizationExample.cache = {};

let resDef = memoizationExample(11); // First call calculating data
let resDef2 = memoizationExample(11); // Second call will get data from cache

console.log(resDef, resDef2, memoizationExample.cache);
// { data: 16 }, { data: 16 }, { "11": { "data": 16 } }
```

### How we can implement Memoization using Map/WeakMap

```javascript
const cacheMap: Map<any, any> = new Map();
const cacheWeakMap: WeakMap<Object, any> = new WeakMap();

export const memoizationMap = (data: any) => {
    // Checking is result already calculated for same entry
    if (typeof data === 'object') {
        if (!cacheWeakMap.has(data)) {
            console.log('not cached WeakMap');
            let res = data.value + 5; // Some heavy operations

            // Adding calculated result to cache
            cacheWeakMap.set(data, res);
        }

        console.log('outside WeakMap');

        return cacheWeakMap.get(data);
    } else {
        if (!cacheMap.has(data)) {
            console.log('not cached Map');
            let res = data + 5; // Some heavy operations

            // Adding calculated result to cache
            cacheMap.set(data, res);
        }

        console.log('outside Map');

        return cacheMap.get(data);
    }
};

let data: number | null = 4;

let res1 = memoizationMap(data);
let res2 = memoizationMap(data); // data from cache

```

### How Memoization implemented inside Reselect Redux(createSelector):

```javascript
// Ussual compearing
export const defaultEqualityCheck: EqualityType = (a, b) => {
    return a === b;
};
// Deep compearing arguments
function areArgumentsShallowlyEqual(equalityCheck: EqualityType, prev: any, next: any) {
// If either arguments is null, or if their lengths aren't the same, they aren't equal  
    if (prev === null || next === null || prev.length !== next.length) {
        return false;
    }

    const length = prev.length;

    for (let i = 0; i < length; i++) {
        if (!equalityCheck(prev[i], next[i])) {
            return false;
        }
    }

    return true;
}

function createSelector(...funcs: any[]): (state: { numbers: number[]; strings: string[] }) => any {
    let lastArgs: any = null;
    let lastResult: any = null;

    return function () {
        // Checking is result already calculated for same entry
        if (!areArgumentsShallowlyEqual(defaultEqualityCheck, lastArgs, arguments)) {
            console.log('not cached selector');
            const resultFunc = funcs.pop(); //This is the function that calculates the result

            // Getting data fom selectors and paste data as props inside resultFunc
            lastResult = resultFunc(...funcs.map(func => func.apply(null, arguments)));
            lastArgs = arguments;
        }

        console.log('outside selector');

        return lastResult;
    };
}

// Usage
const stateStore: { numbers: number[]; strings: string[] } = {
    numbers: [1, 2, 3, 4, 5],
    strings: ['first', 'second', 'third', 'fourth', 'fifth'],
};

const getNumbers = (state: { numbers: number[] }) => state.numbers;

const getSum = createSelector(getNumbers, (numbers: any[]) => numbers.reduce((a, b) => a + b, 0));

console.log(getSum(stateStore));
console.log(getSum(stateStore)); // cache 15
```


### Implementation with WeakMap:

```javascript
function createSelectorWeakMap(...funcs: any[]) {
  let memoizedResults: WeakMap<any, any> = new WeakMap();

  return function (...args: any[]) {
    // Arg is array, so we need get obj as key into WeakMap which is out store
    const argsKey = args[0];

    if (memoizedResults.has(argsKey)) {
      console.log('weak cache');

      return memoizedResults.get(argsKey);
    } else {
      const resultFunc = funcs.pop();

      const selectorsRes = funcs.map(func => {
        // For several selectors
        const selectors = Array.isArray(func) && func.map((item: Function) => item.apply(null, arguments));

        return Array.isArray(func) ? selectors : func.apply(null, arguments);
      });
      // Check for several selectors to remove matrix
      const isMatrix = Array.isArray(selectorsRes[0][0]) ? selectorsRes.flat() : selectorsRes;
      // Blocking changing state with Object freeze
      const result = resultFunc(...isMatrix.map(item => Object.freeze(item)));

      memoizedResults.set(argsKey, result);

      return result;
    }
  };
}
```

Source CreateSelector Reselect:
[Create Selector](https://github.com/reduxjs/reselect/blob/master/src/index.ts#L80)

## If you want to support

Give a ⭐️ to project if you like it!

