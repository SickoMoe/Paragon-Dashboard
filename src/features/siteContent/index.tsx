import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { request } from "../../core/api/request";
import { useRegisterDashboardFrame } from "../../core/useRegisterDashboardFrame";
import "./site-content.css";

type Json = string | number | boolean | Json[] | { [key: string]: Json };
type ContentDocument = { revision: number; updatedAt: string | null; data: Record<string, Json>; defaults?: Record<string, Json> };
type Inquiry = { id: string; name: string; email: string; subject: string; message: string; status: "new" | "read" | "resolved"; createdAt: string };
type Auction = { id: string; status: string; location: { address: string }; endDate: string };
const names: Record<string, string> = { home: "Live now", resources: "Resources", inquiries: "Contact inbox", faq: "Questions & answers", cta: "Closing call to action", id: "Guide link name", href: "Link destination", maxItems: "Number of auctions to show" };
const label = (key: string) => names[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
function blank(template: Json): Json {
  if (Array.isArray(template)) return [];
  if (template && typeof template === "object") return Object.fromEntries(Object.entries(template).map(([key, value]) => [key, blank(value)]));
  return typeof template === "boolean" ? true : typeof template === "number" ? 0 : "";
}
function Fields({ value, template, onChange, name }: { value: Json; template: Json; onChange: (value: Json) => void; name: string }) {
  if (Array.isArray(value)) {
    const itemTemplate = Array.isArray(template) ? template[0] ?? "" : "";
    return <fieldset className="siteContentCollection"><legend>{label(name)}</legend>{value.map((item, index) => <div className="siteContentCollection__item" key={index}><div className="siteContentCollection__actions"><strong>{label(name)} {index + 1}</strong><button type="button" disabled={!index} onClick={() => { const next = [...value]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; onChange(next); }}>Move up</button><button type="button" onClick={() => onChange(value.filter((_, i) => i !== index))}>Remove</button></div><Fields value={item} template={itemTemplate} name="Item" onChange={(next) => onChange(value.map((entry, i) => i === index ? next : entry))} /></div>)}<button type="button" onClick={() => onChange([...value, blank(itemTemplate)])}>Add item</button></fieldset>;
  }
  if (value && typeof value === "object") return <div className="siteContentFields">{Object.entries(value).map(([key, entry]) => <Fields key={key} name={key} value={entry} template={template && typeof template === "object" && !Array.isArray(template) ? template[key] : entry} onChange={(next) => onChange({ ...value, [key]: next })} />)}</div>;
  if (typeof value === "boolean") return <label className="siteContentToggle"><input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />{name === "enabled" ? "Show this section on the website" : label(name)}</label>;
  return <label className="siteContentField"><span>{label(name)}</span>{typeof value === "string" && /body|description|summary|answer|message/i.test(name) ? <textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} /> : <input type={typeof value === "number" ? "number" : "text"} min={name === "maxItems" ? 1 : undefined} max={name === "maxItems" ? 3 : undefined} value={String(value)} onChange={(event) => onChange(typeof value === "number" ? Number(event.target.value) : event.target.value)} />}</label>;
}

export default function SiteContentPage() {
  const [params, setParams] = useSearchParams();
  const page = ["home", "resources", "inquiries"].includes(params.get("page") || "") ? params.get("page")! : "home";
  const [doc, setDoc] = useState<ContentDocument | null>(null);
  const [draft, setDraft] = useState<Record<string, Json> | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [section, setSection] = useState("hero");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const loadRequest = useRef<AbortController | null>(null);
  const dirty = Boolean(doc && draft && JSON.stringify(doc.data) !== JSON.stringify(draft));
  const frame = useMemo(() => ({ title: "Website management", subtitle: "Manage live auctions, resource content, and incoming contact inquiries." }), []);
  useRegisterDashboardFrame(frame);
  const load = useCallback(async () => {
    loadRequest.current?.abort();
    const controller = new AbortController();
    loadRequest.current = controller;
    const options = { credentials: "include" as const, signal: controller.signal };
    setLoading(true); setError(""); setNotice(""); setDoc(null); setDraft(null);
    try {
      if (page === "inquiries") {
        const rows = await request<Inquiry[]>("/api/admin/site-content/inquiries", options);
        if (!controller.signal.aborted) setInquiries(rows);
      }
      else {
        const document = await request<ContentDocument>(`/api/admin/site-content/${page}`, options);
        if (controller.signal.aborted) return;
        setDoc(document); setDraft(document.data);
        if (page === "home") {
          const rows = await request<Auction[]>("/api/auctions/summaries", options);
          if (!controller.signal.aborted) setAuctions(rows);
        }
      }
    } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Couldn’t load this page."); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }, [page]);
  useEffect(() => { void load(); return () => loadRequest.current?.abort(); }, [load]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  async function save() {
    if (!doc || !draft || saving) return;
    setSaving(true); setError(""); setNotice("");
    try { const saved = await request<ContentDocument>(`/api/admin/site-content/${page}`, { method: "PUT", credentials: "include", body: JSON.stringify({ data: draft, expectedRevision: doc.revision }) }); setDoc({ ...saved, defaults: doc.defaults }); setDraft(saved.data); setNotice("Changes are saved and live on the website."); }
    catch (error) { setError(error instanceof Error ? error.message : "Couldn’t save changes."); }
    finally { setSaving(false); }
  }
  async function setInquiryStatus(item: Inquiry, status: Inquiry["status"]) {
    setSaving(true); setError("");
    try { const next = await request<Inquiry>(`/api/admin/site-content/inquiries/${item.id}`, { method: "PATCH", credentials: "include", body: JSON.stringify({ status }) }); setInquiries((current) => current.map((row) => row.id === item.id ? next : row)); }
    catch (error) { setError(error instanceof Error ? error.message : "Couldn’t update inquiry."); }
    finally { setSaving(false); }
  }
  const pinned = (draft?.pinnedAuctionIds || []) as string[];
  return <div className="siteContentPage">
    <nav className="siteContentTabs" aria-label="Website areas">{["home", "resources", "inquiries"].map((key) => <button key={key} type="button" disabled={saving} aria-pressed={page === key} onClick={() => { if (!dirty || window.confirm("Discard your unsaved content changes?")) setParams({ page: key }); }}>{label(key)}</button>)}</nav>
    {error ? <div className="siteContentError" role="alert">{error} <button type="button" disabled={saving} onClick={() => { if (!dirty || window.confirm("Reload and discard unsaved content changes?")) void load(); }}>Reload</button></div> : null}
    {notice ? <p role="status">{notice}</p> : null}
    {loading ? <p role="status">Loading…</p> : page === "inquiries" ? <div className="siteContentInbox">{!inquiries.length ? <p>No contact inquiries yet.</p> : inquiries.map((item) => <article key={item.id}><header><div><small>{item.status.toUpperCase()} · {new Date(item.createdAt).toLocaleString()}</small><h2>{item.subject}</h2><span>{item.name} · <a href={`mailto:${item.email}`}>{item.email}</a></span></div><select aria-label={`Status of ${item.subject}`} value={item.status} disabled={saving} onChange={(event) => void setInquiryStatus(item, event.target.value as Inquiry["status"])}><option value="new">New</option><option value="read">Read</option><option value="resolved">Resolved</option></select></header><p>{item.message}</p></article>)}</div> : draft && doc ? <>
      {page === "resources" ? <nav className="siteContentSectionNav" aria-label="Resource sections">{Object.keys(draft).map((key) => <button type="button" key={key} aria-pressed={section === key} onClick={() => setSection(key)}>{label(key)}</button>)}</nav> : null}
      <fieldset disabled={saving} className="siteContentEditor"><legend>{page === "home" ? "Live now section" : label(section)}</legend>
      {page === "home" ? <><Fields name="Live now" value={Object.fromEntries(Object.entries(draft).filter(([key]) => key !== "pinnedAuctionIds"))} template={doc.defaults || doc.data} onChange={(value) => setDraft({ ...(value as Record<string, Json>), pinnedAuctionIds: pinned })} /><div className="siteContentPinned"><h3>Featured priority</h3><p>Choose up to three auctions in display order. Only live auctions appear on Home; other slots fill automatically by closing time.</p>{pinned.map((id, index) => <div key={id}><strong>{index + 1}. {auctions.find((auction) => auction.id === id)?.location.address || "Unavailable auction"}</strong><button type="button" onClick={() => setDraft({ ...draft, pinnedAuctionIds: pinned.filter((value) => value !== id) })}>Remove</button></div>)}<select aria-label="Feature an auction" value="" disabled={pinned.length >= 3} onChange={(event) => setDraft({ ...draft, pinnedAuctionIds: [...pinned, event.target.value] })}><option value="">Choose an auction…</option>{auctions.filter((auction) => !pinned.includes(auction.id)).map((auction) => <option key={auction.id} value={auction.id}>{auction.location.address} · {auction.status}</option>)}</select></div></> : draft[section] !== undefined ? <Fields name={section} value={draft[section]} template={doc.defaults?.[section] ?? draft[section]} onChange={(value) => setDraft({ ...draft, [section]: value })} /> : null}
      </fieldset><footer className="siteContentSaveBar"><span>{saving ? "Saving…" : dirty ? "Unsaved changes" : doc.updatedAt ? `Saved ${new Date(doc.updatedAt).toLocaleString()}` : "Using default content"}</span><button type="button" disabled={saving || !dirty} onClick={() => setDraft(doc.data)}>Discard changes</button><button type="button" disabled={saving || !dirty} onClick={() => void save()}>{saving ? "Saving…" : "Save & publish"}</button></footer>
    </> : null}
  </div>;
}
