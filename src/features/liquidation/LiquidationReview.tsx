import { useEffect, useState } from 'react';
import { request } from '../../core/api/request';
import { appEnv } from '../../core/config/env';
import { categories, relationships, label, type Authority, type Liquidation, type Document } from './types';
import './liquidation.css';
export default function LiquidationReview({ listingId }: { listingId: string }) {
  const [data, setData] = useState<Liquidation | null>(null);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [downloading, setDownloading] = useState('');
  const [notice, setNotice] = useState('');
  const [note, setNote] = useState(''); const [requirements, setRequirements] = useState<string[]>([]); const [requirementsNote, setRequirementsNote] = useState('');
  const base = `/api/listings/${encodeURIComponent(listingId)}/liquidation`;
  function apply(value: Liquidation) { setData(value); setRequirements(value.requiredDocuments); setRequirementsNote(value.requirementsNote); }
  async function refresh() { try { apply(await request<Liquidation>(base)); setError(''); } catch(e) { setError((e as Error).message); } }
  useEffect(() => { let active = true; setData(null); request<Liquidation>(base).then(value => { if(active) { apply(value); setError(''); } }).catch(e => { if(active) setError(e.message); }); return () => { active = false; }; }, [base]);
  async function action(path: string, method: string, body: object) { setBusy(true); setError(''); setNotice(''); try { apply(await request<Liquidation>(base + path, { method, body: JSON.stringify({ ...body, revision: data?.revision }) })); setNotice('Saved. Readiness has been updated.'); if(path === '/authority') setCorrecting(false); } catch(e) { setError((e as Error).message); } finally { setBusy(false); } }
  async function download(doc: Document) {
    setDownloading(doc.documentId); setError('');
    try {
      const headers = new Headers(); if (appEnv.devAdminHeadersEnabled) headers.set('x-dev-admin','1');
      const response = await fetch(`/api/listings/${encodeURIComponent(listingId)}/documents/${doc.documentId}/download`, { headers, credentials: 'include' });
      if (!response.ok) throw new Error('Document download was denied or unavailable');
      const url = URL.createObjectURL(await response.blob()); const anchor = document.createElement('a'); anchor.href = url; anchor.download = doc.filename; document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch(e) { setError((e as Error).message); } finally { setDownloading(''); }
  }
  if (!data || data.listingId !== listingId) return <p>{error || 'Loading authority and documents…'} {error ? <button onClick={refresh}>Retry</button> : null}</p>;
  return <section className="liquidationReview"><h3>Authority & document review</h3><p>Separate from approval of the listing snapshot.</p>
    {error ? <p role="alert">{error}</p> : null}{notice ? <p role="status">{notice}</p> : null}<button onClick={refresh} disabled={busy}>Refresh readiness</button>
    <div className="liquidationReview__summary"><span>Listing: {label(data.listingReviewStatus)}</span><span>Authority: {label(data.authority.status)}</span><span>Documents: {data.readiness.documentsReady ? 'Satisfied' : 'Needs attention'}</span><span>Auction: {label(data.auctionStatus)}</span></div>
    <div className="liquidationReview__readiness"><h4>{data.readiness.ready ? 'Ready for auction' : 'Before this property can reach auction'}</h4>{data.readiness.ready ? <p>All prerequisites are satisfied.</p> : <ul>{data.readiness.blockers.map(blocker => <li key={blocker.code}>{blocker.label}</li>)}</ul>}</div>
    <h4>Seller authority</h4>{data.authorityLockReason ? <p className="liquidationReview__notice">{data.authorityLockReason}</p> : null}<dl>{(['relationship','legalName','representativeName','contact','brokerage','notes','reviewNote','correctionReason'] as const).map(key => <div key={key}><dt>{label(key.replace(/([a-z])([A-Z])/g,'$1 $2'))}</dt><dd>{key === 'relationship' ? label(data.authority[key]) : data.authority[key] || '—'}</dd></div>)}</dl>
    <button disabled={busy} onClick={() => setCorrecting(value => !value)}>{correcting ? 'Cancel correction' : 'Correct authority information'}</button>
    {correcting ? <AuthorityCorrection key={data.revision} authority={data.authority} busy={busy} save={body => action('/authority', 'PUT', body)} /> : null}
    <fieldset disabled={busy || data.authority.status === 'not_submitted'}><label>Authority review note<textarea maxLength={2000} value={note} onChange={e => setNote(e.target.value)} /></label><div className="liquidationReview__actions">{['verified','rejected','needs_information'].map(status => <button key={status} disabled={status !== 'verified' && !note.trim()} onClick={() => action('/authority/review','PATCH',{ status, reviewNote: note })}>{({ verified: 'Verify authority', rejected: 'Reject authority', needs_information: 'Request information' } as Record<string, string>)[status]}</button>)}</div></fieldset>
    <h4>Required documents for this property</h4><fieldset disabled={busy}>{categories.map(category => <label className="liquidationReview__check" key={category}><input type="checkbox" checked={requirements.includes(category)} onChange={e => setRequirements(e.target.checked ? [...requirements,category] : requirements.filter(c => c !== category))} />{label(category)}</label>)}<label>Requirement notes / waiver reason<textarea maxLength={2000} value={requirementsNote} onChange={e => setRequirementsNote(e.target.value)} /></label><button disabled={!requirements.length && !requirementsNote.trim()} onClick={() => action('/requirements','PUT',{ requiredDocuments: requirements, requirementsNote })}>Save requirements</button></fieldset>
    <h4>Documents</h4>{!data.documents.length ? <p>No documents uploaded.</p> : data.documents.map(doc => <DocumentReview key={`${doc.documentId}:${data.revision}`} doc={doc} busy={busy} downloading={Boolean(downloading)} download={() => download(doc)} save={body => action(`/documents/${doc.documentId}/review`, 'PATCH', body)} />)}
  </section>;
}
function DocumentReview({ doc, busy, downloading, save, download }: { doc: Document; busy: boolean; downloading: boolean; save: (body: object) => void; download: () => void }) {
  const [status, setStatus] = useState(doc.status); const [visibility, setVisibility] = useState(doc.visibility); const [note, setNote] = useState(doc.reviewNote ?? '');
  return <fieldset disabled={busy}><legend>{doc.filename}</legend><p>{label(doc.category)} · {new Date(doc.uploadedAt).toLocaleString()}</p><p>{doc.note}</p><button disabled={downloading} onClick={download}>{downloading ? 'Preparing download…' : 'Download file'}</button>
    <label>Review status<select value={status} onChange={e => { setStatus(e.target.value); if(e.target.value !== 'accepted' && ['public','approved_bidders'].includes(visibility)) setVisibility('seller_admin'); }}>{['pending','accepted','rejected','needs_information'].map(value => <option key={value} value={value}>{label(value)}</option>)}</select></label>
    <label>Who can access this file<select value={visibility} onChange={e => setVisibility(e.target.value)}>{['internal','seller_admin','approved_bidders','public'].map(value => <option key={value} value={value} disabled={status !== 'accepted' && ['public','approved_bidders'].includes(value)}>{label(value)}</option>)}</select></label><small>Only accepted files can be shared with buyers.</small>
    <label>Review note<textarea maxLength={2000} value={note} onChange={e => setNote(e.target.value)} /></label><button disabled={['rejected','needs_information'].includes(status) && !note.trim()} onClick={() => save({ status, visibility, reviewNote: note })}>Save document review</button>
  </fieldset>;
}

function AuthorityCorrection({ authority, busy, save }: { authority: Authority; busy: boolean; save: (body: object) => void }) {
  const [draft, setDraft] = useState(authority);
  const [reason, setReason] = useState('');
  return <form onSubmit={event => { event.preventDefault(); save({ ...draft, correctionReason: reason }); }}><fieldset disabled={busy}>
    <legend>Operations correction</legend><p>Explain this correction. Saving returns authority to Pending; verify it separately after review.</p>
    <label>Relationship<select value={draft.relationship} onChange={e => setDraft({ ...draft, relationship: e.target.value })}>{relationships.map(value => <option key={value} value={value}>{label(value)}</option>)}</select></label>
    {(['legalName','representativeName','contact','brokerage','notes'] as const).map(key => <label key={key}>{({legalName:'Legal / entity / estate name', representativeName:'Representative name',contact:'Email or phone',brokerage:'Brokerage',notes:'Authority explanation'})[key]}<input required={['representativeName','contact'].includes(key) || (key === 'legalName' && ['executor','entity_representative'].includes(draft.relationship)) || (key === 'brokerage' && draft.relationship === 'agent_broker') || (key === 'notes' && draft.relationship === 'other')} maxLength={key === 'notes' ? 2000 : key === 'contact' ? 500 : 300} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} /></label>)}
    <label>Correction reason<textarea required maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} /></label><button disabled={!reason.trim()} type="submit">Save correction for verification</button>
  </fieldset></form>;
}
