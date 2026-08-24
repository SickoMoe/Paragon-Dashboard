import { Action, configureStore, ThunkAction } from '@reduxjs/toolkit';
import rootReducer, { RootState } from './reducer';

export const configureStoreWithPreloadedState = (
  preloadedState?: Partial<RootState>
) => {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }).concat(),
  });
};

export type AppStore = ReturnType<typeof configureStoreWithPreloadedState>;
export type AppDispatch = AppStore["dispatch"];
export type AppThunk = ThunkAction<void, RootState, unknown, Action<string>>;

export default configureStoreWithPreloadedState;