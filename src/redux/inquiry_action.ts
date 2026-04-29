import { IInquiry } from "../interfaces/IInquiry";

export const ADD_INQUIRY = 'ADD_INQUIRY';
export const REMOVE_INQUIRY = 'REMOVE_INQUIRY';

export interface AddInquiryAction {
  type: typeof ADD_INQUIRY;
  payload: IInquiry;
}

export function addInquiry(inquiry: IInquiry): AddInquiryAction {
  return { type: ADD_INQUIRY, payload: inquiry };
}

export interface RemoveInquiryAction {
  type: typeof REMOVE_INQUIRY;
  payload: string;
}

export function removeInquiry(inquiry: string): RemoveInquiryAction {
  return {
    type: REMOVE_INQUIRY,
    payload: inquiry,
  };
}