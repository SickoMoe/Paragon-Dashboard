import { useState, type Dispatch, type SetStateAction, type ReactNode } from "react";
import AddressSearch from "./AddressSearch";
import ListingPhotos from "./ListingPhotos";
import { listingSteps, validateForm, type ListingFormState, type FormErrors } from "./listingForm";
import "./listingEditor.css";
export function ListingFormFields({
  form,
  setForm,
  step: controlledStep,
  onStepChange,
  errors = {},
  onBusyChange,
  disabled = false,
}: {
  form: ListingFormState;
  setForm: Dispatch<SetStateAction<ListingFormState>>;
  step?: number;
  onStepChange?: (step: number) => void;
  errors?: FormErrors;
  onBusyChange?: (busy: boolean) => void;
  disabled?: boolean;
  showWorkflow?: boolean;
}) {
  const [localStep, setLocalStep] = useState(0);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const step = controlledStep ?? localStep;
  const go = (value: number) => {
    if (uploading) return;
    setLocalStep(value);
    onStepChange?.(value);
  };
  const update = <K extends keyof ListingFormState>(key: K, value: ListingFormState[K]) =>
    setForm((f) => ({
      ...f,
      [key]: value,
    }));
  const live = validateForm(form);
  const message = (key: keyof ListingFormState) =>
    errors[key] || (touched.has(key) ? live[key] : undefined);
  const field = (
    key: keyof ListingFormState,
    label: string,
    options: { required?: boolean; multiline?: boolean; number?: boolean; hint?: string } = {},
  ) => (
    <Field
      key={key}
      label={label}
      required={options.required}
      error={message(key)}
      hint={options.hint}
    >
      {options.multiline ? (
        <textarea
          aria-label={label}
          aria-invalid={Boolean(message(key))}
          rows={4}
          value={String(form[key])}
          onChange={(e) => update(key, e.target.value as never)}
          onBlur={() => setTouched((s) => new Set(s).add(key))}
        />
      ) : (
        <input
          aria-label={label}
          aria-invalid={Boolean(message(key))}
          inputMode={options.number ? "decimal" : undefined}
          value={String(form[key])}
          onChange={(e) => update(key, e.target.value as never)}
          onBlur={() => setTouched((s) => new Set(s).add(key))}
        />
      )}
    </Field>
  );
  return (
    <div className="listing-editor">
      <nav aria-label="Property form sections" className="listing-editor__steps">
        {listingSteps.map((label, i) => (
          <button
            key={label}
            type="button"
            aria-current={step === i ? "step" : undefined}
            disabled={uploading || disabled}
            onClick={() => go(i)}
          >
            {label}
          </button>
        ))}
      </nav>
      <p className="listing-hint">
        {listingSteps[step]} · {step + 1} of {listingSteps.length}. Move between sections freely.
        Required fields apply when completing the property.
      </p>
      <fieldset disabled={disabled || uploading} className="listing-editor__fields">
        {step === 0 ? (
          <>
            <div className="listing-grid">
              {field("title", "Listing title", { required: true })}
              <Field label="Property type" required error={message("type")}>
                <select
                  aria-label="Property type"
                  value={form.type}
                  onChange={(e) => update("type", e.target.value)}
                >
                  {[
                    ...new Set([
                      "Residential",
                      "Condo",
                      "Multi Family",
                      "Commercial",
                      "Land",
                      form.type,
                    ]),
                  ]
                    .filter(Boolean)
                    .map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                </select>
              </Field>
            </div>
            <AddressSearch
              form={form}
              setForm={setForm}
              disabled={disabled}
              errors={{
                address: message("address"),
                city: message("city"),
                state: message("state"),
                zipcode: message("zipcode"),
                latitude: message("latitude"),
                longitude: message("longitude"),
              }}
            />
          </>
        ) : null}
        {step === 1 ? (
          <>
            <div className="listing-grid">
              {field("bedrooms", "Bedrooms", { number: true })}
              {field("bathrooms", "Bathrooms", { number: true })}
              {field("buildingSQFT", "Square footage")}
              {field("lotSize", "Lot size")}
              {field("yearBuilt", "Year built", { number: true })}
            </div>
            {field("overview", "Overview", { required: true, multiline: true })}
            {field("detailedDescription", "Detailed description", { multiline: true })}
            <details>
              <summary>Optional amenities</summary>
              {field("amenities", "Amenities", { multiline: true, hint: "One amenity per line." })}
            </details>
          </>
        ) : null}
        {step === 2 ? (
          <ListingPhotos
            form={form}
            setForm={setForm}
            disabled={disabled}
            onBusyChange={(value) => {
              setUploading(value);
              onBusyChange?.(value);
            }}
          />
        ) : null}
        {step === 3 ? (
          <>
            <h4>Seller contact</h4>
            <div className="listing-grid">
              {field("sellerName", "Seller name")}
              {field("sellerContact", "Seller email or phone")}
            </div>
            {field("biddingSupport", "Bidding support contact")}
            <details>
              <summary>Legal & additional information (optional)</summary>
              <div className="listing-grid">
                {field("titleStatus", "Title status")}
                {field("zoningInformation", "Zoning")}
              </div>
              {field("inspectionDetails", "Inspection details", { multiline: true })}
              {field("financingOptions", "Financing options", {
                multiline: true,
                hint: "One option per line.",
              })}
            </details>
          </>
        ) : null}
        {step === 4 ? (
          <>
            {field("termsAndConditions", "Terms and conditions", {
              multiline: true,
              hint: "Auction launch requires approved terms. Saving operational terms does not replace a historical approved review.",
            })}
            <label className="listing-check">
              <input
                type="checkbox"
                checked={form.socialSharing}
                onChange={(e) => update("socialSharing", e.target.checked)}
              />
              Allow social sharing
            </label>
            <div className="listing-review">
              <h4>Property summary</h4>
              <strong>{form.title || "Title not added"}</strong>
              <p>
                {[form.address, form.city, form.state, form.zipcode].filter(Boolean).join(", ") ||
                  "Address not added"}
              </p>
              <p>
                {form.type} · {form.bedrooms || 0} beds · {form.bathrooms || 0} baths
              </p>
              <p>
                {form.images.split("\n").filter(Boolean).length} photos ·{" "}
                {form.latitude && form.longitude ? "Map coordinates set" : "No map coordinates"}
              </p>
            </div>
            {Object.entries(validateForm(form, true)).length ? (
              <div className="listing-warning">
                <strong>Before completing the property</strong>
                <ul>
                  {Object.entries(validateForm(form, true)).map(([key, value]) => (
                    <li key={key}>
                      <button type="button" onClick={() => go(key === "overview" ? 1 : 0)}>
                        {(
                          {
                            title: "Listing title",
                            type: "Property type",
                            address: "Street address",
                            city: "City",
                            state: "State",
                            zipcode: "ZIP code",
                          } as Record<string, string>
                        )[key] || key}
                        : {value}
                      </button>
                    </li>
                  ))}
                </ul>
                <p>You can save an incomplete draft at any time.</p>
              </div>
            ) : (
              <p className="listing-success">Required property information is complete.</p>
            )}
          </>
        ) : null}
      </fieldset>
      {message("images") ? (
        <p role="alert" className="listing-error">
          {message("images")}
        </p>
      ) : null}
      <div className="listing-editor__navigation">
        <button
          type="button"
          disabled={step === 0 || disabled || uploading}
          onClick={() => go(step - 1)}
        >
          Back
        </button>
        {step < 4 ? (
          <button type="button" disabled={disabled || uploading} onClick={() => go(step + 1)}>
            Continue →
          </button>
        ) : null}
      </div>
    </div>
  );
}
function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="listing-field">
      <span>
        {label}
        {required ? <small>Required</small> : null}
      </span>
      {children}
      {hint ? <small>{hint}</small> : null}
      {error ? (
        <small className="listing-error" role="alert">
          {error}
        </small>
      ) : null}
    </label>
  );
}
