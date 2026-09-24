import type { Dispatch, SetStateAction } from "react";
import { request } from "../../core/api/request";
import PropertyLocation from "../../components/propertyLocation/PropertyLocation";
import type { ListingFormState, FormErrors } from "./listingForm";
export default function AddressSearch({
  form,
  setForm,
  disabled,
  errors = {},
}: {
  form: ListingFormState;
  setForm: Dispatch<SetStateAction<ListingFormState>>;
  disabled?: boolean;
  errors?: FormErrors;
}) {
  return (
    <PropertyLocation
      value={{
        address: form.address,
        city: form.city,
        state: form.state,
        zipcode: form.zipcode,
        latitude: form.latitude === "" ? undefined : Number(form.latitude),
        longitude: form.longitude === "" ? undefined : Number(form.longitude),
        coordinateSource: form.coordinateSource,
      }}
      request={request}
      disabled={disabled}
      errors={errors}
      onChange={(location) =>
        setForm((previous) => ({
          ...previous,
          ...location,
          latitude: location.latitude == null ? "" : String(location.latitude),
          longitude: location.longitude == null ? "" : String(location.longitude),
        }))
      }
    />
  );
}
