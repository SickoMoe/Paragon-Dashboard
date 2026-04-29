import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IInquiry } from '../interfaces/IInquiry';

// Define the initial state using that type
const initialState: InquiryState = {
  inquiries: [],
};

// Define the InquiryState interface
export interface InquiryState {
  inquiries: IInquiry[];
}

const inquirySlice = createSlice({
  name: 'inquiries',
  initialState,
  reducers: {
    addInquiry: (state, action: PayloadAction<IInquiry>) => {
      state.inquiries.push(action.payload);
    },
    removeInquiry: (state, action: PayloadAction<string>) => {
      state.inquiries = state.inquiries.filter(
        (inquiry) => inquiry.id !== action.payload
      );
    },
  },
});

// Export the actions
export const { addInquiry, removeInquiry } = inquirySlice.actions;

// Export the reducer
export default inquirySlice.reducer;