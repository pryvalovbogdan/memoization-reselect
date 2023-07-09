interface MemoizedFunction extends Function {
  (param: string): any;
  cache: {
    [key: string]: any;
  };
}

declare global {
  interface Window {
    memoizationExample: any;
  }
}

export const memoizationExample = function (param: string) {
  if (!memoizationExample.cache[param]) {
    console.log('not cached');
    const res = { some: param };

    memoizationExample.cache[param] = res;
  }

  console.log('outside');

  return memoizationExample.cache[param];
} as MemoizedFunction;

memoizationExample.cache = {};

// Same example Using Map
const cacheMap: Map<any, any> = new Map();

export const memoizationMap = (data: any) => {
  if (!cacheMap.has(data)) {
    let res = data; // Big data calculation

    cacheMap.set(data, res);
  }

  return cacheMap.get(data);
};

let data: Object | null = { some: '' };

let res1 = memoizationMap(data);
let res2 = memoizationMap(data); // data from cache

// .removing link to obj
data = null;

console.log(res1, res2, cacheMap.size); // 1 obj still saved in cache
//dissadvanteges of Map insted of WeakMap that we need to clean cache from unused obj by hands
// in weak map keys could be only objects linked types not primitives
let cacheWeakMap: WeakMap<Object, any> = new WeakMap();

console.log(cacheWeakMap);
type EqualityType = (a: any, b: any) => boolean;

export const defaultEqualityCheck: EqualityType = (a, b) => {
  return a === b;
};

function areArgumentsShallowlyEqual(equalityCheck: EqualityType, prev: any, next: any) {
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

function createSelector(...funcs: any[]) {
  let lastArgs: any = null;
  let lastResult: any = null;

  return function () {
    if (!areArgumentsShallowlyEqual(defaultEqualityCheck, lastArgs, arguments)) {
      console.log('not cached selector');
      const resultFunc = funcs.pop();

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

console.log(getSum(stateStore)); // calculates and logs 15
console.log(getSum(stateStore)); // returns memoized 15

function createSelectorMap(...funcs: any[]) {
  let memoizedResults: Map<any, any> = new Map();

  return function (...args: any[]) {
    const argsKey = JSON.stringify(args);

    if (memoizedResults.has(argsKey)) {
      return memoizedResults.get(argsKey);
    } else {
      const resultFunc = funcs.pop();
      const result = resultFunc(...funcs.map(func => func.apply(null, args)));

      memoizedResults.set(argsKey, result);

      return result;
    }
  };
}

// Same example using MeakMap

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

const getNumbersWeak = (state: { numbers: number[] }) => {
  console.log('state', state);

  return state.numbers;
};

const getStringsWeak = (state: { strings: string[] }) => state.strings;

const getSumWeak = createSelectorWeakMap([getNumbersWeak, getStringsWeak], (numbers: number[], strings: string[]) => {
  console.log('number', Object.isFrozen(numbers), strings);

  // numbers[1] = '2' Will give an error
  return numbers.reduce(
    (a, b, currentIndex) => {
      console.log('a', numbers, strings);

      return { sum: a.sum + b, str: a.str + strings[currentIndex] };
    },
    { sum: 0, str: '' },
  );
});

console.log('weak', getSumWeak(stateStore)); // calculates and logs 15
console.log('weak', getSumWeak(stateStore)); // returns memoized 15
