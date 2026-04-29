import { combineReducers } from 'redux';

import inquiryReducer from './inquiry_Reducer';

const rootReducer = combineReducers({
  inquiries: inquiryReducer,

});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;