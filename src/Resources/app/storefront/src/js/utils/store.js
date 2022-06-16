import { createGlobalState, useStorage } from '@vueuse/core';

export const useGlobalCars = createGlobalState(() =>
  useStorage('crw-garage', {
    active: null,
    loading: false,
    list: [],
  })
);

export const useGlobalProductCounter = createGlobalState(() =>
  useStorage('crw-catalog-count', {
    list: [],
    loading: false,
  })
);

export const useGlobalFit = createGlobalState(() => useStorage('crw-fit-data', []));

export const useGlobalCountries = createGlobalState(() => useStorage('crw-countries', []));
