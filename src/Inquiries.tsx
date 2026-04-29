import { useDispatch, useSelector } from 'react-redux';
import { Dispatch } from 'redux';

import { useNavigate } from 'react-router-dom';
import { removeInquiry, RemoveInquiryAction } from './redux/inquiry_action.ts';
import { IInquiry } from './interfaces/IInquiry.ts';
import { RootState } from './redux/reducer.ts';

export function Inquiries() {
  const dispatch = useDispatch<Dispatch<RemoveInquiryAction>>();

  const inquiries = useSelector(
    (state: RootState) => state.inquiries.inquiries
  );

  const navigate = useNavigate();
  const handleApprove = (inquiry: IInquiry) => {
    console.log(`Inquiry ${inquiry.id} approved`);
    navigate(`inquiry/${inquiry.id}`, { state: { inquiry: inquiry } });
  };

  const handleDecline = (inquiry: IInquiry) => {
    dispatch(removeInquiry(inquiry.id));
    console.log(`Inquiry ${inquiry.id} declined`);
  };

  return (
    <div className="inquiry-container">
      <div className="inquiry-title">Inquiries</div>
      <span className="inquiry-subtitle">{inquiries.length}</span>
      <div className="inquiry-list">
        {inquiries.map((inquiry: IInquiry, index: number) => (
          <div key={index}>
            <InquiryDisplay
              onApprove={() => handleApprove(inquiry)}
              onDecline={() => handleDecline(inquiry)}
              {...inquiry}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

interface InquiryDisplayProps extends IInquiry {
  onApprove: () => void;
  onDecline: () => void;
}

function InquiryDisplay({
  timestamp,
  streetAddress,
  onApprove,
  onDecline,
}: InquiryDisplayProps) {
  const dateObject = new Date(timestamp);

  return (
    <div className="inquiry-entry">
      <div className="entry-container">
        <p className="entry-title">{streetAddress}</p>
        <p className="entry-subtitle">{dateObject.toLocaleString()}</p>
      </div>
      <div className="inquiry-buttons">
        <button className="inquiry-button--approved" onClick={onApprove}>
          Approve
        </button>
        <button className="inquiry-button--decline" onClick={onDecline}>
          Decline
        </button>
      </div>
    </div>
  );
}
